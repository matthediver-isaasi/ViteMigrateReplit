import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For Vercel, we use cookies/JWT for auth
  // This is a simplified version - in production you'd verify a JWT or session token
  const memberId = req.cookies?.memberId;
  
  if (!memberId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
}
