/**
 * Multi-Tenant Middleware
 * Detects tenant from request hostname and injects tenant context
 */

import type { Request, Response, NextFunction } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Tenant types
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  settings: Record<string, unknown>;
  is_active: boolean;
}

export interface TenantDomain {
  id: string;
  tenant_id: string;
  domain: string;
  is_primary: boolean;
  is_verified: boolean;
}

// Extend Express Request type to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      tenantId?: string;
    }
  }
}

// Default tenant ID (AGCAS) - used as fallback
const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';

// Cache for tenant lookups (reduces database queries)
const tenantCache = new Map<string, { tenant: Tenant; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Creates the tenant detection middleware
 * @param supabase - Supabase client for database lookups
 */
export function createTenantMiddleware(supabase: SupabaseClient | null) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!supabase) {
      // No Supabase configured - use default tenant
      req.tenantId = DEFAULT_TENANT_ID;
      return next();
    }

    try {
      // Extract hostname from request
      const hostname = extractHostname(req);
      
      // Check cache first
      const cached = tenantCache.get(hostname);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        req.tenant = cached.tenant;
        req.tenantId = cached.tenant.id;
        return next();
      }

      // Look up tenant by domain
      const tenant = await lookupTenantByDomain(supabase, hostname);
      
      if (tenant) {
        // Cache the result
        tenantCache.set(hostname, { tenant, timestamp: Date.now() });
        req.tenant = tenant;
        req.tenantId = tenant.id;
      } else {
        // Fallback to default tenant
        const defaultTenant = await getDefaultTenant(supabase);
        if (defaultTenant) {
          req.tenant = defaultTenant;
          req.tenantId = defaultTenant.id;
        } else {
          req.tenantId = DEFAULT_TENANT_ID;
        }
      }

      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      // Fallback to default tenant on error
      req.tenantId = DEFAULT_TENANT_ID;
      next();
    }
  };
}

/**
 * Extract hostname from request
 */
function extractHostname(req: Request): string {
  // Check X-Forwarded-Host header (for proxied requests)
  const forwardedHost = req.headers['x-forwarded-host'];
  if (forwardedHost) {
    return Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  }

  // Use Host header
  const host = req.headers.host || '';
  
  // Remove port if present
  return host.split(':')[0];
}

/**
 * Look up tenant by domain name
 */
async function lookupTenantByDomain(supabase: SupabaseClient, domain: string): Promise<Tenant | null> {
  // Query tenant_domain table to find matching domain
  const { data: domainRecord, error: domainError } = await supabase
    .from('tenant_domain')
    .select('tenant_id')
    .eq('domain', domain)
    .eq('is_verified', true)
    .single();

  if (domainError || !domainRecord) {
    // Try matching without subdomain (e.g., *.example.com -> example.com)
    const baseDomain = getBaseDomain(domain);
    if (baseDomain !== domain) {
      const { data: baseRecord } = await supabase
        .from('tenant_domain')
        .select('tenant_id')
        .eq('domain', baseDomain)
        .eq('is_verified', true)
        .single();
      
      if (baseRecord) {
        return getTenantById(supabase, baseRecord.tenant_id);
      }
    }
    return null;
  }

  return getTenantById(supabase, domainRecord.tenant_id);
}

/**
 * Get tenant by ID
 */
async function getTenantById(supabase: SupabaseClient, tenantId: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenant')
    .select('*')
    .eq('id', tenantId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Tenant;
}

/**
 * Get the default tenant (AGCAS)
 */
async function getDefaultTenant(supabase: SupabaseClient): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenant')
    .select('*')
    .eq('id', DEFAULT_TENANT_ID)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Tenant;
}

/**
 * Extract base domain from hostname
 * e.g., "staging.example.com" -> "example.com"
 */
function getBaseDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/**
 * Clear tenant cache (useful for testing or after admin changes)
 */
export function clearTenantCache(): void {
  tenantCache.clear();
}

/**
 * Get tenant from request (helper function for routes)
 */
export function getTenantFromRequest(req: Request): { tenantId: string; tenant?: Tenant } {
  return {
    tenantId: req.tenantId || DEFAULT_TENANT_ID,
    tenant: req.tenant
  };
}

/**
 * Require tenant middleware - returns 400 if no tenant found
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenantId) {
    return res.status(400).json({ error: 'Tenant not found' });
  }
  next();
}
