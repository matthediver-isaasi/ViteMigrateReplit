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

async function importJobPostings() {
  try {
    const csvPath = path.join(process.cwd(), 'attached_assets', 'JobPosting_export_1764139999849.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    console.log(`Found ${records.length} job postings to import`);

    for (const record of records) {
      // Skip if no title
      if (!record.title) {
        console.log('Skipping record with no title');
        continue;
      }

      // Look up member by email if posted_by_member_id looks like a Base44 ID
      let postedByMemberId: string | null = null;
      if (record.posted_by_member_id) {
        if (record.posted_by_member_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          postedByMemberId = record.posted_by_member_id;
        }
        // For Base44 IDs, we'd need to look up by email but we don't have that mapping here
      }

      const jobPosting = {
        id: uuidv4(),
        title: record.title || '',
        description: record.description || null,
        company_name: record.company_name || null,
        company_logo_url: record.company_logo_url || null,
        location: record.location || null,
        salary_range: record.salary_range || null,
        job_type: record.job_type || null,
        application_method: record.application_method || null,
        application_value: record.application_value || null,
        contact_email: record.contact_email || null,
        contact_name: record.contact_name || null,
        posted_by_member_id: postedByMemberId,
        is_member_post: record.is_member_post === 'true',
        status: record.status || 'pending_approval',
        payment_status: record.payment_status || null,
        stripe_payment_intent_id: record.stripe_payment_intent_id || null,
        stripe_checkout_session_id: record.stripe_checkout_session_id || null,
        amount_paid: record.amount_paid ? parseFloat(record.amount_paid) : null,
        expiry_date: record.expiry_date || null,
        closing_date: record.closing_date || null,
        featured: record.featured === 'true',
      };

      console.log(`Importing: "${jobPosting.title.substring(0, 50)}..." (${jobPosting.status})`);

      const { data, error } = await supabase
        .from('job_posting')
        .insert(jobPosting)
        .select();

      if (error) {
        console.error(`Error importing "${jobPosting.title}":`, error.message);
      } else {
        console.log(`Successfully imported: "${jobPosting.title.substring(0, 50)}..."`);
      }
    }

    console.log('\nImport completed!');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importJobPostings();
