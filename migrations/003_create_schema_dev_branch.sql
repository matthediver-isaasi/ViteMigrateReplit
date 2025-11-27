-- =====================================================
-- Schema Migration for Supabase Dev Branch
-- Generated from production database
-- Run this in Supabase SQL Editor on your dev branch
-- =====================================================

-- Table: member
CREATE TABLE IF NOT EXISTS member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  biography TEXT,
  email TEXT,
  first_name TEXT,
  handle TEXT,
  has_seen_onboarding_tour BOOLEAN DEFAULT FALSE,
  job_title TEXT,
  last_activity TEXT,
  last_login TEXT,
  last_name TEXT,
  last_synced TIMESTAMPTZ,
  linkedin_url TEXT,
  login_enabled BOOLEAN DEFAULT FALSE,
  member_excluded_features JSONB DEFAULT '[]'::jsonb,
  organization_id TEXT,
  page_tours_seen JSONB DEFAULT '{}'::jsonb,
  profile_photo_url TEXT,
  role_effective_from TEXT,
  role_id TEXT,
  show_in_directory BOOLEAN DEFAULT FALSE,
  zoho_contact_id TEXT,
  zoho_organization_id TEXT
);

-- Table: organization
CREATE TABLE IF NOT EXISTS organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  additional_verified_domains JSONB DEFAULT '[]'::jsonb,
  base44_id TEXT,
  contacts_synced_at TIMESTAMPTZ,
  domain TEXT,
  last_synced TIMESTAMPTZ,
  logo_url TEXT,
  name TEXT,
  program_ticket_balances JSONB DEFAULT '{}'::jsonb,
  purchase_order_enabled BOOLEAN DEFAULT FALSE,
  training_fund_balance INTEGER DEFAULT 0,
  zoho_account_id TEXT
);

-- Table: event
CREATE TABLE IF NOT EXISTS event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  available_seats INTEGER DEFAULT 0,
  backstage_event_id TEXT,
  backstage_public_url TEXT,
  backstage_ticket_type_id TEXT,
  base44_id TEXT,
  description TEXT,
  end_date TIMESTAMPTZ,
  image_url TEXT,
  last_synced TIMESTAMPTZ,
  location TEXT,
  program_tag TEXT,
  start_date TIMESTAMPTZ,
  ticket_price INTEGER DEFAULT 0,
  title TEXT
);

-- Table: booking
CREATE TABLE IF NOT EXISTS booking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_email TEXT,
  attendee_first_name TEXT,
  attendee_last_name TEXT,
  backstage_order_id TEXT,
  base44_id TEXT,
  booking_reference TEXT,
  confirmation_token TEXT,
  event_id TEXT,
  member_id TEXT,
  payment_method TEXT,
  status TEXT,
  ticket_price INTEGER DEFAULT 0
);

-- Table: role
CREATE TABLE IF NOT EXISTS role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  default_landing_page TEXT,
  description TEXT,
  excluded_features JSONB DEFAULT '[]'::jsonb,
  is_admin BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  layout_theme TEXT,
  name TEXT,
  requires_effective_from_date TIMESTAMPTZ,
  show_tours BOOLEAN DEFAULT FALSE
);

-- Table: team_member
CREATE TABLE IF NOT EXISTS team_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  email TEXT,
  first_name TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  last_name TEXT,
  role_id TEXT
);

-- Table: blog_post
CREATE TABLE IF NOT EXISTS blog_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id TEXT,
  author_name TEXT,
  base44_id TEXT,
  content TEXT,
  feature_image_url TEXT,
  guest_writer_id TEXT,
  published_date TIMESTAMPTZ,
  seo_description TEXT,
  seo_title TEXT,
  slug TEXT,
  status TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  title TEXT
);

-- Table: resource
CREATE TABLE IF NOT EXISTS resource (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allowed_role_ids JSONB DEFAULT '[]'::jsonb,
  author_id TEXT,
  author_name TEXT,
  base44_id TEXT,
  description TEXT,
  folder_id TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  open_in_new_tab BOOLEAN DEFAULT FALSE,
  release_date TIMESTAMPTZ,
  resource_type TEXT,
  status TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  target_url TEXT,
  title TEXT
);

-- Table: news_post
CREATE TABLE IF NOT EXISTS news_post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id TEXT,
  author_name TEXT,
  base44_id TEXT,
  content TEXT,
  feature_image_url TEXT,
  published_date TIMESTAMPTZ,
  seo_description TEXT,
  seo_title TEXT,
  slug TEXT,
  status TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  title TEXT
);

-- Table: program
CREATE TABLE IF NOT EXISTS program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  bogo_buy_quantity INTEGER DEFAULT 0,
  bogo_get_free_quantity INTEGER DEFAULT 0,
  bogo_logic_type TEXT,
  bulk_discount_percentage INTEGER DEFAULT 0,
  bulk_discount_threshold INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  name TEXT,
  offer_type TEXT,
  program_tag TEXT,
  program_ticket_price INTEGER DEFAULT 0
);

-- Table: program_ticket_transaction
CREATE TABLE IF NOT EXISTS program_ticket_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  booking_reference TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by_member_email TEXT,
  cancelled_quantity INTEGER DEFAULT 0,
  discount_amount_applied TEXT,
  discount_code_id TEXT,
  event_name TEXT,
  member_email TEXT,
  notes TEXT,
  organization_id TEXT,
  original_quantity INTEGER DEFAULT 0,
  original_transaction_id TEXT,
  program_name TEXT,
  purchase_order_number TEXT,
  quantity INTEGER DEFAULT 0,
  status TEXT,
  total_cost_before_discount INTEGER DEFAULT 0,
  transaction_type TEXT,
  xero_invoice_id TEXT,
  xero_invoice_number TEXT,
  xero_invoice_pdf_uri TEXT
);

-- Table: navigation_item
CREATE TABLE IF NOT EXISTS navigation_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  highlight_style TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  link_type TEXT,
  location TEXT,
  open_in_new_tab BOOLEAN DEFAULT FALSE,
  parent_id TEXT,
  title TEXT,
  url TEXT
);

-- Table: portal_menu
CREATE TABLE IF NOT EXISTS portal_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  display_order INTEGER DEFAULT 0,
  feature_id TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  parent_id TEXT,
  section TEXT,
  title TEXT,
  url TEXT
);

-- Table: page_banner
CREATE TABLE IF NOT EXISTS page_banner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alt_text TEXT,
  associated_pages JSONB DEFAULT '[]'::jsonb,
  base44_id TEXT,
  display_order INTEGER DEFAULT 0,
  height TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  name TEXT,
  position TEXT,
  size TEXT
);

-- Table: tour_group
CREATE TABLE IF NOT EXISTS tour_group (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  mandatory_selector TEXT,
  mandatory_selector_missing_message TEXT,
  name TEXT,
  page_name TEXT,
  view_id TEXT
);

-- Table: tour_step
CREATE TABLE IF NOT EXISTS tour_step (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  content TEXT,
  gap INTEGER DEFAULT 0,
  mode TEXT,
  placement TEXT,
  size TEXT,
  step_order INTEGER DEFAULT 0,
  target_selector TEXT,
  title TEXT,
  tour_group_id TEXT
);

-- Table: system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  description TEXT,
  setting_key TEXT,
  setting_value TEXT
);

-- Table: i_edit_page
CREATE TABLE IF NOT EXISTS i_edit_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT,
  element_ids JSONB DEFAULT '[]'::jsonb,
  layout_type TEXT,
  meta_description TEXT,
  meta_title TEXT,
  published_at TIMESTAMPTZ,
  slug TEXT,
  status TEXT,
  title TEXT
);

-- Table: i_edit_page_element
CREATE TABLE IF NOT EXISTS i_edit_page_element (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  element_type TEXT,
  page_id TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  style_variant TEXT
);

-- Table: zoho_token
CREATE TABLE IF NOT EXISTS zoho_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT,
  base44_id TEXT,
  expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  token_type TEXT
);

-- Table: xero_token
CREATE TABLE IF NOT EXISTS xero_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT,
  base44_id TEXT,
  expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  tenant_id TEXT,
  token_type TEXT
);

-- Table: voucher (empty in production)
CREATE TABLE IF NOT EXISTS voucher (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: discount_code
CREATE TABLE IF NOT EXISTS discount_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id TEXT,
  code TEXT,
  created_date TIMESTAMPTZ,
  current_usage_count INTEGER DEFAULT 0,
  description TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT FALSE,
  max_usage_count TEXT,
  min_purchase_amount INTEGER DEFAULT 0,
  organization_id TEXT,
  program_tag TEXT,
  type TEXT,
  value INTEGER DEFAULT 0
);
