import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

interface MemberGroupGuestCSV {
  first_name: string;
  last_name: string;
  email: string;
  organisation: string;
  job_title: string;
  is_active: string;
  id: string;
  created_date: string;
  updated_date: string;
  created_by_id: string;
  created_by: string;
  is_sample: string;
}

async function importMemberGroupGuests() {
  console.log('=== Importing Member Group Guests from CSV ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });
  
  const csvPath = 'attached_assets/MemberGroupGuest_export_1764149149211.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: MemberGroupGuestCSV[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${records.length} guest(s) to import\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      const guest = {
        first_name: record.first_name,
        last_name: record.last_name,
        email: record.email,
        organisation: record.organisation || null,
        job_title: record.job_title || null,
        is_active: record.is_active === 'true'
      };
      
      // Check if already exists by email
      const { data: existingByEmail } = await supabase
        .from('member_group_guest')
        .select('id')
        .eq('email', record.email)
        .single();
      
      if (existingByEmail) {
        console.log(`Skipping (email exists): ${record.first_name} ${record.last_name} (${record.email})`);
        skipCount++;
        continue;
      }
      
      const { error } = await supabase
        .from('member_group_guest')
        .insert(guest);
      
      if (error) {
        console.error(`Error importing "${record.first_name} ${record.last_name}":`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Imported: ${record.first_name} ${record.last_name} (${record.email})`);
        successCount++;
      }
      
    } catch (error: any) {
      console.error(`Error processing "${record.first_name} ${record.last_name}":`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n=== Import Complete ===');
  console.log(`Imported: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
}

importMemberGroupGuests().catch(console.error);
