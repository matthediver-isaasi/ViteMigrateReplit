-- =====================================================
-- Seed Data for Multi-Tenant Testing
-- Run this AFTER 003_create_schema_dev_branch.sql
-- and AFTER 001/002 tenant migration files
-- =====================================================

-- =====================================================
-- 1. CREATE TEST TENANTS (colors are stored in tenant table)
-- =====================================================

-- AGCAS (Default Tenant - UK Graduate Careers Association)
INSERT INTO tenant (id, name, slug, display_name, logo_url, primary_color, secondary_color, accent_color, is_active, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'AGCAS',
  'agcas',
  'AGCAS Member Portal',
  'https://www.agcas.org.uk/write/MediaUploads/Logos/AGCAS_logo_2018.png',
  '#1e3a5f',
  '#2c5282',
  '#3182ce',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test Tenant 2: Demo University Careers Service
INSERT INTO tenant (id, name, slug, display_name, primary_color, secondary_color, accent_color, is_active, created_at)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'Demo University Careers',
  'demo-uni',
  'Demo University Careers Service',
  '#276749',
  '#38a169',
  '#48bb78',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Test Tenant 3: Sample Professional Association
INSERT INTO tenant (id, name, slug, display_name, primary_color, secondary_color, accent_color, is_active, created_at)
VALUES (
  'c0000000-0000-0000-0000-000000000003',
  'Professional Association',
  'pro-assoc',
  'Professional Association Portal',
  '#553c9a',
  '#6b46c1',
  '#805ad5',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. TENANT DOMAINS
-- =====================================================

-- AGCAS domains
INSERT INTO tenant_domain (id, tenant_id, domain, is_primary, is_verified)
VALUES 
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'agcas.localhost', true, true),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'portal.agcas.org.uk', false, true)
ON CONFLICT DO NOTHING;

-- Demo University domains
INSERT INTO tenant_domain (id, tenant_id, domain, is_primary, is_verified)
VALUES 
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'demo-uni.localhost', true, true),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'careers.demo-university.ac.uk', false, false)
ON CONFLICT DO NOTHING;

-- Pro Association domains
INSERT INTO tenant_domain (id, tenant_id, domain, is_primary, is_verified)
VALUES 
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'pro-assoc.localhost', true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. TENANT THEMES (extended theming - colors are in tenant table)
-- =====================================================

-- AGCAS Theme (Professional fonts)
INSERT INTO tenant_theme (id, tenant_id, theme_name, font_family, font_heading, border_radius, header_style, is_active)
VALUES (
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001',
  'default',
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  '0.5rem',
  'default',
  true
) ON CONFLICT DO NOTHING;

-- Demo University Theme (Academic styling)
INSERT INTO tenant_theme (id, tenant_id, theme_name, font_family, font_heading, border_radius, header_style, is_active)
VALUES (
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000002',
  'default',
  'Open Sans, system-ui, sans-serif',
  'Merriweather, serif',
  '0.375rem',
  'default',
  true
) ON CONFLICT DO NOTHING;

-- Pro Association Theme (Modern styling)
INSERT INTO tenant_theme (id, tenant_id, theme_name, font_family, font_heading, border_radius, header_style, is_active)
VALUES (
  gen_random_uuid(),
  'c0000000-0000-0000-0000-000000000003',
  'default',
  'Poppins, system-ui, sans-serif',
  'Poppins, sans-serif',
  '0.75rem',
  'default',
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. ORGANIZATIONS (Per Tenant)
-- =====================================================

-- AGCAS Organizations (org prefix: 01)
INSERT INTO organization (id, tenant_id, name, zoho_account_id, purchase_order_enabled, training_fund_balance)
VALUES 
  ('01111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'University of Manchester', NULL, true, 5000),
  ('01111111-1111-1111-1111-111111111112', 'a0000000-0000-0000-0000-000000000001', 'University of Birmingham', NULL, false, 2500),
  ('01111111-1111-1111-1111-111111111113', 'a0000000-0000-0000-0000-000000000001', 'University of Leeds', NULL, true, 3000)
ON CONFLICT (id) DO NOTHING;

-- Demo University Organizations (org prefix: 02)
INSERT INTO organization (id, tenant_id, name, purchase_order_enabled, training_fund_balance)
VALUES 
  ('02222222-2222-2222-2222-222222222221', 'b0000000-0000-0000-0000-000000000002', 'Business School', false, 1000),
  ('02222222-2222-2222-2222-222222222222', 'b0000000-0000-0000-0000-000000000002', 'Engineering Faculty', true, 2000)
ON CONFLICT (id) DO NOTHING;

-- Pro Association Organizations (org prefix: 03)
INSERT INTO organization (id, tenant_id, name, purchase_order_enabled, training_fund_balance)
VALUES 
  ('03333333-3333-3333-3333-333333333331', 'c0000000-0000-0000-0000-000000000003', 'Corporate Member A', true, 10000),
  ('03333333-3333-3333-3333-333333333332', 'c0000000-0000-0000-0000-000000000003', 'Corporate Member B', false, 0)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. ROLES (Per Tenant)
-- =====================================================

-- AGCAS Roles (role prefix: aa)
INSERT INTO role (id, tenant_id, name, description, is_default, is_admin, show_tours)
VALUES 
  ('aaaa1111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Member', 'Standard AGCAS member', true, false, true),
  ('aaaa1111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Admin', 'AGCAS administrator', false, true, false),
  ('aaaa1111-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Premium Member', 'Premium access member', false, false, true)
ON CONFLICT (id) DO NOTHING;

-- Demo University Roles (role prefix: bb)
INSERT INTO role (id, tenant_id, name, description, is_default, is_admin)
VALUES 
  ('bbbb2222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Student', 'University student', true, false),
  ('bbbb2222-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Staff', 'University staff', false, false),
  ('bbbb2222-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Careers Advisor', 'Careers service staff', false, true)
ON CONFLICT (id) DO NOTHING;

-- Pro Association Roles (role prefix: cc)
INSERT INTO role (id, tenant_id, name, description, is_default, is_admin)
VALUES 
  ('cccc3333-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Associate', 'Associate member', true, false),
  ('cccc3333-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'Fellow', 'Fellow member', false, false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. MEMBERS (Per Tenant)
-- =====================================================

-- AGCAS Members (member prefix: a1)
INSERT INTO member (id, tenant_id, email, first_name, last_name, organization_id, role_id, login_enabled, show_in_directory)
VALUES 
  ('a1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'john.smith@manchester.ac.uk', 'John', 'Smith', '01111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000001', true, true),
  ('a1111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'jane.doe@birmingham.ac.uk', 'Jane', 'Doe', '01111111-1111-1111-1111-111111111112', 'aaaa1111-0000-0000-0000-000000000001', true, true),
  ('a1111111-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'admin@agcas.org.uk', 'AGCAS', 'Admin', '01111111-1111-1111-1111-111111111111', 'aaaa1111-0000-0000-0000-000000000002', true, false),
  ('a1111111-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'sarah.jones@leeds.ac.uk', 'Sarah', 'Jones', '01111111-1111-1111-1111-111111111113', 'aaaa1111-0000-0000-0000-000000000003', true, true)
ON CONFLICT (id) DO NOTHING;

-- Demo University Members (member prefix: b2)
INSERT INTO member (id, tenant_id, email, first_name, last_name, organization_id, role_id, login_enabled, show_in_directory)
VALUES 
  ('b2222222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'student1@demo-university.ac.uk', 'Alex', 'Student', '02222222-2222-2222-2222-222222222221', 'bbbb2222-0000-0000-0000-000000000001', true, true),
  ('b2222222-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'advisor@demo-university.ac.uk', 'Carol', 'Advisor', '02222222-2222-2222-2222-222222222221', 'bbbb2222-0000-0000-0000-000000000003', true, true)
ON CONFLICT (id) DO NOTHING;

-- Pro Association Members (member prefix: c3)
INSERT INTO member (id, tenant_id, email, first_name, last_name, organization_id, role_id, login_enabled, show_in_directory)
VALUES 
  ('c3333333-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'member@corpA.com', 'Bob', 'Corporate', '03333333-3333-3333-3333-333333333331', 'cccc3333-0000-0000-0000-000000000001', true, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. EVENTS (Per Tenant)
-- =====================================================

-- AGCAS Events (event prefix: e1)
INSERT INTO event (id, tenant_id, title, description, program_tag, start_date, end_date, location, ticket_price, available_seats)
VALUES 
  ('e1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Annual AGCAS Conference 2025', 'The flagship annual conference for careers professionals', 'Conference', NOW() + INTERVAL '30 days', NOW() + INTERVAL '32 days', 'Manchester Central', 350, 500),
  ('e1111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Employability Skills Workshop', 'Online workshop on employability frameworks', 'Unpacked Series', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days', 'Online', 0, 100),
  ('e1111111-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'AI in Careers Guidance', 'Exploring AI tools for careers services', 'Technology', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days', 'Birmingham', 75, 50)
ON CONFLICT (id) DO NOTHING;

-- Demo University Events (event prefix: e2)
INSERT INTO event (id, tenant_id, title, description, program_tag, start_date, end_date, location, ticket_price, available_seats)
VALUES 
  ('e2222222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Spring Careers Fair', 'Meet top employers on campus', 'Career Fair', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days', 'Student Union', 0, 1000),
  ('e2222222-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'CV Workshop for Engineers', 'Technical CV writing session', 'Workshop', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days', 'Engineering Building', 0, 30)
ON CONFLICT (id) DO NOTHING;

-- Pro Association Events (event prefix: e3)
INSERT INTO event (id, tenant_id, title, description, program_tag, start_date, end_date, location, ticket_price, available_seats)
VALUES 
  ('e3333333-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Professional Development Day', 'CPD event for members', 'CPD', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days', 'London', 200, 80)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. BOOKINGS (Per Tenant)
-- =====================================================

-- AGCAS Bookings (booking prefix: b1 for AGCAS)
INSERT INTO booking (id, tenant_id, event_id, member_id, attendee_email, attendee_first_name, attendee_last_name, ticket_price, status, booking_reference)
VALUES 
  ('b1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'john.smith@manchester.ac.uk', 'John', 'Smith', 350, 'confirmed', 'AGCAS-2025-0001'),
  ('b1111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000002', 'jane.doe@birmingham.ac.uk', 'Jane', 'Doe', 0, 'confirmed', 'AGCAS-2025-0002'),
  ('b1111111-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000004', 'sarah.jones@leeds.ac.uk', 'Sarah', 'Jones', 350, 'pending', 'AGCAS-2025-0003')
ON CONFLICT (id) DO NOTHING;

-- Demo University Bookings (booking prefix: b4 for Demo Uni)
INSERT INTO booking (id, tenant_id, event_id, member_id, attendee_email, attendee_first_name, attendee_last_name, ticket_price, status, booking_reference)
VALUES 
  ('b4444444-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'e2222222-0000-0000-0000-000000000001', 'b2222222-0000-0000-0000-000000000001', 'student1@demo-university.ac.uk', 'Alex', 'Student', 0, 'confirmed', 'DEMO-2025-0001')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. PROGRAMS (Per Tenant)
-- =====================================================

-- AGCAS Programs (program prefix: f1)
INSERT INTO program (id, tenant_id, name, description, program_tag, program_ticket_price, is_active, offer_type)
VALUES 
  ('f1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Unpacked Series Subscription', 'Annual subscription to all Unpacked webinars', 'Unpacked Series', 500, true, 'subscription'),
  ('f1111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Conference Bundle', 'Discounted conference package', 'Conference', 300, true, 'bundle')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. BLOG POSTS (Per Tenant)
-- =====================================================

-- AGCAS Blog Posts (blog prefix: d1)
INSERT INTO blog_post (id, tenant_id, title, slug, author_name, summary, content, status, published_date)
VALUES 
  ('d1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Welcome to the New AGCAS Portal', 'welcome-new-portal', 'AGCAS Team', 'Introducing our redesigned member portal with new features and improved navigation.', '<p>We are excited to announce the launch of our new member portal...</p>', 'published', NOW() - INTERVAL '7 days'),
  ('d1111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Top 10 Career Trends for 2025', 'career-trends-2025', 'Dr. James Wilson', 'A look at emerging trends in graduate employment and careers guidance.', '<p>As we move into 2025, several key trends are shaping the careers landscape...</p>', 'published', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Demo University Blog Posts (blog prefix: d2)
INSERT INTO blog_post (id, tenant_id, title, slug, author_name, summary, content, status, published_date)
VALUES 
  ('d2222222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Preparing for Graduate Recruitment Season', 'grad-recruitment-season', 'Careers Team', 'Tips for making the most of employer events this term.', '<p>With recruitment season approaching, here are our top tips...</p>', 'published', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 11. RESOURCES (Per Tenant)
-- =====================================================

-- AGCAS Resources (resource prefix: ae)
INSERT INTO resource (id, tenant_id, title, description, resource_type, target_url, is_public, status)
VALUES 
  ('ae111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Employability Framework Guide', 'Comprehensive guide to embedding employability', 'document', 'https://example.com/guide.pdf', false, 'published'),
  ('ae111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'AI Tools Directory', 'Curated list of AI tools for careers professionals', 'link', 'https://example.com/ai-tools', true, 'published')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. NAVIGATION ITEMS (Per Tenant)
-- =====================================================

-- AGCAS Navigation (nav prefix: 0a)
INSERT INTO navigation_item (id, tenant_id, title, url, location, display_order, is_active, link_type)
VALUES 
  ('0a111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Home', '/', 'header', 1, true, 'internal'),
  ('0a111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Events', '/events', 'header', 2, true, 'internal'),
  ('0a111111-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Resources', '/resources', 'header', 3, true, 'internal'),
  ('0a111111-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Blog', '/blog', 'header', 4, true, 'internal')
ON CONFLICT (id) DO NOTHING;

-- Demo University Navigation (nav prefix: 0b)
INSERT INTO navigation_item (id, tenant_id, title, url, location, display_order, is_active, link_type)
VALUES 
  ('0b222222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Dashboard', '/', 'header', 1, true, 'internal'),
  ('0b222222-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Careers Fair', '/events', 'header', 2, true, 'internal'),
  ('0b222222-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Appointments', '/appointments', 'header', 3, true, 'internal')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 13. SYSTEM SETTINGS (Per Tenant)
-- =====================================================

-- AGCAS Settings
INSERT INTO system_settings (id, tenant_id, setting_key, setting_value, description)
VALUES 
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'site_name', 'AGCAS Member Portal', 'Display name for the portal'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'support_email', 'support@agcas.org.uk', 'Support contact email'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'timezone', 'Europe/London', 'Default timezone')
ON CONFLICT DO NOTHING;

-- Demo University Settings
INSERT INTO system_settings (id, tenant_id, setting_key, setting_value, description)
VALUES 
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'site_name', 'Demo University Careers', 'Display name for the portal'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'support_email', 'careers@demo-university.ac.uk', 'Support contact email')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (Run after seeding)
-- =====================================================

-- Check tenant isolation by counting records per tenant
-- SELECT 'member' as entity, tenant_id, COUNT(*) FROM member GROUP BY tenant_id
-- UNION ALL
-- SELECT 'organization', tenant_id, COUNT(*) FROM organization GROUP BY tenant_id
-- UNION ALL
-- SELECT 'event', tenant_id, COUNT(*) FROM event GROUP BY tenant_id
-- UNION ALL
-- SELECT 'booking', tenant_id, COUNT(*) FROM booking GROUP BY tenant_id
-- ORDER BY entity, tenant_id;

-- =====================================================
-- END OF SEED FILE
-- =====================================================
