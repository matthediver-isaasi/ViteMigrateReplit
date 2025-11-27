-- Multi-Tenant Schema Migration: Phase 2
-- Add tenant_id to ALL multi-tenant tables
-- Run this in your Supabase SQL Editor AFTER 001_create_tenant_tables.sql

-- ============================================
-- First, create AGCAS as the default tenant
-- ============================================
INSERT INTO tenant (id, slug, name, display_name, primary_color, secondary_color, accent_color, settings)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'agcas',
    'AGCAS',
    'Association of Graduate Careers Advisory Services',
    '#1e3a5f',
    '#2563eb',
    '#f59e0b',
    '{
        "features": {
            "events": true,
            "resources": true,
            "articles": true,
            "jobs": true,
            "directory": true,
            "wallOfFame": true,
            "awards": true
        },
        "limits": {
            "maxMembers": null,
            "maxOrganizations": null
        }
    }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Add primary domain for AGCAS
INSERT INTO tenant_domain (tenant_id, domain, is_primary, is_verified)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'iconnect.isaasi.co.uk', true, true),
    ('a0000000-0000-0000-0000-000000000001', 'staging.iconnect.isaasi.co.uk', false, true),
    ('a0000000-0000-0000-0000-000000000001', 'dev.iconnect.isaasi.co.uk', false, true)
ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- Helper function to add tenant_id column to a table
-- ============================================
CREATE OR REPLACE FUNCTION add_tenant_id_to_table(table_name text)
RETURNS void AS $$
BEGIN
    -- Add column if it doesn't exist
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenant(id)', table_name);
    
    -- Backfill with AGCAS tenant
    EXECUTE format('UPDATE %I SET tenant_id = ''a0000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL', table_name);
    
    -- Set NOT NULL constraint
    EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', table_name);
    
    -- Set default value
    EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET DEFAULT ''a0000000-0000-0000-0000-000000000001''', table_name);
    
    -- Create index
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON %I(tenant_id)', table_name, table_name);
    
    RAISE NOTICE 'Added tenant_id to table: %', table_name;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding tenant_id to table %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Add tenant_id to all application tables
-- ============================================

-- Core User/Org Tables
SELECT add_tenant_id_to_table('member');
SELECT add_tenant_id_to_table('organization');
SELECT add_tenant_id_to_table('organization_contact');
SELECT add_tenant_id_to_table('role');
SELECT add_tenant_id_to_table('team_member');

-- Events & Bookings
SELECT add_tenant_id_to_table('event');
SELECT add_tenant_id_to_table('booking');
SELECT add_tenant_id_to_table('program');
SELECT add_tenant_id_to_table('program_ticket_transaction');
SELECT add_tenant_id_to_table('voucher');
SELECT add_tenant_id_to_table('discount_code');
SELECT add_tenant_id_to_table('discount_code_usage');

-- Content Management
SELECT add_tenant_id_to_table('blog_post');
SELECT add_tenant_id_to_table('article_category');
SELECT add_tenant_id_to_table('article_comment');
SELECT add_tenant_id_to_table('article_reaction');
SELECT add_tenant_id_to_table('article_view');
SELECT add_tenant_id_to_table('comment_reaction');
SELECT add_tenant_id_to_table('guest_writer');
SELECT add_tenant_id_to_table('news_post');

-- Resources
SELECT add_tenant_id_to_table('resource');
SELECT add_tenant_id_to_table('resource_category');
SELECT add_tenant_id_to_table('resource_folder');
SELECT add_tenant_id_to_table('resource_author_settings');
SELECT add_tenant_id_to_table('file_repository');
SELECT add_tenant_id_to_table('file_repository_folder');

-- Jobs
SELECT add_tenant_id_to_table('job_posting');

-- IEdit CMS
SELECT add_tenant_id_to_table('i_edit_page');
SELECT add_tenant_id_to_table('i_edit_page_element');
SELECT add_tenant_id_to_table('i_edit_element_template');

-- Navigation & UI
SELECT add_tenant_id_to_table('navigation_item');
SELECT add_tenant_id_to_table('portal_menu');
SELECT add_tenant_id_to_table('portal_navigation_item');
SELECT add_tenant_id_to_table('page_banner');
SELECT add_tenant_id_to_table('button_style');
SELECT add_tenant_id_to_table('floater');

-- Tours
SELECT add_tenant_id_to_table('tour_group');
SELECT add_tenant_id_to_table('tour_step');

-- Awards & Wall of Fame
SELECT add_tenant_id_to_table('award');
SELECT add_tenant_id_to_table('award_classification');
SELECT add_tenant_id_to_table('award_sublevel');
SELECT add_tenant_id_to_table('offline_award');
SELECT add_tenant_id_to_table('offline_award_assignment');
SELECT add_tenant_id_to_table('wall_of_fame_section');
SELECT add_tenant_id_to_table('wall_of_fame_category');
SELECT add_tenant_id_to_table('wall_of_fame_person');

-- Forms
SELECT add_tenant_id_to_table('form');
SELECT add_tenant_id_to_table('form_submission');

-- Support
SELECT add_tenant_id_to_table('support_ticket');
SELECT add_tenant_id_to_table('support_ticket_response');

-- Member Groups
SELECT add_tenant_id_to_table('member_group');
SELECT add_tenant_id_to_table('member_group_assignment');
SELECT add_tenant_id_to_table('member_group_guest');

-- Settings
SELECT add_tenant_id_to_table('system_settings');

-- Auth tokens (may want to keep global or per-tenant)
SELECT add_tenant_id_to_table('magic_link');
SELECT add_tenant_id_to_table('zoho_token');
SELECT add_tenant_id_to_table('xero_token');

-- ============================================
-- Clean up helper function
-- ============================================
DROP FUNCTION IF EXISTS add_tenant_id_to_table(text);

-- ============================================
-- Verification query - run after migration to check results
-- ============================================
SELECT 
    t.table_name,
    CASE WHEN c.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_tenant_id
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND c.column_name = 'tenant_id'
    AND c.table_schema = 'public'
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('tenant', 'tenant_domain', 'tenant_theme', 'tenant_integration')
ORDER BY t.table_name;
