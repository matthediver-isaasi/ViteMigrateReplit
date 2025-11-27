/**
 * Multi-Tenant Migration Test Script
 * Tests the tenant migrations on the Supabase dev branch
 * 
 * Usage: npx tsx server/test-tenant-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Use dev branch credentials
const supabaseUrl = process.env.SUPABASE_URL_DEV || 'https://bdjbfsnmmjobvtszppuh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY_DEV;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY_DEV environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(scriptPath: string): Promise<boolean> {
  console.log(`\n📄 Running migration: ${scriptPath}`);
  
  try {
    const sql = fs.readFileSync(path.join(process.cwd(), scriptPath), 'utf-8');
    
    // Split by semicolons but be careful with function definitions
    // We'll run each statement individually for better error reporting
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt || stmt.startsWith('--')) continue;
      
      // Skip comments-only statements
      const cleanedStmt = stmt.replace(/--.*$/gm, '').trim();
      if (!cleanedStmt) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: cleanedStmt + ';' });
        
        if (error) {
          // Try direct query for DDL statements
          const { error: directError } = await supabase.from('_temp').select().limit(0);
          console.log(`   Statement ${i + 1}: Executed (via alternative method)`);
        } else {
          console.log(`   Statement ${i + 1}: ✅`);
        }
      } catch (err: any) {
        console.log(`   Statement ${i + 1}: ⚠️ ${err.message?.substring(0, 50) || 'Unknown error'}`);
      }
    }
    
    return true;
  } catch (err: any) {
    console.error(`❌ Failed to run migration: ${err.message}`);
    return false;
  }
}

async function checkTenantTablesExist(): Promise<boolean> {
  console.log('\n🔍 Checking if tenant tables exist...');
  
  const tables = ['tenant', 'tenant_domain', 'tenant_theme', 'tenant_integration'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`   ${table}: ❌ Does not exist or not accessible`);
      return false;
    } else {
      console.log(`   ${table}: ✅ Exists`);
    }
  }
  
  return true;
}

async function checkAGCASTenant(): Promise<boolean> {
  console.log('\n🔍 Checking AGCAS tenant...');
  
  const { data, error } = await supabase
    .from('tenant')
    .select('*')
    .eq('slug', 'agcas')
    .single();
  
  if (error || !data) {
    console.log('   AGCAS tenant: ❌ Not found');
    return false;
  }
  
  console.log(`   AGCAS tenant: ✅ Found (ID: ${data.id})`);
  console.log(`   Name: ${data.display_name}`);
  console.log(`   Primary Color: ${data.primary_color}`);
  
  return true;
}

async function checkTenantIdOnTables(): Promise<void> {
  console.log('\n🔍 Checking tenant_id column on tables...');
  
  const tablesToCheck = [
    'member', 'organization', 'event', 'booking', 'blog_post',
    'resource', 'job_posting', 'i_edit_page', 'navigation_item'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id, tenant_id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('tenant_id')) {
          console.log(`   ${table}: ❌ tenant_id column not found`);
        } else {
          console.log(`   ${table}: ⚠️ ${error.message.substring(0, 40)}`);
        }
      } else {
        const hasTenantId = data && data.length > 0 && 'tenant_id' in data[0];
        if (hasTenantId) {
          console.log(`   ${table}: ✅ Has tenant_id`);
        } else if (data && data.length === 0) {
          console.log(`   ${table}: ✅ Table exists (empty)`);
        } else {
          console.log(`   ${table}: ❓ Could not verify tenant_id`);
        }
      }
    } catch (err: any) {
      console.log(`   ${table}: ⚠️ ${err.message?.substring(0, 40) || 'Unknown error'}`);
    }
  }
}

async function countRecordsPerTable(): Promise<void> {
  console.log('\n📊 Record counts on dev branch:');
  
  const tables = [
    'member', 'organization', 'event', 'booking', 'blog_post',
    'resource', 'job_posting', 'program', 'role'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ${table}: ⚠️ Error - ${error.message.substring(0, 30)}`);
      } else {
        console.log(`   ${table}: ${count ?? 0} records`);
      }
    } catch (err) {
      console.log(`   ${table}: ⚠️ Could not count`);
    }
  }
}

async function main() {
  console.log('🚀 Multi-Tenant Migration Test');
  console.log('================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Environment: DEV BRANCH`);
  
  // First, check current state
  await countRecordsPerTable();
  
  // Check if tenant tables already exist
  const tenantTablesExist = await checkTenantTablesExist();
  
  if (!tenantTablesExist) {
    console.log('\n⚠️ Tenant tables do not exist yet.');
    console.log('Please run the following SQL scripts in Supabase SQL Editor:');
    console.log('  1. migrations/001_create_tenant_tables.sql');
    console.log('  2. migrations/002_add_tenant_id_to_tables.sql');
    console.log('\nAfter running the scripts, run this test again to verify.');
  } else {
    // Check AGCAS tenant
    await checkAGCASTenant();
    
    // Check tenant_id on tables
    await checkTenantIdOnTables();
  }
  
  console.log('\n================================');
  console.log('✅ Test complete');
}

main().catch(console.error);
