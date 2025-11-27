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

export default async function handler(req, res) {
  const hostname = extractHostname(req);
  const tenant = await lookupTenantByDomain(hostname);
  
  res.json({
    debug: {
      hostname: hostname,
      useDevBranch: useDevBranch,
      supabaseUrlConfigured: !!supabaseUrl,
      supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : null,
      envVars: {
        USE_SUPABASE_DEV: process.env.USE_SUPABASE_DEV || 'not set',
        SUPABASE_URL_DEV_SET: !!process.env.SUPABASE_URL_DEV,
        SUPABASE_SERVICE_KEY_DEV_SET: !!process.env.SUPABASE_SERVICE_KEY_DEV,
        SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY_SET: !!process.env.SUPABASE_SERVICE_KEY
      }
    },
    tenant: tenant ? {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      displayName: tenant.display_name
    } : null,
    tenantId: tenant ? tenant.id : DEFAULT_TENANT_ID
  });
}
