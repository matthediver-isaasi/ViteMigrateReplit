import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

interface SupportTicketCSV {
  type: string;
  subject: string;
  description: string;
  severity: string;
  status: string;
  priority: string;
  submitter_email: string;
  submitter_name: string;
  assigned_to: string;
  attachments: string;
  resolution_notes: string;
  id: string;
  created_date: string;
  updated_date: string;
  created_by_id: string;
  created_by: string;
  is_sample: string;
}

async function importSupportTickets() {
  console.log('=== Importing Support Tickets from CSV ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });
  
  const csvPath = 'attached_assets/SupportTicket_export_1764149709672.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: SupportTicketCSV[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${records.length} support ticket(s) to import\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const record of records) {
    try {
      // Parse attachments from JSON string
      let attachments: string[] = [];
      try {
        attachments = JSON.parse(record.attachments);
      } catch {
        attachments = [];
      }
      
      const ticket = {
        type: record.type,
        subject: record.subject,
        description: record.description || null,
        severity: record.severity,
        status: record.status,
        priority: record.priority,
        submitter_email: record.submitter_email,
        submitter_name: record.submitter_name,
        assigned_to: record.assigned_to || null,
        attachments: attachments,
        resolution_notes: record.resolution_notes || null
      };
      
      // Check if already exists by subject and submitter_email (basic dedup)
      const { data: existing } = await supabase
        .from('support_ticket')
        .select('id')
        .eq('subject', record.subject)
        .eq('submitter_email', record.submitter_email)
        .single();
      
      if (existing) {
        console.log(`Skipping (already exists): ${record.subject}`);
        skipCount++;
        continue;
      }
      
      const { error } = await supabase
        .from('support_ticket')
        .insert(ticket);
      
      if (error) {
        console.error(`Error importing "${record.subject}":`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Imported: ${record.subject}`);
        successCount++;
      }
      
    } catch (error: any) {
      console.error(`Error processing "${record.subject}":`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n=== Import Complete ===');
  console.log(`Imported: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
}

importSupportTickets().catch(console.error);
