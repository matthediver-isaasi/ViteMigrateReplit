/**
 * Tenant Context Provider
 * Provides multi-tenant theming and configuration to the entire application
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

// Default tenant configuration (fallback when tenant not found)
const DEFAULT_TENANT = {
  id: null,
  slug: 'default',
  name: 'Member Portal',
  displayName: 'Member Portal',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#1e3a5f',
  secondaryColor: '#2563eb',
  accentColor: '#f59e0b',
  settings: {
    features: {
      events: true,
      resources: true,
      articles: true,
      jobs: true,
      directory: true,
      wallOfFame: true,
      awards: true
    },
    limits: {}
  }
};

// Create the context
const TenantContext = createContext({
  tenant: DEFAULT_TENANT,
  isLoading: false,
  isFeatureEnabled: () => true,
  cssVariables: {}
});

/**
 * Custom hook to access tenant context
 */
export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Convert hex color to HSL values for CSS variables
 */
function hexToHsl(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Generate CSS variables from tenant colors
 */
function generateCssVariables(tenant) {
  const primary = hexToHsl(tenant.primaryColor || '#1e3a5f');
  const secondary = hexToHsl(tenant.secondaryColor || '#2563eb');
  const accent = hexToHsl(tenant.accentColor || '#f59e0b');
  
  return {
    '--tenant-primary': `${primary.h} ${primary.s}% ${primary.l}%`,
    '--tenant-primary-foreground': primary.l > 50 ? '0 0% 0%' : '0 0% 100%',
    '--tenant-secondary': `${secondary.h} ${secondary.s}% ${secondary.l}%`,
    '--tenant-secondary-foreground': secondary.l > 50 ? '0 0% 0%' : '0 0% 100%',
    '--tenant-accent': `${accent.h} ${accent.s}% ${accent.l}%`,
    '--tenant-accent-foreground': accent.l > 50 ? '0 0% 0%' : '0 0% 100%'
  };
}

/**
 * Apply CSS variables to document root
 */
function applyCssVariables(variables) {
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Update document title and favicon based on tenant
 */
function updateDocumentMeta(tenant) {
  // Update document title
  if (tenant.displayName || tenant.name) {
    const currentTitle = document.title;
    // Only update if not already set by a page
    if (!currentTitle || currentTitle === 'iConnect') {
      document.title = tenant.displayName || tenant.name;
    }
  }
  
  // Update favicon if provided
  if (tenant.faviconUrl) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = tenant.faviconUrl;
  }
}

/**
 * Tenant Provider Component
 */
export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(DEFAULT_TENANT);
  
  // Fetch tenant configuration from API
  const { data: tenantData, isLoading, error } = useQuery({
    queryKey: ['/api/tenant/bootstrap'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });
  
  // Update tenant when data is fetched
  useEffect(() => {
    if (tenantData) {
      setTenant(tenantData);
    }
  }, [tenantData]);
  
  // Generate CSS variables whenever tenant changes
  const cssVariables = useMemo(() => {
    return generateCssVariables(tenant);
  }, [tenant]);
  
  // Apply CSS variables to document
  useEffect(() => {
    applyCssVariables(cssVariables);
  }, [cssVariables]);
  
  // Update document metadata
  useEffect(() => {
    updateDocumentMeta(tenant);
  }, [tenant]);
  
  // Check if a feature is enabled for this tenant
  const isFeatureEnabled = (featureId) => {
    const features = tenant.settings?.features || {};
    return features[featureId] !== false;
  };
  
  // Get tenant settings value
  const getSetting = (key, defaultValue = null) => {
    return tenant.settings?.[key] ?? defaultValue;
  };
  
  // Context value
  const value = useMemo(() => ({
    tenant,
    isLoading,
    error,
    isFeatureEnabled,
    getSetting,
    cssVariables
  }), [tenant, isLoading, error, cssVariables]);
  
  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export default TenantProvider;
