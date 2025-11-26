#!/usr/bin/env node
/**
 * Base44 to Supabase Data Migration Script
 * 
 * This script migrates data from Base44 CSV exports to Supabase,
 * properly handling ID mappings and foreign key relationships.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const EXPORT_DIR = './attached_assets/base44_export';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ID mapping: base44_id -> supabase_uuid
const idMapping = new Map();

// Table name mapping (Base44 name -> Supabase table name)
const tableNameMap = {
  'Member': 'member',
  'Organization': 'organization',
  'Event': 'event',
  'Booking': 'booking',
  'ProgramTicketTransaction': 'program_ticket_transaction',
  'MagicLink': 'magic_link',
  'OrganizationContact': 'organization_contact',
  'Program': 'program',
  'BlogPost': 'blog_post',
  'Role': 'role',
  'TeamMember': 'team_member',
  'DiscountCode': 'discount_code',
  'SystemSettings': 'system_settings',
  'Resource': 'resource',
  'ResourceCategory': 'resource_category',
  'FileRepository': 'file_repository',
  'FileRepositoryFolder': 'file_repository_folder',
  'JobPosting': 'job_posting',
  'PageBanner': 'page_banner',
  'IEditPage': 'iedit_page',
  'IEditPageElement': 'iedit_page_element',
  'IEditElementTemplate': 'iedit_element_template',
  'NavigationItem': 'navigation_item',
  'ArticleComment': 'article_comment',
  'CommentReaction': 'comment_reaction',
  'ArticleReaction': 'article_reaction',
  'ArticleView': 'article_view',
  'ButtonStyle': 'button_style',
  'Award': 'award',
  'OfflineAward': 'offline_award',
  'OfflineAwardAssignment': 'offline_award_assignment',
  'WallOfFameSection': 'wall_of_fame_section',
  'WallOfFameCategory': 'wall_of_fame_category',
  'WallOfFamePerson': 'wall_of_fame_person',
  'Floater': 'floater',
  'Form': 'form',
  'FormSubmission': 'form_submission',
  'TourGroup': 'tour_group',
  'TourStep': 'tour_step',
  'NewsPost': 'news_post',
  'ResourceAuthorSettings': 'resource_author_settings',
  'ZohoToken': 'zoho_token',
  'XeroToken': 'xero_token',
  'PortalMenu': 'portal_menu',
  'ArticleCategory': 'article_category',
  'PortalNavigationItem': 'portal_navigation_item',
  'MemberGroup': 'member_group',
  'MemberGroupAssignment': 'member_group_assignment',
  'GuestWriter': 'guest_writer',
  'AwardClassification': 'award_classification',
  'AwardSublevel': 'award_sublevel',
  'MemberGroupGuest': 'member_group_guest',
  'DiscountCodeUsage': 'discount_code_usage',
  'ResourceFolder': 'resource_folder',
  'SupportTicket': 'support_ticket',
  'SupportTicketResponse': 'support_ticket_response',
};

// Foreign key relationships: column_name -> referenced_table
const foreignKeyMap = {
  'organization_id': 'organization',
  'role_id': 'role',
  'member_id': 'member',
  'event_id': 'event',
  'booking_id': 'booking',
  'blog_post_id': 'blog_post',
  'article_id': 'blog_post',
  'resource_id': 'resource',
  'category_id': 'resource_category',
  'parent_id': null, // Self-reference, handled specially
  'folder_id': null, // Could be various folder tables
  'tour_group_id': 'tour_group',
  'form_id': 'form',
  'section_id': 'wall_of_fame_section',
  'wall_of_fame_category_id': 'wall_of_fame_category',
  'page_id': 'iedit_page',
  'template_id': 'iedit_element_template',
  'award_id': 'award',
  'offline_award_id': 'offline_award',
  'comment_id': 'article_comment',
  'discount_code_id': 'discount_code',
  'program_id': 'program',
  'news_post_id': 'news_post',
  'ticket_id': 'support_ticket',
  'group_id': 'member_group',
};

// Import order - parent tables first
const importOrder = [
  'Role',
  'Organization',
  'Program',
  'ResourceCategory',
  'FileRepositoryFolder',
  'TourGroup',
  'Form',
  'WallOfFameSection',
  'WallOfFameCategory',
  'IEditElementTemplate',
  'IEditPage',
  'Award',
  'OfflineAward',
  'ButtonStyle',
  'DiscountCode',
  'Member',
  'Event',
  'OrganizationContact',
  'TeamMember',
  'Resource',
  'FileRepository',
  'BlogPost',
  'NewsPost',
  'JobPosting',
  'NavigationItem',
  'PageBanner',
  'Floater',
  'SystemSettings',
  'TourStep',
  'IEditPageElement',
  'WallOfFamePerson',
  'OfflineAwardAssignment',
  'FormSubmission',
  'Booking',
  'ProgramTicketTransaction',
  'MagicLink',
  'ArticleView',
  'ArticleComment',
  'ArticleReaction',
  'CommentReaction',
  'DiscountCodeUsage',
  'ResourceAuthorSettings',
  'ZohoToken',
  'XeroToken',
];

// Columns to skip during import
const skipColumns = ['created_by', 'created_by_id', 'is_sample', 'created_date', 'updated_date'];

// Read and parse CSV file
function readCSV(filename) {
  const filepath = path.join(EXPORT_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`  File not found: ${filename}`);
    return [];
  }
  
  const content = fs.readFileSync(filepath, 'utf-8');
  if (!content.trim()) {
    console.log(`  Empty file: ${filename}`);
    return [];
  }
  
  try {
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });
  } catch (err) {
    console.error(`  Error parsing ${filename}:`, err.message);
    return [];
  }
}

// Add base44_id column to a table if it doesn't exist
async function ensureBase44IdColumn(tableName) {
  try {
    // Try to add the column - it will fail silently if it exists
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS base44_id TEXT;`
    });
    
    if (error && !error.message.includes('already exists')) {
      // If RPC doesn't exist, try direct approach
      console.log(`  Note: Could not add base44_id column via RPC for ${tableName}`);
    }
  } catch (err) {
    // Column might already exist or RPC not available
  }
}

// Load existing ID mappings from Supabase
async function loadExistingMappings() {
  console.log('\n=== Loading existing ID mappings from Supabase ===\n');
  
  for (const [base44Name, supabaseTable] of Object.entries(tableNameMap)) {
    try {
      const { data, error } = await supabase
        .from(supabaseTable)
        .select('id, base44_id')
        .not('base44_id', 'is', null);
      
      if (error) {
        // Table might not exist or no base44_id column
        continue;
      }
      
      if (data && data.length > 0) {
        for (const row of data) {
          if (row.base44_id) {
            idMapping.set(`${supabaseTable}:${row.base44_id}`, row.id);
          }
        }
        console.log(`  ${base44Name}: Loaded ${data.length} existing mappings`);
      }
    } catch (err) {
      // Table or column doesn't exist
    }
  }
}

// Resolve foreign key value
function resolveForeignKey(columnName, value, currentTable) {
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return null;
  }
  
  // Get the referenced table
  let referencedTable = foreignKeyMap[columnName];
  
  // Handle self-references
  if (columnName === 'parent_id') {
    referencedTable = currentTable;
  }
  
  // Handle folder references based on current table
  if (columnName === 'folder_id') {
    if (currentTable === 'file_repository') {
      referencedTable = 'file_repository_folder';
    } else if (currentTable === 'resource') {
      referencedTable = 'resource_folder';
    }
  }
  
  if (!referencedTable) {
    return value; // Return as-is if no mapping defined
  }
  
  // Look up the new UUID
  const mappingKey = `${referencedTable}:${value}`;
  const newId = idMapping.get(mappingKey);
  
  if (newId) {
    return newId;
  }
  
  // If not found, check if it's already a UUID
  if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return value;
  }
  
  console.log(`    Warning: Could not resolve ${columnName}=${value} for table ${referencedTable}`);
  return null;
}

// Transform a row for import
function transformRow(row, tableName) {
  const transformed = {};
  const base44Id = row.id;
  
  // Generate new UUID
  const newId = uuidv4();
  transformed.id = newId;
  transformed.base44_id = base44Id;
  
  // Store mapping
  idMapping.set(`${tableName}:${base44Id}`, newId);
  
  for (const [key, value] of Object.entries(row)) {
    // Skip certain columns
    if (skipColumns.includes(key) || key === 'id') {
      continue;
    }
    
    // Handle foreign keys
    if (key.endsWith('_id') && key !== 'base44_id') {
      transformed[key] = resolveForeignKey(key, value, tableName);
      continue;
    }
    
    // Handle boolean values
    if (value === 'true' || value === 'TRUE') {
      transformed[key] = true;
      continue;
    }
    if (value === 'false' || value === 'FALSE') {
      transformed[key] = false;
      continue;
    }
    
    // Handle empty values
    if (value === '' || value === 'null' || value === 'undefined') {
      transformed[key] = null;
      continue;
    }
    
    // Handle JSON arrays/objects
    if (value && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        transformed[key] = JSON.parse(value);
        continue;
      } catch {
        // Not valid JSON, use as string
      }
    }
    
    // Handle numeric values
    if (key === 'ticket_price' || key === 'available_seats' || key === 'display_order') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        transformed[key] = num;
        continue;
      }
    }
    
    transformed[key] = value;
  }
  
  return transformed;
}

// Import a single table
async function importTable(base44Name) {
  const supabaseTable = tableNameMap[base44Name];
  if (!supabaseTable) {
    console.log(`  Skipping ${base44Name}: No table mapping defined`);
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  const filename = `${base44Name}.csv`;
  const rows = readCSV(filename);
  
  if (rows.length === 0) {
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  console.log(`  Processing ${rows.length} rows...`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const transformedBatch = [];
    
    for (const row of batch) {
      // Check if already imported
      const existingMapping = idMapping.get(`${supabaseTable}:${row.id}`);
      if (existingMapping) {
        skipped++;
        continue;
      }
      
      try {
        const transformed = transformRow(row, supabaseTable);
        transformedBatch.push(transformed);
      } catch (err) {
        console.log(`    Error transforming row: ${err.message}`);
        errors++;
      }
    }
    
    if (transformedBatch.length > 0) {
      const { data, error } = await supabase
        .from(supabaseTable)
        .upsert(transformedBatch, { onConflict: 'id' });
      
      if (error) {
        console.log(`    Batch error: ${error.message}`);
        errors += transformedBatch.length;
        
        // Try inserting one by one to identify problematic rows
        for (const row of transformedBatch) {
          const { error: singleError } = await supabase
            .from(supabaseTable)
            .upsert([row], { onConflict: 'id' });
          
          if (singleError) {
            console.log(`    Row error (base44_id=${row.base44_id}): ${singleError.message}`);
          } else {
            imported++;
            errors--;
          }
        }
      } else {
        imported += transformedBatch.length;
      }
    }
  }
  
  return { imported, skipped, errors };
}

// Main migration function
async function migrate() {
  console.log('==============================================');
  console.log('   Base44 to Supabase Data Migration');
  console.log('==============================================\n');
  
  // Check export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(`Export directory not found: ${EXPORT_DIR}`);
    process.exit(1);
  }
  
  // Load existing mappings
  await loadExistingMappings();
  
  console.log('\n=== Starting data import ===\n');
  
  const results = {};
  
  for (const tableName of importOrder) {
    console.log(`\nImporting ${tableName}...`);
    const result = await importTable(tableName);
    results[tableName] = result;
    
    if (result.imported > 0 || result.errors > 0) {
      console.log(`  Result: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);
    }
  }
  
  // Summary
  console.log('\n==============================================');
  console.log('   Migration Summary');
  console.log('==============================================\n');
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const [table, result] of Object.entries(results)) {
    if (result.imported > 0 || result.errors > 0) {
      console.log(`${table}: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`);
    }
    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }
  
  console.log('\n----------------------------------------------');
  console.log(`TOTAL: ${totalImported} imported, ${totalSkipped} skipped, ${totalErrors} errors`);
  console.log('----------------------------------------------\n');
}

// Run migration
migrate().catch(console.error);
