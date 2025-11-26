import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'file-repository';
const PROGRESS_FILE = path.join(__dirname, 'file-migration-progress.json');
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const CONCURRENT_UPLOADS = 3;

interface FileRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  mime_type?: string;
  file_size?: number;
  folder_id?: string;
}

interface MigrationProgress {
  migratedIds: string[];
  failedIds: { id: string; error: string }[];
  lastRunAt: string;
}

function loadProgress(): MigrationProgress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.log('Could not load progress file, starting fresh');
  }
  return { migratedIds: [], failedIds: [], lastRunAt: '' };
}

function saveProgress(progress: MigrationProgress) {
  progress.lastRunAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function ensureBucketExists(supabase: SupabaseClient) {
  console.log(`Checking if bucket "${BUCKET_NAME}" exists...`);
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    throw listError;
  }
  
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log(`Creating bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      throw createError;
    }
    console.log('Bucket created successfully');
  } else {
    console.log('Bucket already exists');
  }
}

async function downloadFile(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    return { 
      buffer: Buffer.from(arrayBuffer),
      contentType 
    };
  } catch (error) {
    console.error(`Failed to download from ${url}:`, error);
    return null;
  }
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 200);
}

async function uploadToSupabase(
  supabase: SupabaseClient,
  file: FileRecord,
  fileData: { buffer: Buffer; contentType: string }
): Promise<string | null> {
  const folderPath = file.folder_id || 'root';
  const sanitizedName = sanitizeFileName(file.file_name);
  const storagePath = `${folderPath}/${file.id}-${sanitizedName}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileData.buffer, {
      contentType: fileData.contentType,
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) {
    console.error(`Upload error for ${file.file_name}:`, error);
    return null;
  }
  
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);
  
  return publicUrlData.publicUrl;
}

async function updateFileRecord(
  supabase: SupabaseClient,
  fileId: string,
  newUrl: string
): Promise<boolean> {
  const { error } = await supabase
    .from('file_repository')
    .update({ 
      file_url: newUrl,
      migrated_at: new Date().toISOString()
    })
    .eq('id', fileId);
  
  if (error) {
    console.error(`Failed to update file record ${fileId}:`, error);
    return false;
  }
  return true;
}

async function migrateFile(
  supabase: SupabaseClient,
  file: FileRecord,
  retries = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!file.file_url || file.file_url.includes(SUPABASE_URL!)) {
      return { success: true }; // Already migrated or no URL
    }
    
    console.log(`Migrating: ${file.file_name} (${file.id})`);
    
    const fileData = await downloadFile(file.file_url);
    if (!fileData) {
      return { success: false, error: 'Failed to download file' };
    }
    
    const newUrl = await uploadToSupabase(supabase, file, fileData);
    if (!newUrl) {
      return { success: false, error: 'Failed to upload to Supabase' };
    }
    
    const updated = await updateFileRecord(supabase, file.id, newUrl);
    if (!updated) {
      return { success: false, error: 'Failed to update database record' };
    }
    
    console.log(`  ✓ Migrated successfully: ${newUrl}`);
    return { success: true };
    
  } catch (error: any) {
    if (retries < MAX_RETRIES) {
      console.log(`  Retry ${retries + 1}/${MAX_RETRIES} for ${file.file_name}`);
      await new Promise(r => setTimeout(r, 1000 * (retries + 1)));
      return migrateFile(supabase, file, retries + 1);
    }
    return { success: false, error: error.message || 'Unknown error' };
  }
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

async function runMigration(dryRun = false) {
  console.log('=== File Migration to Supabase Storage ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });
  
  const progress = loadProgress();
  console.log(`Previously migrated: ${progress.migratedIds.length} files`);
  console.log(`Previously failed: ${progress.failedIds.length} files\n`);
  
  if (!dryRun) {
    await ensureBucketExists(supabase);
  }
  
  console.log('Fetching files from database...');
  const { data: files, error } = await supabase
    .from('file_repository')
    .select('id, file_name, file_url, file_type, mime_type, file_size, folder_id')
    .order('created_date', { ascending: true });
  
  if (error) {
    console.error('Failed to fetch files:', error);
    process.exit(1);
  }
  
  if (!files || files.length === 0) {
    console.log('No files found to migrate');
    return;
  }
  
  console.log(`Found ${files.length} total files`);
  
  const filesToMigrate = files.filter((f: FileRecord) => {
    if (progress.migratedIds.includes(f.id)) return false;
    if (!f.file_url) return false;
    if (f.file_url.includes(SUPABASE_URL!)) return false;
    return true;
  });
  
  console.log(`Files to migrate: ${filesToMigrate.length}\n`);
  
  if (dryRun) {
    console.log('DRY RUN - No files will be migrated');
    console.log('\nFirst 10 files that would be migrated:');
    filesToMigrate.slice(0, 10).forEach((f: FileRecord) => {
      console.log(`  - ${f.file_name}: ${f.file_url}`);
    });
    return;
  }
  
  if (filesToMigrate.length === 0) {
    console.log('All files have already been migrated!');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < filesToMigrate.length; i += CONCURRENT_UPLOADS) {
    const batch = filesToMigrate.slice(i, i + CONCURRENT_UPLOADS);
    
    const results = await Promise.all(
      batch.map(async (file: FileRecord) => {
        const result = await migrateFile(supabase, file);
        return { file, result };
      })
    );
    
    for (const { file, result } of results) {
      if (result.success) {
        progress.migratedIds.push(file.id);
        successCount++;
      } else {
        progress.failedIds.push({ id: file.id, error: result.error || 'Unknown' });
        failCount++;
      }
    }
    
    saveProgress(progress);
    
    const processed = Math.min(i + CONCURRENT_UPLOADS, filesToMigrate.length);
    console.log(`\nProgress: ${processed}/${filesToMigrate.length} (${successCount} success, ${failCount} failed)`);
  }
  
  console.log('\n=== Migration Complete ===');
  console.log(`Total migrated: ${successCount}`);
  console.log(`Total failed: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\nFailed files:');
    progress.failedIds.slice(-10).forEach(f => {
      console.log(`  - ${f.id}: ${f.error}`);
    });
  }
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

runMigration(dryRun).catch(console.error);
