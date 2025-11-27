import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getProductionSchema() {
  // List of known entities from the codebase
  const entities = [
    'member', 'organization', 'event', 'booking', 'role', 'team_member',
    'blog_post', 'resource', 'news_post', 'program', 'program_ticket_transaction',
    'navigation_item', 'portal_menu', 'page_banner', 'tour_group', 'tour_step',
    'system_settings', 'i_edit_page', 'i_edit_page_element', 'zoho_token', 'xero_token',
    'voucher', 'member_tag', 'tag', 'job_listing', 'job_application', 'reaction',
    'comment', 'saved_item', 'notification', 'audit_log', 'file_upload',
    'email_template', 'email_log', 'webhook_log', 'api_key', 'session',
    'password_reset', 'verification_token', 'membership_tier', 'subscription',
    'invoice', 'payment', 'refund', 'discount_code', 'cart', 'cart_item',
    'order', 'order_item', 'shipping_address', 'billing_address'
  ];

  console.log('Checking production tables...\n');
  
  const foundTables: { name: string; columns: string[]; sampleRow: any }[] = [];
  
  for (const entity of entities) {
    const { data, error } = await supabase.from(entity).select('*').limit(1);
    if (!error) {
      const columns = data?.[0] ? Object.keys(data[0]) : [];
      foundTables.push({ name: entity, columns, sampleRow: data?.[0] || null });
      console.log(`✓ ${entity} (${columns.length} cols)`);
    }
  }

  console.log(`\n--- Found ${foundTables.length} tables ---\n`);
  
  // Output detailed column info for each table
  for (const table of foundTables) {
    console.log(`\nTable: ${table.name}`);
    console.log('Columns:', table.columns.join(', '));
    if (table.sampleRow) {
      console.log('Sample types:');
      for (const [key, value] of Object.entries(table.sampleRow)) {
        const type = value === null ? 'null' : typeof value;
        console.log(`  ${key}: ${type} (${JSON.stringify(value)?.slice(0, 50)})`);
      }
    }
  }
}

getProductionSchema();
