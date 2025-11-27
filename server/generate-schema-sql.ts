import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Map JavaScript types to PostgreSQL types based on sample data
function inferPgType(value: any, columnName: string): string {
  if (columnName === 'id') return 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
  if (columnName.endsWith('_id') && typeof value === 'string') return 'UUID REFERENCES';
  if (columnName.endsWith('_at') || columnName.endsWith('_date') || columnName.includes('date')) return 'TIMESTAMPTZ';
  if (columnName === 'created_at' || columnName === 'updated_at') return 'TIMESTAMPTZ DEFAULT NOW()';
  
  if (value === null) return 'TEXT'; // Default for null
  if (typeof value === 'boolean') return 'BOOLEAN DEFAULT FALSE';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return 'INTEGER DEFAULT 0';
    return 'NUMERIC(10,2) DEFAULT 0';
  }
  if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'TIMESTAMPTZ';
    if (value.length > 500) return 'TEXT';
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
  sqlStatements.push('-- Generated schema for Supabase dev branch');
  sqlStatements.push('-- Run this in the Supabase SQL Editor on your dev branch\n');

  for (const entity of entities) {
    const { data, error } = await supabase.from(entity).select('*').limit(5);
    
    if (error) continue;
    if (!data || data.length === 0) {
      sqlStatements.push(`-- Table ${entity} exists but has no data to infer schema`);
      continue;
    }

    // Get all unique columns from multiple rows to handle nulls
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

    // Fill in defaults for columns that were always null
    for (const col of allColumns) {
      if (!columnTypes[col]) {
        columnTypes[col] = inferPgType(null, col);
      }
    }

    // Generate CREATE TABLE
    const columns = Array.from(allColumns).map(col => {
      let type = columnTypes[col];
      // Simplify reference types for now
      if (type.includes('REFERENCES')) type = 'UUID';
      return `  ${col} ${type}`;
    });

    sqlStatements.push(`-- Table: ${entity}`);
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${entity} (`);
    sqlStatements.push(columns.join(',\n'));
    sqlStatements.push(');\n');
  }

  console.log(sqlStatements.join('\n'));
}

generateSchemaSQL();
