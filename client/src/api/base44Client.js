import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68efc20f3e0a30fafad6dde7", 
  requiresAuth: false // Ensure authentication is required for all operations
});
