// Supabase Client for frontend (limited access)
// Note: Most database operations go through our Express backend
// This client is only for specific Supabase features like realtime subscriptions

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export a flag to check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Single shared Supabase client instance - prevents "Multiple GoTrueClient instances" warning
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    })
  : null;

// Log configuration status (non-blocking)
if (!isSupabaseConfigured) {
  console.info('Supabase not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env.');
}
