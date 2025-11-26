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

const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;

async function getValidZohoAccessToken() {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data: tokens } = await supabase
    .from('zoho_token')
    .select('*')
    .limit(1);

  if (!tokens || tokens.length === 0) {
    throw new Error('No Zoho tokens found. Admin needs to authenticate first.');
  }

  const token = tokens[0];
  const now = new Date();
  const expiresAt = new Date(token.expires_at);

  if (expiresAt > now) {
    return token.access_token;
  }

  const accountsDomain = ZOHO_CRM_API_DOMAIN.includes('.eu') 
    ? 'https://accounts.zoho.eu' 
    : ZOHO_CRM_API_DOMAIN.includes('.com.au')
      ? 'https://accounts.zoho.com.au'
      : 'https://accounts.zoho.com';

  const refreshResponse = await fetch(`${accountsDomain}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      refresh_token: token.refresh_token,
    }),
  });

  const refreshData = await refreshResponse.json();

  if (refreshData.error) {
    throw new Error(`Failed to refresh token: ${refreshData.error}`);
  }

  const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();

  await supabase
    .from('zoho_token')
    .update({
      access_token: refreshData.access_token,
      expires_at: newExpiresAt,
    })
    .eq('id', token.id);

  return refreshData.access_token;
}

const functionHandlers = {
  async sendMagicLink(params, req) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email } = params;
    if (!email) return { success: false, error: 'Email is required' };

    const { data: member, error: memberError } = await supabase
      .from('member')
      .select('id, email, first_name')
      .eq('email', email.toLowerCase())
      .single();

    if (memberError || !member) {
      return { success: false, error: 'No member found with this email address' };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const { error: linkError } = await supabase
      .from('magic_link')
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

    const baseUrl = req.headers.origin || `https://${req.headers.host}`;
    console.log(`Magic link for ${email}: ${baseUrl}/auth/verify?token=${token}`);

    return { success: true };
  },

  async verifyMagicLink(params, req) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { token } = params;
    if (!token) return { success: false, error: 'Token is required' };

    const { data: magicLink, error: linkError } = await supabase
      .from('magic_link')
      .select('*, member(*)')
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
      .from('magic_link')
      .update({ used: true })
      .eq('id', magicLink.id);

    return { success: true, member: magicLink.member };
  },

  async validateMember(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email } = params;

    console.log('[validateMember] Validating member:', email);

    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    const { data: allTeamMembers } = await supabase
      .from('team_member')
      .select('*');

    const teamMember = allTeamMembers?.find(
      tm => tm.email === email && tm.is_active === true
    );

    if (teamMember) {
      console.log('[validateMember] Found active TeamMember');
      return {
        success: true,
        member: {
          email: teamMember.email,
          first_name: teamMember.first_name,
          last_name: teamMember.last_name,
          role_id: teamMember.role_id,
          is_team_member: true,
          member_excluded_features: [],
          has_seen_onboarding_tour: true
        }
      };
    }

    console.log('[validateMember] Not a TeamMember, checking Member entity...');

    const { data: allMembers } = await supabase
      .from('member')
      .select('*');

    let member = allMembers?.find(m => m.email === email);

    if (!member) {
      console.log('[validateMember] Member not found locally, checking Zoho CRM...');
      
      if (!ZOHO_CRM_API_DOMAIN || !ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
        console.log('[validateMember] Zoho not configured, cannot sync from CRM');
        return {
          success: false,
          error: 'Email not found. Please check your email address or contact support.'
        };
      }

      try {
        const accessToken = await getValidZohoAccessToken();
        
        const criteria = `(Email:equals:${email})`;
        const searchUrl = `${ZOHO_CRM_API_DOMAIN}/crm/v3/Contacts/search?criteria=${encodeURIComponent(criteria)}`;
        
        const searchResponse = await fetch(searchUrl, {
          headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
        });

        if (!searchResponse.ok) {
          console.log('[validateMember] CRM search failed');
          return {
            success: false,
            error: 'Email not found. Please check your email address or contact support.'
          };
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.data || searchData.data.length === 0) {
          console.log('[validateMember] Email not found in Zoho CRM');
          return {
            success: false,
            error: 'Email not found. Please check your email address or contact support.'
          };
        }

        const contact = searchData.data[0];
        console.log('[validateMember] Found contact in Zoho CRM:', contact.Email, 'zoho_contact_id:', contact.id);

        const { data: existingMemberByZohoId } = await supabase
          .from('member')
          .select('*')
          .eq('zoho_contact_id', contact.id)
          .limit(1);
        
        if (existingMemberByZohoId && existingMemberByZohoId.length > 0) {
          console.log('[validateMember] Found existing member by zoho_contact_id, updating email');
          const existingMember = existingMemberByZohoId[0];
          await supabase
            .from('member')
            .update({ 
              email: email,
              first_name: contact.First_Name,
              last_name: contact.Last_Name,
              last_synced: new Date().toISOString()
            })
            .eq('id', existingMember.id);
          
          member = { ...existingMember, email, first_name: contact.First_Name, last_name: contact.Last_Name };
        }

        let organizationId = null;
        if (!member && contact.Account_Name?.id) {
          const accountUrl = `${ZOHO_CRM_API_DOMAIN}/crm/v3/Accounts/${contact.Account_Name.id}`;
          const accountResponse = await fetch(accountUrl, {
            headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
          });

          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            const account = accountData.data[0];

            const { data: existingOrgs } = await supabase
              .from('organization')
              .select('*')
              .eq('zoho_account_id', account.id);

            if (existingOrgs && existingOrgs.length > 0) {
              organizationId = existingOrgs[0].id;
              await supabase
                .from('organization')
                .update({
                  name: account.Account_Name,
                  training_fund_balance: account.Training_Fund_Balance || 0,
                  purchase_order_enabled: account.Purchase_Order_Enabled || false,
                  last_synced: new Date().toISOString()
                })
                .eq('id', existingOrgs[0].id);
            } else {
              const { data: newOrg } = await supabase
                .from('organization')
                .insert({
                  name: account.Account_Name,
                  zoho_account_id: account.id,
                  training_fund_balance: account.Training_Fund_Balance || 0,
                  purchase_order_enabled: account.Purchase_Order_Enabled || false,
                  last_synced: new Date().toISOString()
                })
                .select()
                .single();
              organizationId = newOrg?.id;
            }
          }
        }

        if (!member) {
          const { data: allRoles } = await supabase
            .from('role')
            .select('*');
          const defaultRole = allRoles?.find(r => r.is_default === true);

          const memberData = {
            email: email,
            first_name: contact.First_Name,
            last_name: contact.Last_Name,
            zoho_contact_id: contact.id,
            organization_id: organizationId,
            last_synced: new Date().toISOString(),
            login_enabled: true
          };

          if (defaultRole) {
            memberData.role_id = defaultRole.id;
          }

          const { data: newMember, error: insertError } = await supabase
            .from('member')
            .insert(memberData)
            .select()
            .single();

          if (insertError) {
            console.error('[validateMember] Failed to create member:', insertError);
            return {
              success: false,
              error: 'Failed to create member record'
            };
          }

          member = newMember;
          console.log('[validateMember] Created new member from CRM:', member.email);
        }

      } catch (crmError) {
        console.error('[validateMember] CRM sync error:', crmError.message);
        return {
          success: false,
          error: 'Email not found. Please check your email address or contact support.'
        };
      }
    }

    console.log('[validateMember] Found Member record');

    let organizationId = member.organization_id;
    let organizationName = null;
    let trainingFundBalance = 0;
    let purchaseOrderEnabled = false;
    let programTicketBalances = {};

    if (organizationId) {
      const { data: allOrgs } = await supabase
        .from('organization')
        .select('*');

      let org = allOrgs?.find(o => o.id === organizationId);

      if (!org) {
        org = allOrgs?.find(o => o.zoho_account_id === organizationId);
      }

      if (org) {
        organizationName = org.name;
        organizationId = org.id;
        trainingFundBalance = org.training_fund_balance || 0;
        purchaseOrderEnabled = org.purchase_order_enabled || false;
        programTicketBalances = org.program_ticket_balances || {};
      }
    }

    return {
      success: true,
      member: {
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        organization_id: organizationId,
        organization_name: organizationName,
        training_fund_balance: trainingFundBalance,
        purchase_order_enabled: purchaseOrderEnabled,
        program_ticket_balances: programTicketBalances,
        role_id: member.role_id || null,
        member_excluded_features: member.member_excluded_features || [],
        has_seen_onboarding_tour: member.has_seen_onboarding_tour || false,
        is_team_member: false
      }
    };
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

  async checkMemberStatusByEmail(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email } = params;
    const { data: member } = await supabase
      .from('member')
      .select('*')
      .eq('email', email?.toLowerCase())
      .single();

    return { exists: !!member, member };
  },

  async refreshMemberBalance(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email } = params;
    if (!email) return { error: 'Email required' };

    const accessToken = await getValidZohoAccessToken();

    const { data: allMembers } = await supabase
      .from('member')
      .select('*');

    const member = allMembers?.find(m => m.email === email);

    if (!member) {
      return { error: 'Member not found', searchedEmail: email };
    }

    const criteria = `(Email:equals:${email})`;
    const searchUrl = `${ZOHO_CRM_API_DOMAIN}/crm/v3/Contacts/search?criteria=${encodeURIComponent(criteria)}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
    });

    if (!searchResponse.ok) {
      return { error: 'CRM lookup failed' };
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.data || searchData.data.length === 0) {
      return { error: 'Contact not found in CRM' };
    }

    const contact = searchData.data[0];

    if (contact.Account_Name?.id) {
      const accountUrl = `${ZOHO_CRM_API_DOMAIN}/crm/v3/Accounts/${contact.Account_Name.id}`;
      const accountResponse = await fetch(accountUrl, {
        headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        const account = accountData.data[0];

        const { data: existingOrgs } = await supabase
          .from('organization')
          .select('*')
          .eq('zoho_account_id', account.id);

        if (existingOrgs && existingOrgs.length > 0) {
          const updatedBalance = account.Training_Fund_Balance || 0;
          
          await supabase
            .from('organization')
            .update({
              training_fund_balance: updatedBalance,
              purchase_order_enabled: account.Purchase_Order_Enabled || false,
              last_synced: new Date().toISOString()
            })
            .eq('id', existingOrgs[0].id);

          return {
            success: true,
            training_fund_balance: updatedBalance,
            organization_name: existingOrgs[0].name
          };
        }
      }
    }

    return { success: true, training_fund_balance: 0 };
  },

  async syncMemberFromCRM() {
    return { success: true, message: 'Use validateMember instead for CRM sync' };
  },

  async generateMemberHandles(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { member_email, member_id, generate_all } = params;

    const generateHandle = (firstName, lastName) => {
      const first = (firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const last = (lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const random = Math.random().toString(36).substring(2, 6);
      return `${first}${last}${random}`;
    };

    if (generate_all) {
      const { data: members } = await supabase
        .from('member')
        .select('id, first_name, last_name, handle')
        .is('handle', null);

      if (!members || members.length === 0) {
        return { success: true, message: 'No members without handles found', updated: 0 };
      }

      let updated = 0;
      for (const member of members) {
        const handle = generateHandle(member.first_name, member.last_name);
        await supabase
          .from('member')
          .update({ handle })
          .eq('id', member.id);
        updated++;
      }

      return { success: true, message: `Generated handles for ${updated} members`, updated };
    }

    let memberId = member_id;
    if (!memberId && member_email) {
      const { data: member } = await supabase
        .from('member')
        .select('id, first_name, last_name')
        .eq('email', member_email)
        .single();
      
      if (!member) {
        return { success: false, error: 'Member not found' };
      }
      memberId = member.id;
    }

    if (!memberId) {
      return { success: false, error: 'member_id or member_email required' };
    }

    const { data: member } = await supabase
      .from('member')
      .select('id, first_name, last_name')
      .eq('id', memberId)
      .single();

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    const handle = generateHandle(member.first_name, member.last_name);
    await supabase
      .from('member')
      .update({ handle })
      .eq('id', member.id);

    return { success: true, handle };
  },

  async validateColleague(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { email, memberEmail, organizationId } = params;

    if (!email || !organizationId) {
      return { valid: false, error: 'Missing required parameters' };
    }

    const accessToken = await getValidZohoAccessToken();

    const criteria = `(Email:equals:${email})`;
    const searchUrl = `${ZOHO_CRM_API_DOMAIN}/crm/v3/Contacts/search?criteria=${encodeURIComponent(criteria)}`;

    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
    });

    let searchData = { data: [] };
    const responseText = await searchResponse.text();

    if (responseText && responseText.trim() !== '') {
      try {
        searchData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse search response:', responseText);
        searchData = { data: [] };
      }
    }

    if (searchResponse.ok && searchData.data && searchData.data.length > 0) {
      const contact = searchData.data[0];

      if (!contact.Account_Name?.id || contact.Account_Name.id !== organizationId) {
        return {
          valid: false,
          status: 'wrong_organization',
          error: 'A ticket will be sent shortly. This email address cannot be verified, AGCAS will be in touch.'
        };
      }

      return {
        valid: true,
        status: 'verified',
        first_name: contact.First_Name,
        last_name: contact.Last_Name,
        zoho_contact_id: contact.id
      };
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      return { valid: false, status: 'invalid_email', error: 'Invalid email format' };
    }

    const { data: allOrgs } = await supabase.from('organization').select('*');
    let targetOrg = allOrgs?.find(o => o.id === organizationId);
    if (!targetOrg) {
      targetOrg = allOrgs?.find(o => o.zoho_account_id === organizationId);
    }

    if (targetOrg?.email_domains) {
      const orgDomains = targetOrg.email_domains.map(d => d.toLowerCase());
      if (orgDomains.includes(emailDomain)) {
        return {
          valid: true,
          status: 'domain_match',
          message: 'Email domain matches organization'
        };
      }
    }

    return {
      valid: true,
      status: 'external',
      message: 'A ticket will be sent shortly. This email address cannot be verified, AGCAS will be in touch.'
    };
  },

  async createBooking(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const {
      eventId,
      memberEmail,
      attendees,
      registrationMode,
      numberOfLinks = 0,
      ticketsRequired,
      programTag
    } = params;

    if (!eventId || !memberEmail) {
      return { success: false, error: 'Missing required parameters: eventId and memberEmail' };
    }

    const { data: allMembers } = await supabase.from('member').select('*');
    const member = allMembers?.find(m => m.email === memberEmail);

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    const { data: allEvents } = await supabase.from('event').select('*');
    const event = allEvents?.find(e => e.id === eventId);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (!programTag || !event.program_tag) {
      return { success: false, error: 'This event does not have a program association' };
    }

    if (!member.organization_id) {
      return { success: false, error: 'Member does not have an associated organization' };
    }

    const { data: allOrgs } = await supabase.from('organization').select('*');
    let org = allOrgs?.find(o => o.id === member.organization_id);
    if (!org) {
      org = allOrgs?.find(o => o.zoho_account_id === member.organization_id);
    }

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    const currentBalances = org.program_ticket_balances || {};
    const currentBalance = currentBalances[programTag] || 0;

    if (currentBalance < ticketsRequired) {
      return { success: false, error: `Insufficient program tickets. Required: ${ticketsRequired}, Available: ${currentBalance}` };
    }

    const bookingReference = `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const createdBookings = [];

    if (registrationMode === 'self' || registrationMode === 'colleagues') {
      for (const attendee of (attendees || [])) {
        const { data: booking } = await supabase
          .from('booking')
          .insert({
            event_id: eventId,
            member_id: member.id,
            attendee_email: attendee.email,
            attendee_first_name: attendee.first_name,
            attendee_last_name: attendee.last_name,
            ticket_price: event.ticket_price || 0,
            booking_reference: bookingReference,
            status: 'pending_backstage_sync',
            payment_method: 'program_ticket'
          })
          .select()
          .single();

        if (booking) createdBookings.push(booking);
      }
    } else if (registrationMode === 'links') {
      for (let i = 0; i < numberOfLinks; i++) {
        const confirmationToken = crypto.randomUUID();

        const { data: booking } = await supabase
          .from('booking')
          .insert({
            event_id: eventId,
            member_id: member.id,
            attendee_email: '',
            attendee_first_name: '',
            attendee_last_name: '',
            ticket_price: event.ticket_price || 0,
            booking_reference: bookingReference,
            status: 'pending',
            payment_method: 'program_ticket',
            confirmation_token: confirmationToken
          })
          .select()
          .single();

        if (booking) createdBookings.push(booking);
      }
    }

    const newBalance = currentBalance - ticketsRequired;
    const updatedBalances = { ...currentBalances, [programTag]: newBalance };

    await supabase
      .from('organization')
      .update({ program_ticket_balances: updatedBalances, last_synced: new Date().toISOString() })
      .eq('id', org.id);

    await supabase
      .from('program_ticket_transaction')
      .insert({
        organization_id: org.id,
        program_name: programTag,
        transaction_type: 'usage',
        quantity: ticketsRequired,
        booking_reference: bookingReference,
        event_name: event.title || 'Unknown Event',
        member_email: memberEmail,
        notes: `Used ${ticketsRequired} ${programTag} ticket(s) for ${event.title || 'event'}`
      });

    return {
      success: true,
      booking_reference: bookingReference,
      bookings: createdBookings,
      tickets_used: ticketsRequired,
      remaining_balance: newBalance,
      warning: 'Backstage sync not performed in serverless mode - admin may need to sync manually'
    };
  },

  async processProgramTicketPurchase(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const {
      organizationId,
      programName,
      quantity,
      paymentMethod,
      memberEmail,
      stripePaymentIntentId
    } = params;

    if (!organizationId || !programName || !quantity) {
      return { success: false, error: 'Missing required parameters' };
    }

    const { data: allOrgs } = await supabase.from('organization').select('*');
    let org = allOrgs?.find(o => o.id === organizationId);
    if (!org) {
      org = allOrgs?.find(o => o.zoho_account_id === organizationId);
    }

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    const currentBalances = org.program_ticket_balances || {};
    const currentBalance = currentBalances[programName] || 0;
    const newBalance = currentBalance + quantity;

    const updatedBalances = { ...currentBalances, [programName]: newBalance };

    await supabase
      .from('organization')
      .update({ program_ticket_balances: updatedBalances, last_synced: new Date().toISOString() })
      .eq('id', org.id);

    const { data: transaction } = await supabase
      .from('program_ticket_transaction')
      .insert({
        organization_id: org.id,
        program_name: programName,
        transaction_type: 'purchase',
        quantity: quantity,
        payment_method: paymentMethod,
        member_email: memberEmail,
        stripe_payment_intent_id: stripePaymentIntentId,
        notes: `Purchased ${quantity} ${programName} ticket(s)`
      })
      .select()
      .single();

    return {
      success: true,
      transaction_id: transaction?.id,
      new_balance: newBalance,
      organization_id: org.id
    };
  },

  async syncBackstageEvents() {
    return { 
      success: false, 
      error: 'Event sync should be triggered from admin panel in development environment' 
    };
  },

  async updateExpiredVouchers() {
    if (!supabase) throw new Error('Supabase not configured');
    
    const now = new Date().toISOString();
    
    const { data: expiredVouchers, error } = await supabase
      .from('voucher')
      .update({ status: 'expired' })
      .lt('expiry_date', now)
      .eq('status', 'active')
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      expired_count: expiredVouchers?.length || 0 
    };
  },

  async applyDiscountCode(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { code, memberEmail, eventId, amount } = params;

    if (!code) {
      return { valid: false, error: 'Discount code is required' };
    }

    const { data: discountCodes } = await supabase
      .from('discount_code')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true);

    if (!discountCodes || discountCodes.length === 0) {
      return { valid: false, error: 'Invalid discount code' };
    }

    const discountCode = discountCodes[0];

    if (discountCode.expiry_date && new Date(discountCode.expiry_date) < new Date()) {
      return { valid: false, error: 'Discount code has expired' };
    }

    if (discountCode.max_uses && discountCode.times_used >= discountCode.max_uses) {
      return { valid: false, error: 'Discount code has reached maximum uses' };
    }

    let discountAmount = 0;
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (amount * discountCode.discount_value) / 100;
    } else {
      discountAmount = discountCode.discount_value;
    }

    return {
      valid: true,
      discount_code_id: discountCode.id,
      discount_type: discountCode.discount_type,
      discount_value: discountCode.discount_value,
      discount_amount: Math.min(discountAmount, amount),
      final_amount: Math.max(0, amount - discountAmount)
    };
  },

  async createJobPostingPaymentIntent(params) {
    if (!stripe) throw new Error('Stripe not configured');
    
    const { amount, jobTitle, companyName, contactEmail } = params;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'gbp',
      metadata: {
        type: 'job_posting',
        job_title: jobTitle,
        company_name: companyName,
        contact_email: contactEmail
      }
    });

    return { clientSecret: paymentIntent.client_secret };
  },

  async createJobPostingMember(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const {
      title,
      description,
      company_name,
      location,
      salary_range,
      job_type,
      application_url,
      contact_email,
      memberEmail,
      is_featured = false
    } = params;

    const { data: allMembers } = await supabase.from('member').select('*');
    const member = allMembers?.find(m => m.email === memberEmail);

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    const { data: jobPosting, error } = await supabase
      .from('job_posting')
      .insert({
        title,
        description,
        company_name,
        location,
        salary_range,
        job_type,
        application_url,
        contact_email,
        posted_by_member_id: member.id,
        posted_by_organization_id: member.organization_id || null,
        is_featured,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job_posting: jobPosting };
  },

  async createJobPostingNonMember(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const {
      title,
      description,
      company_name,
      location,
      salary_range,
      job_type,
      application_url,
      contact_email,
      contact_name,
      is_featured = false,
      stripe_payment_intent_id
    } = params;

    const { data: jobPosting, error } = await supabase
      .from('job_posting')
      .insert({
        title,
        description,
        company_name,
        location,
        salary_range,
        job_type,
        application_url,
        contact_email,
        contact_name,
        is_featured,
        status: 'active',
        stripe_payment_intent_id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, job_posting: jobPosting };
  },

  async cancelProgramTicketTransaction(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { transactionId, reason, memberEmail } = params;

    const { data: transaction } = await supabase
      .from('program_ticket_transaction')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.transaction_type !== 'usage') {
      return { success: false, error: 'Can only cancel usage transactions' };
    }

    const { data: org } = await supabase
      .from('organization')
      .select('*')
      .eq('id', transaction.organization_id)
      .single();

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    const currentBalances = org.program_ticket_balances || {};
    const currentBalance = currentBalances[transaction.program_name] || 0;
    const newBalance = currentBalance + transaction.quantity;

    await supabase
      .from('organization')
      .update({
        program_ticket_balances: { ...currentBalances, [transaction.program_name]: newBalance }
      })
      .eq('id', org.id);

    await supabase
      .from('program_ticket_transaction')
      .update({
        cancelled_at: new Date().toISOString(),
        cancelled_by_member_email: memberEmail,
        cancellation_reason: reason
      })
      .eq('id', transactionId);

    await supabase
      .from('program_ticket_transaction')
      .insert({
        organization_id: org.id,
        program_name: transaction.program_name,
        transaction_type: 'refund',
        quantity: transaction.quantity,
        member_email: memberEmail,
        notes: `Refund for cancelled transaction. Reason: ${reason || 'Not specified'}`
      });

    return {
      success: true,
      refunded_quantity: transaction.quantity,
      new_balance: newBalance
    };
  },

  async reinstateProgramTicketTransaction(params) {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { transactionId, memberEmail } = params;

    const { data: transaction } = await supabase
      .from('program_ticket_transaction')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (!transaction.cancelled_at) {
      return { success: false, error: 'Transaction is not cancelled' };
    }

    const { data: org } = await supabase
      .from('organization')
      .select('*')
      .eq('id', transaction.organization_id)
      .single();

    if (!org) {
      return { success: false, error: 'Organization not found' };
    }

    const currentBalances = org.program_ticket_balances || {};
    const currentBalance = currentBalances[transaction.program_name] || 0;
    const newBalance = currentBalance - transaction.quantity;

    if (newBalance < 0) {
      return { success: false, error: 'Insufficient balance to reinstate transaction' };
    }

    await supabase
      .from('organization')
      .update({
        program_ticket_balances: { ...currentBalances, [transaction.program_name]: newBalance }
      })
      .eq('id', org.id);

    await supabase
      .from('program_ticket_transaction')
      .update({
        cancelled_at: null,
        cancelled_by_member_email: null,
        cancellation_reason: null,
        notes: transaction.notes + ` | Reinstated by ${memberEmail} on ${new Date().toISOString()}`
      })
      .eq('id', transactionId);

    return {
      success: true,
      reinstated_quantity: transaction.quantity,
      new_balance: newBalance
    };
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
        error: `Function '${functionName}' is not yet implemented in serverless`
      });
    }

    const result = await handlerFn(req.body, req);
    return res.json(result);
  } catch (error) {
    console.error(`Function ${functionName} error:`, error);
    return res.status(500).json({ error: error.message || 'Function execution failed' });
  }
}
