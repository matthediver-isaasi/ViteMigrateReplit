-- =====================================================
-- Update tenant domains for *.dev.iconn.app wildcard
-- Run this on your dev branch in Supabase SQL Editor
-- =====================================================

-- Remove old localhost domains
DELETE FROM tenant_domain WHERE domain LIKE '%.localhost';

-- Add new dev.iconn.app subdomains
-- AGCAS
INSERT INTO tenant_domain (id, tenant_id, domain, is_primary, is_verified)
VALUES 
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'agcas.dev.iconn.app', true, true)
ON CONFLICT DO NOTHING;

-- Demo University
INSERT INTO tenant_domain (id, tenant_id, domain, is_primary, is_verified)
VALUES 
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'demo-uni.dev.iconn.app', true, true)
ON CONFLICT DO NOTHING;

-- Pro Association
INSERT INTO tenant_domain (id, tenant_id, domain, is_primary, is_verified)
VALUES 
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'pro-assoc.dev.iconn.app', true, true)
ON CONFLICT DO NOTHING;

-- Verify the domains
SELECT t.name as tenant_name, td.domain, td.is_primary, td.is_verified
FROM tenant_domain td
JOIN tenant t ON t.id = td.tenant_id
ORDER BY t.name;
