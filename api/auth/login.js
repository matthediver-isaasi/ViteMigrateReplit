import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { data: credentials, error: credError } = await supabase
      .from('member_credentials')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (credError || !credentials) {
      console.log('[Auth Login] No credentials found for:', email);
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (credentials.locked_until && new Date(credentials.locked_until) > new Date()) {
      return res.status(401).json({ success: false, error: 'Account temporarily locked. Please try again later.' });
    }

    if (!credentials.password_hash) {
      return res.status(401).json({ 
        success: false, 
        error: 'Password not set', 
        needsPasswordSetup: true,
        memberId: credentials.member_id 
      });
    }

    const isValid = await bcrypt.compare(password, credentials.password_hash);
    
    if (!isValid) {
      const newFailedAttempts = (credentials.failed_attempts || 0) + 1;
      const updates = { failed_attempts: newFailedAttempts };
      
      if (newFailedAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      
      await supabase
        .from('member_credentials')
        .update(updates)
        .eq('id', credentials.id);
      
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    await supabase
      .from('member_credentials')
      .update({ 
        failed_attempts: 0, 
        locked_until: null,
        last_login: new Date().toISOString() 
      })
      .eq('id', credentials.id);

    const { data: member, error: memberError } = await supabase
      .from('member')
      .select('*')
      .eq('id', credentials.member_id)
      .single();

    if (memberError || !member) {
      return res.status(401).json({ success: false, error: 'Member not found' });
    }

    if (!member.role_id) {
      const { data: allRoles } = await supabase.from('role').select('*');
      const memberRole = allRoles?.find((r) => r.name === 'Member');
      const defaultRole = memberRole || allRoles?.find((r) => r.is_default === true);
      
      if (defaultRole) {
        await supabase
          .from('member')
          .update({ role_id: defaultRole.id })
          .eq('id', member.id);
        member.role_id = defaultRole.id;
      }
    }

    res.setHeader('Set-Cookie', `memberId=${member.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

    console.log('[Auth Login] Success for:', email);
    
    res.json({ 
      success: true, 
      member,
      isTemporaryPassword: credentials.is_temp_password 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
}
