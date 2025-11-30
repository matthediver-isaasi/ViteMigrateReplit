import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

let zoomTokenCache = null;

async function getZoomAccessToken() {
  if (zoomTokenCache && Date.now() < zoomTokenCache.expiresAt - 60000) {
    return zoomTokenCache.token;
  }
  
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  
  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom credentials not configured');
  }
  
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=account_credentials&account_id=${accountId}`
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Zoom] Token error:', errorText);
    throw new Error(`Failed to get Zoom access token: ${response.status}`);
  }
  
  const data = await response.json();
  
  zoomTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
  
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // First get the webinar to check if it exists and has registration enabled
    const { data: webinar, error: webinarError } = await supabase
      .from('zoom_webinar')
      .select('zoom_webinar_id, registration_required')
      .eq('id', id)
      .single();
    
    if (webinarError) {
      if (webinarError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Webinar not found' });
      }
      return res.status(500).json({ error: webinarError.message });
    }
    
    // If registration is not required or no Zoom ID, return empty list
    if (!webinar.registration_required || !webinar.zoom_webinar_id) {
      return res.json({ registrants: [], total_records: 0 });
    }
    
    // Get access token and fetch registrants from Zoom
    const accessToken = await getZoomAccessToken();
    
    const zoomResponse = await fetch(
      `https://api.zoom.us/v2/webinars/${webinar.zoom_webinar_id}/registrants?page_size=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!zoomResponse.ok) {
      const errorText = await zoomResponse.text();
      console.error('[Zoom] Fetch registrants error:', errorText);
      return res.status(zoomResponse.status).json({ error: 'Failed to fetch registrants from Zoom' });
    }
    
    const data = await zoomResponse.json();
    
    return res.json({
      registrants: data.registrants || [],
      total_records: data.total_records || 0
    });
  } catch (error) {
    console.error('[Zoom] Fetch registrants error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch registrants' });
  }
}
