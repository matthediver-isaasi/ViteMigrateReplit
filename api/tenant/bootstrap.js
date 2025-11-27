import { createClient } from '@supabase/supabase-js';

const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

const useDevBranch = process.env.USE_SUPABASE_DEV === 'true';
const supabaseUrl = useDevBranch 
  ? (process.env.SUPABASE_URL_DEV || process.env.SUPABASE_URL)
  : process.env.SUPABASE_URL;
const supabaseServiceKey = useDevBranch 
  ? (process.env.SUPABASE_SERVICE_KEY_DEV || process.env.SUPABASE_SERVICE_KEY)
  : process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function extractHostname(req) {
  const forwardedHost = req.headers['x-forwarded-host'];
  if (forwardedHost) {
    return Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  }
  const host = req.headers.host || '';
  return host.split(':')[0];
}

async function lookupTenantByDomain(domain) {
  if (!supabase) return null;
  
  const { data: domainRecord, error } = await supabase
    .from('tenant_domain')
    .select('tenant_id')
    .eq('domain', domain)
    .eq('is_verified', true)
    .single();

  if (error || !domainRecord) {
    return null;
  }

  const { data: tenant } = await supabase
    .from('tenant')
    .select('*')
    .eq('id', domainRecord.tenant_id)
    .eq('is_active', true)
    .single();

  return tenant;
}

async function getDefaultTenant() {
  if (!supabase) return null;
  
  const { data } = await supabase
    .from('tenant')
    .select('*')
    .eq('id', DEFAULT_TENANT_ID)
    .single();

  return data;
}

export default async function handler(req, res) {
  const hostname = extractHostname(req);
  let tenant = await lookupTenantByDomain(hostname);
  
  if (!tenant) {
    tenant = await getDefaultTenant();
  }
  
  if (tenant) {
    res.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      displayName: tenant.display_name,
      logoUrl: tenant.logo_url,
      faviconUrl: tenant.favicon_url,
      primaryColor: tenant.primary_color,
      secondaryColor: tenant.secondary_color,
      accentColor: tenant.accent_color,
      settings: tenant.settings
    });
  } else {
    res.json({
      id: DEFAULT_TENANT_ID,
      slug: 'default',
      name: 'Default',
      displayName: null,
      logoUrl: null,
      faviconUrl: null,
      primaryColor: '#1e40af',
      secondaryColor: '#3b82f6',
      accentColor: '#f59e0b',
      settings: {}
    });
  }
}
