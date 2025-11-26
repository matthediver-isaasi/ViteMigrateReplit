import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Function handlers
const functionHandlers = {
  async sendMagicLink(params, req) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email } = params;
    if (!email) return { success: false, error: 'Email is required' };

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single();

    if (memberError || !member) {
      return { success: false, error: 'No member found with this email address' };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const { error: linkError } = await supabase
      .from('magic_links')
      .insert({
        member_id: member.id,
        token,
        email: email.toLowerCase(),
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (linkError) {
      console.error('Failed to create magic link:', linkError);
      return { success: false, error: 'Failed to create login link' };
    }

    // Log magic link URL (in production, send via email)
    const baseUrl = req.headers.origin || `https://${req.headers.host}`;
    console.log(`Magic link for ${email}: ${baseUrl}/auth/verify?token=${token}`);

    return { success: true };
  },

  async verifyMagicLink(params, req) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { token } = params;
    if (!token) return { success: false, error: 'Token is required' };

    const { data: magicLink, error: linkError } = await supabase
      .from('magic_links')
      .select('*, members(*)')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (linkError || !magicLink) {
      return { success: false, error: 'Invalid or expired link' };
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      return { success: false, error: 'Link has expired' };
    }

    await supabase
      .from('magic_links')
      .update({ used: true })
      .eq('id', magicLink.id);

    return { success: true, member: magicLink.members };
  },

  async validateMember(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email } = params;
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('email', email?.toLowerCase())
      .single();

    return { valid: !!member, member };
  },

  async getStripePublishableKey() {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) throw new Error('Stripe not configured');
    return { publishableKey };
  },

  async createStripePaymentIntent(params) {
    if (!stripe) throw new Error('Stripe not configured');
    
    const { amount, currency = 'gbp', metadata } = params;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata
    });

    return { clientSecret: paymentIntent.client_secret };
  },

  async syncMemberFromCRM() {
    return { success: true, message: 'Zoho CRM sync not yet implemented' };
  },

  async checkMemberStatusByEmail(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email } = params;
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('email', email?.toLowerCase())
      .single();

    return { exists: !!member, member };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { functionName } = req.query;
  
  try {
    const handlerFn = functionHandlers[functionName];
    
    if (!handlerFn) {
      console.log(`Function called: ${functionName}`, req.body);
      return res.json({ 
        success: false, 
        error: `Function '${functionName}' is not yet implemented`
      });
    }

    const result = await handlerFn(req.body, req);
    return res.json(result);
  } catch (error) {
    console.error(`Function ${functionName} error:`, error);
    return res.status(500).json({ error: error.message || 'Function execution failed' });
  }
}
