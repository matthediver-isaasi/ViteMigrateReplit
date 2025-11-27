import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

function inferPgType(value: any, columnName: string): string {
  if (columnName === 'id') return 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
  if (columnName.endsWith('_at') || columnName.endsWith('_date') || columnName.includes('date')) return 'TIMESTAMPTZ';
  
  if (value === null) return 'TEXT';
  if (typeof value === 'boolean') return 'BOOLEAN DEFAULT FALSE';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return 'INTEGER DEFAULT 0';
    return 'NUMERIC(10,2) DEFAULT 0';
  }
  if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'TIMESTAMPTZ';
    return 'TEXT';
  }
  if (Array.isArray(value)) return 'JSONB DEFAULT \'[]\'::jsonb';
  if (typeof value === 'object') return 'JSONB DEFAULT \'{}\'::jsonb';
  return 'TEXT';
}

async function generateSchemaSQL() {
  const entities = [
    'member', 'organization', 'event', 'booking', 'role', 'team_member',
    'blog_post', 'resource', 'news_post', 'program', 'program_ticket_transaction',
    'navigation_item', 'portal_menu', 'page_banner', 'tour_group', 'tour_step',
    'system_settings', 'i_edit_page', 'i_edit_page_element', 'zoho_token', 'xero_token',
    'voucher', 'discount_code'
  ];

  const sqlStatements: string[] = [];
  sqlStatements.push('-- =====================================================');
  sqlStatements.push('-- Schema Migration for Supabase Dev Branch');
  sqlStatements.push('-- Generated from production database');
  sqlStatements.push('-- Run this in Supabase SQL Editor on your dev branch');
  sqlStatements.push('-- =====================================================\n');

  for (const entity of entities) {
    const { data, error } = await supabase.from(entity).select('*').limit(10);
    
    if (error) {
      sqlStatements.push(`-- Skipped ${entity}: ${error.message}\n`);
      continue;
    }
    if (!data || data.length === 0) {
      // Create empty table with just id
      sqlStatements.push(`-- Table: ${entity} (empty in production)`);
      sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${entity} (`);
      sqlStatements.push('  id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      sqlStatements.push(');\n');
      continue;
    }

    const allColumns = new Set<string>();
    const columnTypes: Record<string, string> = {};
    
    for (const row of data) {
      for (const [key, value] of Object.entries(row)) {
        allColumns.add(key);
        if (value !== null && !columnTypes[key]) {
          columnTypes[key] = inferPgType(value, key);
        }
      }
    }

    for (const col of allColumns) {
      if (!columnTypes[col]) {
        columnTypes[col] = inferPgType(null, col);
      }
    }

    // Order columns: id first, then alphabetically
    const orderedColumns = ['id', ...Array.from(allColumns).filter(c => c !== 'id').sort()];

    const columns = orderedColumns.map(col => {
      let type = columnTypes[col];
      if (type.includes('REFERENCES')) type = 'UUID';
      return `  ${col} ${type}`;
    });

    sqlStatements.push(`-- Table: ${entity}`);
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${entity} (`);
    sqlStatements.push(columns.join(',\n'));
    sqlStatements.push(');\n');
  }

  // Write to file
  const outputPath = 'migrations/003_create_schema_dev_branch.sql';
  fs.writeFileSync(outputPath, sqlStatements.join('\n'));
  console.log(`\n✅ Schema SQL written to: ${outputPath}`);
  console.log(`\nTotal tables: ${entities.length}`);
  console.log('\nNext steps:');
  console.log('1. Open Supabase Dashboard > SQL Editor');
  console.log('2. Select your DEV branch');
  console.log('3. Copy and paste the contents of migrations/003_create_schema_dev_branch.sql');
  console.log('4. Run the SQL');
}

generateSchemaSQL();
