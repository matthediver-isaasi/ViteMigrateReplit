import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Store Base44 ID to Supabase UUID mappings
const offlineAwardIdMap: Record<string, string> = {};

async function importOfflineAwards() {
  console.log('\n=== Importing Offline Awards ===');
  const csvPath = path.join(process.cwd(), 'attached_assets', 'OfflineAward_export_1764141878001.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  console.log(`Found ${records.length} offline awards to import`);

  // Check for existing offline awards
  const { data: existingAwards } = await supabase.from('offline_award').select('id, name, base44_id');
  const existingBase44Ids = new Set((existingAwards || []).map(a => a.base44_id).filter(Boolean));

  // Build mapping from existing records
  for (const existing of existingAwards || []) {
    if (existing.base44_id) {
      offlineAwardIdMap[existing.base44_id] = existing.id;
    }
  }

  for (const record of records) {
    if (!record.name) continue;

    const base44Id = record.id;
    
    // Skip if already exists by base44_id
    if (existingBase44Ids.has(base44Id)) {
      console.log(`Skipping OfflineAward "${record.name}" - already exists`);
      continue;
    }

    const newId = uuidv4();
    offlineAwardIdMap[base44Id] = newId;

    const offlineAward = {
      id: newId,
      name: record.name.trim(),
      description: record.description || null,
      period_text: record.period_text || null,
      level: record.level ? parseInt(record.level) : null,
      image_url: record.image_url || null,
      is_active: record.is_active === 'true',
      base44_id: base44Id,
    };

    console.log(`Importing OfflineAward: "${offlineAward.name}" (level ${offlineAward.level})`);

    const { data, error } = await supabase
      .from('offline_award')
      .insert(offlineAward)
      .select();

    if (error) {
      console.error(`Error importing "${offlineAward.name}":`, error.message);
    } else {
      console.log(`Successfully imported OfflineAward: "${offlineAward.name}"`);
    }
  }

  return offlineAwardIdMap;
}

async function linkSublevelsToOfflineAwards(idMap: Record<string, string>) {
  console.log('\n=== Linking Sublevels to Offline Awards ===');
  
  // Read the AwardSublevel CSV to get the offline_award_id mappings
  const csvPath = path.join(process.cwd(), 'attached_assets', 'AwardSublevel_export_1764141327725.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  // Get existing sublevels
  const { data: sublevels } = await supabase.from('award_sublevel').select('id, name');
  
  for (const record of records) {
    if (!record.name || !record.offline_award_id) continue;
    
    const sublevel = sublevels?.find(s => s.name === record.name);
    const offlineAwardId = idMap[record.offline_award_id];
    
    if (sublevel && offlineAwardId) {
      console.log(`Linking sublevel "${record.name}" to offline award ${offlineAwardId}`);
      
      const { error } = await supabase
        .from('award_sublevel')
        .update({ offline_award_id: offlineAwardId })
        .eq('id', sublevel.id);
      
      if (error) {
        console.error(`Error linking "${record.name}":`, error.message);
      } else {
        console.log(`Successfully linked sublevel "${record.name}"`);
      }
    } else {
      if (!sublevel) console.log(`Sublevel "${record.name}" not found in database`);
      if (!offlineAwardId) console.log(`OfflineAward mapping not found for ${record.offline_award_id}`);
    }
  }
}

async function main() {
  try {
    const idMap = await importOfflineAwards();
    await linkSublevelsToOfflineAwards(idMap);
    console.log('\n=== All imports completed! ===');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
