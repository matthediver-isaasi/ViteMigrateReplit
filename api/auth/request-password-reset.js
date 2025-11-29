import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { data: member, error: memberError } = await supabase
      .from('member')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single();

    if (memberError || !member) {
      console.log('[Password Reset] No member found for:', email);
      return res.json({ success: true, message: 'If an account exists, a reset link will be sent.' });
    }

    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { data: existingCreds } = await supabase
      .from('member_credentials')
      .select('id')
      .eq('member_id', member.id)
      .single();

    if (existingCreds) {
      await supabase
        .from('member_credentials')
        .update({ 
          reset_token: resetToken,
          reset_token_expires: expiresAt.toISOString()
        })
        .eq('id', existingCreds.id);
    } else {
      await supabase
        .from('member_credentials')
        .insert({
          member_id: member.id,
          email: email.toLowerCase(),
          reset_token: resetToken,
          reset_token_expires: expiresAt.toISOString()
        });
    }

    const host = req.headers.host || 'auth.iconn.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log(`[Password Reset] Link for ${email}: ${resetUrl}`);

    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
    const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;

    if (MAILGUN_API_KEY && MAILGUN_DOMAIN && MAILGUN_FROM_EMAIL) {
      try {
        const formData = new FormData();
        formData.append('from', `AGCAS Portal <${MAILGUN_FROM_EMAIL}>`);
        formData.append('to', email);
        formData.append('subject', 'Reset Your Password');
        formData.append('html', `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${member.first_name || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">AGCAS Member Portal</p>
          </div>
        `);

        const apiBase = 'https://api.eu.mailgun.net/v3';
        const mailgunUrl = `${apiBase}/${MAILGUN_DOMAIN}/messages`;

        const mailResponse = await fetch(mailgunUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
          },
          body: formData
        });

        if (mailResponse.ok) {
          console.log(`[Password Reset] Email sent to ${email}`);
        } else {
          const errorText = await mailResponse.text();
          console.error(`[Password Reset] Mailgun error: ${mailResponse.status} - ${errorText}`);
        }
      } catch (mailError) {
        console.error('[Password Reset] Failed to send email:', mailError);
      }
    } else {
      console.warn('[Password Reset] Mailgun not configured, email not sent');
    }

    res.json({ 
      success: true, 
      message: 'If an account exists, a reset link will be sent.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
}
