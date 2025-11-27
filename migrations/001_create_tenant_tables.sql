-- Multi-Tenant Schema Migration: Phase 1
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create tenant table (core tenant configuration)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1e40af',
    secondary_color VARCHAR(7) DEFAULT '#3b82f6',
    accent_color VARCHAR(7) DEFAULT '#f59e0b',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Create tenant_domain table (custom domains per tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_domain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    ssl_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenant_domain_tenant_id ON tenant_domain(tenant_id);
CREATE INDEX idx_tenant_domain_domain ON tenant_domain(domain);

-- ============================================
-- 3. Create tenant_theme table (extended theming)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_theme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    theme_name VARCHAR(100) DEFAULT 'default',
    css_variables JSONB DEFAULT '{}',
    font_family VARCHAR(255) DEFAULT 'Inter, system-ui, sans-serif',
    font_heading VARCHAR(255),
    border_radius VARCHAR(20) DEFAULT '0.5rem',
    header_style VARCHAR(50) DEFAULT 'default',
    footer_style VARCHAR(50) DEFAULT 'default',
    custom_css TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, theme_name)
);

CREATE INDEX idx_tenant_theme_tenant_id ON tenant_theme(tenant_id);

-- ============================================
-- 4. Create tenant_integration table (per-tenant API credentials)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    credentials_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, integration_type)
);

CREATE INDEX idx_tenant_integration_tenant_id ON tenant_integration(tenant_id);
CREATE INDEX idx_tenant_integration_type ON tenant_integration(integration_type);

-- ============================================
-- 5. Create updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tenant tables
CREATE TRIGGER update_tenant_updated_at
    BEFORE UPDATE ON tenant
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_domain_updated_at
    BEFORE UPDATE ON tenant_domain
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_theme_updated_at
    BEFORE UPDATE ON tenant_theme
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_integration_updated_at
    BEFORE UPDATE ON tenant_integration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Add comments for documentation
-- ============================================
COMMENT ON TABLE tenant IS 'Core tenant configuration for multi-tenancy';
COMMENT ON TABLE tenant_domain IS 'Custom domains mapped to tenants';
COMMENT ON TABLE tenant_theme IS 'Extended theming configuration per tenant';
COMMENT ON TABLE tenant_integration IS 'Per-tenant API credentials and integration config';

COMMENT ON COLUMN tenant.slug IS 'URL-friendly unique identifier (e.g., agcas, client2)';
COMMENT ON COLUMN tenant.settings IS 'Flexible JSON settings (feature flags, limits, etc.)';
COMMENT ON COLUMN tenant_domain.is_primary IS 'Primary domain used for redirects and canonical URLs';
COMMENT ON COLUMN tenant_integration.integration_type IS 'Type: zoho_crm, zoho_backstage, stripe, xero';
COMMENT ON COLUMN tenant_integration.credentials_encrypted IS 'Encrypted API keys/secrets';
