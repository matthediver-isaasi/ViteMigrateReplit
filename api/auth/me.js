import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For Vercel serverless, we don't use traditional sessions
  // The frontend stores member info in sessionStorage after validateMember
  // This endpoint returns null to indicate "check sessionStorage"
  // If a memberId cookie is present (from possible future JWT auth), we can look it up
  
  const memberId = req.cookies?.memberId;
  
  if (!memberId) {
    // Not an error - frontend should check sessionStorage
    return res.status(200).json(null);
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('member')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error || !data) {
      // Member not found, return null (not authenticated)
      return res.status(200).json(null);
    }

    return res.json(data);
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
}
