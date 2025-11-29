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
    const { email, password, token } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const { data: member, error: memberError } = await supabase
      .from('member')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (memberError || !member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    if (token) {
      const { data: credentials, error: credError } = await supabase
        .from('member_credentials')
        .select('*')
        .eq('member_id', member.id)
        .eq('reset_token', token)
        .single();

      if (credError || !credentials) {
        return res.status(401).json({ success: false, error: 'Invalid or expired reset token' });
      }

      if (credentials.reset_token_expires && new Date(credentials.reset_token_expires) < new Date()) {
        return res.status(401).json({ success: false, error: 'Reset token has expired' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: existingCreds } = await supabase
      .from('member_credentials')
      .select('id')
      .eq('member_id', member.id)
      .single();

    if (existingCreds) {
      const { error: updateError } = await supabase
        .from('member_credentials')
        .update({ 
          password_hash: passwordHash,
          is_temp_password: false,
          password_set_at: new Date().toISOString(),
          reset_token: null,
          reset_token_expires: null,
          failed_login_attempts: 0,
          locked_until: null
        })
        .eq('id', existingCreds.id);
      
      if (updateError) {
        console.error('[Auth] Failed to update password:', updateError);
        return res.status(500).json({ success: false, error: 'Failed to save password' });
      }
      console.log('[Auth] Updated existing credentials for:', email);
    } else {
      const { error: insertError } = await supabase
        .from('member_credentials')
        .insert({
          member_id: member.id,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          is_temp_password: false,
          password_set_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('[Auth] Failed to insert credentials:', insertError);
        return res.status(500).json({ success: false, error: 'Failed to save password' });
      }
      console.log('[Auth] Created new credentials for:', email);
    }

    const { data: fullMember } = await supabase
      .from('member')
      .select('*')
      .eq('id', member.id)
      .single();

    res.setHeader('Set-Cookie', `memberId=${member.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

    console.log('[Auth] Password set for:', email);
    res.json({ success: true, member: fullMember });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ success: false, error: 'Failed to set password' });
  }
}
