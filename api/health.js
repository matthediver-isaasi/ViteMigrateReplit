import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  const supabaseConfigured = !!(supabaseUrl && supabaseServiceKey);
  
  return res.json({ 
    status: 'ok',
    supabase: supabaseConfigured,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
