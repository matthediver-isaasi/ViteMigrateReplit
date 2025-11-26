import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAssignedDateColumn() {
  console.log('=== Adding assigned_date column to offline_award_assignment ===');
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE offline_award_assignment 
        ADD COLUMN IF NOT EXISTS assigned_date timestamptz DEFAULT now();
      `
    });

    if (error) {
      console.log('Note: RPC method not available, trying alternative approach...');
      
      const { data: testData, error: testError } = await supabase
        .from('offline_award_assignment')
        .select('assigned_date')
        .limit(1);
      
      if (testError && testError.message.includes('assigned_date')) {
        console.log('\nThe column does not exist yet.');
        console.log('\nPlease run this SQL in your Supabase SQL Editor:');
        console.log('----------------------------------------');
        console.log(`
ALTER TABLE offline_award_assignment 
ADD COLUMN IF NOT EXISTS assigned_date timestamptz DEFAULT now();

UPDATE offline_award_assignment 
SET assigned_date = now() 
WHERE assigned_date IS NULL;
        `);
        console.log('----------------------------------------');
        console.log('\nAfter running the SQL, the assigned_date column will be available.');
      } else if (!testError) {
        console.log('Column already exists! Current data sample:');
        console.log(testData);
      } else {
        console.log('Error checking column:', testError.message);
      }
    } else {
      console.log('Column added successfully via RPC!');
      
      const { error: updateError } = await supabase
        .from('offline_award_assignment')
        .update({ assigned_date: new Date().toISOString() })
        .is('assigned_date', null);
      
      if (updateError) {
        console.log('Note: Could not backfill existing records:', updateError.message);
      } else {
        console.log('Backfilled existing records with current date.');
      }
    }
    
    console.log('\nVerifying column existence...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('offline_award_assignment')
      .select('id, assigned_date')
      .limit(3);
    
    if (verifyError) {
      console.log('Verification error:', verifyError.message);
    } else {
      console.log('Sample data with assigned_date:', verifyData);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

addAssignedDateColumn();
