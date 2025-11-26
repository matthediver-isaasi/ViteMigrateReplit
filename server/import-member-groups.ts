import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

interface MemberGroupCSV {
  name: string;
  description: string;
  roles: string;
  is_active: string;
  id: string;
  created_date: string;
  updated_date: string;
  created_by_id: string;
  created_by: string;
  is_sample: string;
}

async function importMemberGroups() {
  console.log('=== Importing Member Groups from CSV ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });
  
  const csvPath = 'attached_assets/MemberGroup_export_1764147708556.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: MemberGroupCSV[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${records.length} member groups to import\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      // Parse roles from JSON string
      let roles: string[] = [];
      try {
        roles = JSON.parse(record.roles);
      } catch {
        roles = [];
      }
      
      const memberGroup = {
        name: record.name,
        description: record.description || null,
        roles: roles,
        is_active: record.is_active === 'true'
      };
      
      // Check if already exists by name
      const { data: existingByName } = await supabase
        .from('member_group')
        .select('id')
        .eq('name', record.name)
        .single();
      
      if (existingByName) {
        console.log(`Skipping (name exists): ${record.name}`);
        skipCount++;
        continue;
      }
      
      const { error } = await supabase
        .from('member_group')
        .insert(memberGroup);
      
      if (error) {
        console.error(`Error importing "${record.name}":`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Imported: ${record.name}`);
        successCount++;
      }
      
    } catch (error: any) {
      console.error(`Error processing "${record.name}":`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n=== Import Complete ===');
  console.log(`Imported: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
}

importMemberGroups().catch(console.error);
