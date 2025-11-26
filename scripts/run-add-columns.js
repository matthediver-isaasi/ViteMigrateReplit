#!/usr/bin/env node
/**
 * Add base44_id columns to Supabase tables
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const tables = [
  'organization',
  'event',
  'booking',
  'program_ticket_transaction',
  'magic_link',
  'organization_contact',
  'program',
  'blog_post',
  'team_member',
  'discount_code',
  'system_settings',
  'resource',
  'resource_category',
  'file_repository',
  'file_repository_folder',
  'job_posting',
  'page_banner',
  'iedit_page',
  'iedit_page_element',
  'iedit_element_template',
  'navigation_item',
  'article_comment',
  'comment_reaction',
  'article_reaction',
  'article_view',
  'button_style',
  'award',
  'offline_award',
  'offline_award_assignment',
  'wall_of_fame_section',
  'wall_of_fame_category',
  'wall_of_fame_person',
  'floater',
  'form',
  'form_submission',
  'tour_group',
  'tour_step',
  'news_post',
  'resource_author_settings',
  'zoho_token',
  'xero_token',
  'portal_menu',
  'voucher',
];

async function addBase44IdColumn(tableName) {
  // Try to add a test record with base44_id to check if column exists
  // This is a workaround since we can't directly run ALTER TABLE via Supabase client
  
  try {
    // First, try to select with base44_id to see if it exists
    const { data, error } = await supabase
      .from(tableName)
      .select('base44_id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('base44_id')) {
        console.log(`  ${tableName}: Column MISSING - needs to be added in Supabase SQL Editor`);
        return false;
      } else if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log(`  ${tableName}: Table does not exist`);
        return false;
      } else {
        console.log(`  ${tableName}: Error - ${error.message}`);
        return false;
      }
    }
    
    console.log(`  ${tableName}: Column EXISTS`);
    return true;
  } catch (err) {
    console.log(`  ${tableName}: Error - ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Checking base44_id columns in Supabase ===\n');
  
  const missing = [];
  const existing = [];
  const notFound = [];
  
  for (const table of tables) {
    const hasColumn = await addBase44IdColumn(table);
    if (hasColumn === true) {
      existing.push(table);
    } else if (hasColumn === false) {
      missing.push(table);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Tables with base44_id: ${existing.length}`);
  console.log(`Tables missing base44_id: ${missing.length}`);
  
  if (missing.length > 0) {
    console.log('\n=== SQL to add missing columns ===\n');
    console.log('-- Run this in Supabase SQL Editor:\n');
    for (const table of missing) {
      console.log(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS base44_id TEXT;`);
    }
  }
}

main().catch(console.error);
