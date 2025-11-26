import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { createClient } from "@supabase/supabase-js";
import session from "express-session";
import MemoryStore from "memorystore";

// Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Entity name to Supabase table mapping (matches Base44 singular table names)
const entityToTable: Record<string, string> = {
  'Member': 'member',
  'Organization': 'organization',
  'Event': 'event',
  'ZohoToken': 'zoho_token',
  'Booking': 'booking',
  'ProgramTicketTransaction': 'program_ticket_transaction',
  'MagicLink': 'magic_link',
  'OrganizationContact': 'organization_contact',
  'Program': 'program',
  'Voucher': 'voucher',
  'XeroToken': 'xero_token',
  'BlogPost': 'blog_post',
  'Role': 'role',
  'TeamMember': 'team_member',
  'DiscountCode': 'discount_code',
  'DiscountCodeUsage': 'discount_code_usage',
  'SystemSettings': 'system_settings',
  'TourGroup': 'tour_group',
  'TourStep': 'tour_step',
  'Resource': 'resource',
  'ResourceCategory': 'resource_category',
  'FileRepository': 'file_repository',
  'ResourceAuthorSettings': 'resource_author_settings',
  'JobPosting': 'job_posting',
  'PageBanner': 'page_banner',
  'IEditPage': 'iedit_page',
  'IEditPageElement': 'iedit_page_element',
  'IEditElementTemplate': 'iedit_element_template',
  'ResourceFolder': 'resource_folder',
  'FileRepositoryFolder': 'file_repository_folder',
  'NavigationItem': 'navigation_item',
  'ArticleCategory': 'article_category',
  'ArticleComment': 'article_comment',
  'CommentReaction': 'comment_reaction',
  'ArticleReaction': 'article_reaction',
  'ArticleView': 'article_view',
  'ButtonStyle': 'button_style',
  'Award': 'award',
  'OfflineAward': 'offline_award',
  'OfflineAwardAssignment': 'offline_award_assignment',
  'WallOfFameSection': 'wall_of_fame_section',
  'WallOfFameCategory': 'wall_of_fame_category',
  'WallOfFamePerson': 'wall_of_fame_person',
  'Floater': 'floater',
  'Form': 'form',
  'FormSubmission': 'form_submission',
  'NewsPost': 'news_post',
  'SupportTicket': 'support_ticket',
  'SupportTicketResponse': 'support_ticket_response',
  'PortalNavigationItem': 'portal_navigation_item',
  'MemberGroup': 'member_group',
  'MemberGroupAssignment': 'member_group_assignment',
  'GuestWriter': 'guest_writer',
  'PortalMenu': 'portal_menu',
  'AwardClassification': 'award_classification',
  'AwardSublevel': 'award_sublevel',
  'MemberGroupGuest': 'member_group_guest',
};

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    memberEmail?: string;
    memberId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'iconnect-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  // Helper to get table name from entity (uses singular form for Base44 compatibility)
  const getTableName = (entity: string): string => {
    return entityToTable[entity] || entity.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  };

  // ============ Entity Routes ============
  
  // List entities
  app.get('/api/entities/:entity', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { entity } = req.params;
      const tableName = getTableName(entity);
      const { filter, sort, limit, offset, expand } = req.query;

      let query = supabase.from(tableName).select(expand as string || '*');

      // Apply filters
      if (filter) {
        const filterObj = JSON.parse(filter as string);
        Object.entries(filterObj).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            const filterOp = value as Record<string, unknown>;
            if ('eq' in filterOp) query = query.eq(key, filterOp.eq);
            if ('neq' in filterOp) query = query.neq(key, filterOp.neq);
            if ('gt' in filterOp) query = query.gt(key, filterOp.gt);
            if ('gte' in filterOp) query = query.gte(key, filterOp.gte);
            if ('lt' in filterOp) query = query.lt(key, filterOp.lt);
            if ('lte' in filterOp) query = query.lte(key, filterOp.lte);
            if ('like' in filterOp) query = query.like(key, filterOp.like as string);
            if ('ilike' in filterOp) query = query.ilike(key, filterOp.ilike as string);
            if ('is' in filterOp) query = query.is(key, filterOp.is as null);
            if ('in' in filterOp) query = query.in(key, filterOp.in as unknown[]);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply sorting
      if (sort) {
        const sortObj = JSON.parse(sort as string);
        Object.entries(sortObj).forEach(([key, direction]) => {
          query = query.order(key, { ascending: direction === 'asc' });
        });
      }

      // Apply pagination
      if (limit) query = query.limit(parseInt(limit as string));
      if (offset) query = query.range(
        parseInt(offset as string), 
        parseInt(offset as string) + parseInt(limit as string || '100') - 1
      );

      const { data, error } = await query;

      if (error) {
        console.error(`Error listing ${entity}:`, error);
        return res.status(500).json({ error: error.message });
      }

      res.json(data || []);
    } catch (error) {
      console.error('Entity list error:', error);
      res.status(500).json({ error: 'Failed to list entities' });
    }
  });

  // Get single entity
  app.get('/api/entities/:entity/:id', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { entity, id } = req.params;
      const tableName = getTableName(entity);
      const { expand } = req.query;

      const { data, error } = await supabase
        .from(tableName)
        .select(expand as string || '*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Not found' });
        }
        return res.status(500).json({ error: error.message });
      }

      res.json(data);
    } catch (error) {
      console.error('Entity get error:', error);
      res.status(500).json({ error: 'Failed to get entity' });
    }
  });

  // Create entity
  app.post('/api/entities/:entity', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { entity } = req.params;
      const tableName = getTableName(entity);

      const { data, error } = await supabase
        .from(tableName)
        .insert(req.body)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Entity create error:', error);
      res.status(500).json({ error: 'Failed to create entity' });
    }
  });

  // Update entity
  app.patch('/api/entities/:entity/:id', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { entity, id } = req.params;
      const tableName = getTableName(entity);

      const { data, error } = await supabase
        .from(tableName)
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json(data);
    } catch (error) {
      console.error('Entity update error:', error);
      res.status(500).json({ error: 'Failed to update entity' });
    }
  });

  // Delete entity
  app.delete('/api/entities/:entity/:id', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { entity, id } = req.params;
      const tableName = getTableName(entity);

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Entity delete error:', error);
      res.status(500).json({ error: 'Failed to delete entity' });
    }
  });

  // ============ Auth Routes ============
  
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    if (!req.session.memberId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', req.session.memberId)
        .single();

      if (error || !data) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json(data);
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });

  // ============ Function Routes ============
  
  // Send Magic Link
  app.post('/api/functions/sendMagicLink', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      // Check if member exists
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, email, first_name')
        .eq('email', email.toLowerCase())
        .single();

      if (memberError || !member) {
        return res.json({ success: false, error: 'No member found with this email address' });
      }

      // Generate magic link token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Store magic link
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
        return res.status(500).json({ success: false, error: 'Failed to create login link' });
      }

      // In production, send email with magic link
      // For now, log it and return success
      const magicLinkUrl = `${req.protocol}://${req.get('host')}/auth/verify?token=${token}`;
      console.log(`Magic link for ${email}: ${magicLinkUrl}`);

      // TODO: Send email via SendGrid, Resend, or another email service
      // await sendEmail({ to: email, subject: 'Your login link', body: ... });

      res.json({ success: true });
    } catch (error) {
      console.error('Send magic link error:', error);
      res.status(500).json({ success: false, error: 'Failed to send login link' });
    }
  });

  // Verify Magic Link
  app.post('/api/functions/verifyMagicLink', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }

      // Find magic link
      const { data: magicLink, error: linkError } = await supabase
        .from('magic_links')
        .select('*, members(*)')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (linkError || !magicLink) {
        return res.json({ success: false, error: 'Invalid or expired link' });
      }

      // Check if expired
      if (new Date(magicLink.expires_at) < new Date()) {
        return res.json({ success: false, error: 'Link has expired' });
      }

      // Mark as used
      await supabase
        .from('magic_links')
        .update({ used: true })
        .eq('id', magicLink.id);

      // Set session
      req.session.memberId = magicLink.member_id;
      req.session.memberEmail = magicLink.email;

      res.json({ success: true, member: magicLink.members });
    } catch (error) {
      console.error('Verify magic link error:', error);
      res.status(500).json({ success: false, error: 'Failed to verify link' });
    }
  });

  // Validate Member
  app.post('/api/functions/validateMember', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { email } = req.body;

      console.log('[validateMember] Validating member:', email);

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Step 1: Check if this is a TeamMember first
      const { data: allTeamMembers } = await supabase
        .from('team_member')
        .select('*');

      const teamMember = allTeamMembers?.find(
        (tm: any) => tm.email === email && tm.is_active === true
      );

      if (teamMember) {
        console.log('[validateMember] Found active TeamMember');

        return res.json({
          success: true,
          member: {
            email: teamMember.email,
            first_name: teamMember.first_name,
            last_name: teamMember.last_name,
            role_id: teamMember.role_id,
            is_team_member: true,
            member_excluded_features: [],
            has_seen_onboarding_tour: true // Team members don't need the tour
          }
        });
      }

      console.log('[validateMember] Not a TeamMember, checking Member entity...');

      // Step 2: Check Member entity directly
      const { data: allMembers } = await supabase
        .from('member')
        .select('*');

      const member = allMembers?.find((m: any) => m.email === email);

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Email not found. Please check your email address or contact support.'
        });
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

        let org = allOrgs?.find((o: any) => o.id === organizationId);

        if (!org) {
          org = allOrgs?.find((o: any) => o.zoho_account_id === organizationId);
        }

        if (org) {
          organizationName = org.name;
          organizationId = org.id;
          trainingFundBalance = org.training_fund_balance || 0;
          purchaseOrderEnabled = org.purchase_order_enabled || false;
          programTicketBalances = org.program_ticket_balances || {};
        }
      }

      res.json({
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
      });

    } catch (error: any) {
      console.error('[validateMember] ERROR:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to validate member. Please try again later.',
        details: error.message
      });
    }
  });

  // Get Stripe Publishable Key
  app.post('/api/functions/getStripePublishableKey', async (req: Request, res: Response) => {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    res.json({ publishableKey });
  });

  // Create Stripe Payment Intent
  app.post('/api/functions/createStripePaymentIntent', async (req: Request, res: Response) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    try {
      // Dynamic import for Stripe
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecretKey);

      const { amount, currency = 'gbp', metadata } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency,
        metadata
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Sync Member from CRM (Zoho)
  app.post('/api/functions/syncMemberFromCRM', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';

    try {
      const { email, accessToken } = req.body;

      if (!email || !accessToken) {
        return res.status(400).json({
          error: 'Missing required parameters',
          required: ['email', 'accessToken']
        });
      }

      // Search for contact in Zoho CRM by email
      const searchResponse = await fetch(
        `${ZOHO_CRM_API_DOMAIN}/crm/v3/Contacts/search?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      const searchData = await searchResponse.json();

      if (!searchResponse.ok || !searchData.data || searchData.data.length === 0) {
        return res.status(404).json({
          error: 'Member not found in CRM',
          email: email
        });
      }

      const contact = searchData.data[0];

      // Get associated Account (Organization) details
      let organizationName = null;
      let organizationId = null;
      let trainingFundBalance = 0;
      let purchaseOrderEnabled = false;
      let domain = null;
      let additionalVerifiedDomains: string[] = [];

      if (contact.Account_Name?.id) {
        const accountResponse = await fetch(
          `${ZOHO_CRM_API_DOMAIN}/crm/v3/Accounts/${contact.Account_Name.id}`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
            },
          }
        );

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          const account = accountData.data[0];

          organizationName = account.Account_Name;
          organizationId = account.id;
          trainingFundBalance = account.Training_Fund_Balance || 0;
          purchaseOrderEnabled = account.Purchase_Order_Enabled || false;
          domain = account.Domain || null;
          additionalVerifiedDomains = account.Additional_verified_domains || [];

          // Create or update Organization in Supabase
          const { data: existingOrgs } = await supabase
            .from('organization')
            .select('id')
            .eq('zoho_account_id', organizationId);

          if (existingOrgs && existingOrgs.length > 0) {
            await supabase
              .from('organization')
              .update({
                name: organizationName,
                domain: domain,
                additional_verified_domains: additionalVerifiedDomains,
                training_fund_balance: trainingFundBalance,
                purchase_order_enabled: purchaseOrderEnabled,
                last_synced: new Date().toISOString()
              })
              .eq('id', existingOrgs[0].id);
          } else {
            await supabase
              .from('organization')
              .insert({
                name: organizationName,
                zoho_account_id: organizationId,
                domain: domain,
                additional_verified_domains: additionalVerifiedDomains,
                training_fund_balance: trainingFundBalance,
                purchase_order_enabled: purchaseOrderEnabled,
                last_synced: new Date().toISOString()
              });
          }
        }
      }

      // Create or update Member in Supabase
      const { data: existingMembers } = await supabase
        .from('member')
        .select('*')
        .eq('email', email);

      const memberData = {
        email: email,
        first_name: contact.First_Name,
        last_name: contact.Last_Name,
        zoho_contact_id: contact.id,
        organization_id: organizationId,
        last_synced: new Date().toISOString()
      };

      let member;
      if (existingMembers && existingMembers.length > 0) {
        const { data: updatedMember } = await supabase
          .from('member')
          .update(memberData)
          .eq('id', existingMembers[0].id)
          .select()
          .single();
        member = updatedMember || { ...existingMembers[0], ...memberData };
      } else {
        const { data: newMember } = await supabase
          .from('member')
          .insert(memberData)
          .select()
          .single();
        member = newMember;
      }

      res.json({
        success: true,
        member: {
          ...member,
          organization_name: organizationName,
          training_fund_balance: trainingFundBalance,
          purchase_order_enabled: purchaseOrderEnabled
        }
      });

    } catch (error: any) {
      console.error('Sync member from CRM error:', error);
      res.status(500).json({
        error: 'Failed to sync member data',
        message: error.message
      });
    }
  });

  // Helper function to get valid Zoho access token (refreshes if expired)
  async function getValidZohoAccessToken(): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');
    
    const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';
    const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
    const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;

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

    // If token is still valid, return it
    if (expiresAt > now) {
      return token.access_token;
    }

    // Token expired, need to refresh
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
        client_id: ZOHO_CLIENT_ID!,
        client_secret: ZOHO_CLIENT_SECRET!,
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

  // Refresh Member Balance from Zoho CRM
  app.post('/api/functions/refreshMemberBalance', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const accessToken = await getValidZohoAccessToken();

      // Get all members and find by email
      const { data: allMembers } = await supabase
        .from('member')
        .select('*');

      const member = allMembers?.find((m: any) => m.email === email);

      if (!member) {
        return res.status(404).json({
          error: 'Member not found',
          searchedEmail: email
        });
      }

      // Fetch fresh contact data from Zoho
      const contactResponse = await fetch(
        `${ZOHO_CRM_API_DOMAIN}/crm/v3/Contacts/${member.zoho_contact_id}`,
        { headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` } }
      );

      if (!contactResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch contact' });
      }

      const contactData = await contactResponse.json();
      const contact = contactData.data[0];

      // Update member last synced
      await supabase
        .from('member')
        .update({ last_synced: new Date().toISOString() })
        .eq('id', member.id);

      let trainingFundBalance = 0;
      let purchaseOrderEnabled = false;

      if (member.organization_id && contact.Account_Name?.id) {
        const accountResponse = await fetch(
          `${ZOHO_CRM_API_DOMAIN}/crm/v3/Accounts/${contact.Account_Name.id}`,
          { headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` } }
        );

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();
          const account = accountData.data[0];

          trainingFundBalance = account.Training_fund_balance || 0;
          purchaseOrderEnabled = account.Purchase_Order_Enabled || false;

          // Find and update organization
          const { data: allOrgs } = await supabase
            .from('organization')
            .select('*');

          const org = allOrgs?.find((o: any) => o.zoho_account_id === contact.Account_Name.id);

          if (org) {
            await supabase
              .from('organization')
              .update({
                training_fund_balance: trainingFundBalance,
                purchase_order_enabled: purchaseOrderEnabled,
                last_synced: new Date().toISOString()
              })
              .eq('id', org.id);
          }
        }
      }

      res.json({
        success: true,
        training_fund_balance: trainingFundBalance,
        purchase_order_enabled: purchaseOrderEnabled
      });

    } catch (error: any) {
      console.error('Refresh member balance error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Sync Events from Zoho Backstage (simple version)
  app.post('/api/functions/syncEventsFromBackstage', async (req: Request, res: Response) => {
    // Redirect to the more complete syncBackstageEvents
    return res.redirect(307, '/api/functions/syncBackstageEvents');
  });

  // Sync Backstage Events (full version with ticket classes)
  app.post('/api/functions/syncBackstageEvents', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const ZOHO_BACKSTAGE_PORTAL_ID = process.env.ZOHO_BACKSTAGE_PORTAL_ID || '20108049755';

    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: 'Missing access token' });
      }

      const baseUrl = 'https://www.zohoapis.eu/backstage/v3';
      const url = `${baseUrl}/portals/${ZOHO_BACKSTAGE_PORTAL_ID}/events?status=live`;

      console.log('Fetching events from:', url);

      const eventsResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`
        }
      });

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error('API error:', errorText);
        return res.status(eventsResponse.status).json({
          error: 'Failed to fetch events from Backstage',
          details: errorText,
          url: url,
          status: eventsResponse.status
        });
      }

      const eventsData = await eventsResponse.json();
      const events = eventsData.events || [];
      console.log('Found events:', events.length);

      if (events.length === 0) {
        return res.json({
          success: true,
          synced: 0,
          errors: 0,
          total: 0,
          message: 'No events found in response'
        });
      }

      let syncedCount = 0;
      let errorCount = 0;
      const errors: Array<{ eventId: string; error: string }> = [];

      // Get all existing events
      const { data: allExistingEvents } = await supabase
        .from('event')
        .select('*');

      console.log('Existing events in DB:', allExistingEvents?.length || 0);

      for (const event of events) {
        try {
          console.log('Processing event:', event.name, 'ID:', event.id);

          const programTag = event.tags && event.tags.length > 0 ? event.tags[0] : null;

          // Fetch ticket classes for this event
          const ticketClassesUrl = `${baseUrl}/portals/${ZOHO_BACKSTAGE_PORTAL_ID}/events/${event.id}/ticket_classes`;
          console.log('Fetching ticket classes from:', ticketClassesUrl);

          const ticketClassesResponse = await fetch(ticketClassesUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`
            }
          });

          let ticketTypeId = null;
          let ticketPrice = 0;
          let availableSeats = 0;

          if (ticketClassesResponse.ok) {
            const ticketClassesData = await ticketClassesResponse.json();
            const ticketClasses = ticketClassesData.ticket_classes || [];

            console.log(`Found ${ticketClasses.length} ticket classes for event ${event.name}`);

            // Find the "Member" ticket class (free, might be hidden)
            let memberTicket = ticketClasses.find((tc: any) =>
              tc.translation?.name?.toLowerCase() === 'member' ||
              tc.ticket_class_type_string === 'free'
            );

            // If no member ticket found, use the first ticket class
            if (!memberTicket && ticketClasses.length > 0) {
              memberTicket = ticketClasses[0];
              console.log('No "Member" ticket found, using first ticket class');
            }

            if (memberTicket) {
              ticketTypeId = memberTicket.id.toString();
              ticketPrice = parseFloat(memberTicket.amount || 0);
              availableSeats = parseInt((memberTicket.quantity || 0) - (memberTicket.sold || 0));

              console.log('Selected ticket class:', {
                id: ticketTypeId,
                name: memberTicket.translation?.name,
                price: ticketPrice,
                available: availableSeats,
                type: memberTicket.ticket_class_type_string
              });
            }
          } else {
            const error = await ticketClassesResponse.text();
            console.error('Failed to fetch ticket classes:', error);
          }

          const eventData = {
            title: event.name,
            description: event.description || '',
            program_tag: programTag,
            start_date: event.start_time,
            end_date: event.end_time,
            location: event.venue?.name || 'Online',
            ticket_price: ticketPrice,
            available_seats: availableSeats,
            backstage_event_id: event.id.toString(),
            backstage_ticket_type_id: ticketTypeId,
            image_url: event.banner_url || event.thumbnail_url || null,
            last_synced: new Date().toISOString()
          };

          console.log('Event data to save:', JSON.stringify(eventData, null, 2));

          const existingEvent = allExistingEvents?.find(
            (e: any) => e.backstage_event_id === eventData.backstage_event_id
          );

          if (existingEvent) {
            await supabase
              .from('event')
              .update(eventData)
              .eq('id', existingEvent.id);
            console.log('Updated event:', eventData.title);
          } else {
            await supabase
              .from('event')
              .insert(eventData);
            console.log('Created event:', eventData.title);
          }

          syncedCount++;
        } catch (error: any) {
          console.error(`Error syncing event ${event.id}:`, error);
          errors.push({ eventId: event.id, error: error.message });
          errorCount++;
        }
      }

      res.json({
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: events.length,
        errorDetails: errors.length > 0 ? errors : undefined
      });

    } catch (error: any) {
      console.error('Fatal sync error:', error);
      res.status(500).json({
        error: 'Failed to sync events',
        message: error.message
      });
    }
  });

  // Helper function to generate booking reference
  function generateBookingReference(): string {
    return 'BK-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Helper function to check existing Backstage registrations
  async function checkExistingBackstageRegistrations(
    accessToken: string,
    backstageEventId: string,
    attendeeEmails: string[]
  ): Promise<{ hasDuplicates: boolean; duplicateEmails: string[] }> {
    const portalId = process.env.ZOHO_BACKSTAGE_PORTAL_ID || '20108049755';
    const baseUrl = 'https://www.zohoapis.eu/backstage/v3';

    console.log(`[checkExistingBackstageRegistrations] Checking ${attendeeEmails.length} emails for event ${backstageEventId}`);

    try {
      const ordersUrl = `${baseUrl}/portals/${portalId}/events/${backstageEventId}/orders`;
      const ordersResponse = await fetch(ordersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`
        }
      });

      if (!ordersResponse.ok) {
        console.error('[checkExistingBackstageRegistrations] Failed to fetch orders:', ordersResponse.status);
        return { hasDuplicates: false, duplicateEmails: [] };
      }

      const ordersData = await ordersResponse.json();
      const orders = ordersData.orders || [];

      console.log(`[checkExistingBackstageRegistrations] Found ${orders.length} existing orders`);

      const registeredEmails = new Set<string>();

      for (const order of orders) {
        const tickets = order.tickets || [];

        if (Array.isArray(tickets)) {
          for (const ticket of tickets) {
            const ticketStatus = ticket.status_string || '';

            if (ticketStatus === 'cancelled' || ticketStatus === 'refunded') {
              continue;
            }

            if (ticket.contact?.email) {
              registeredEmails.add(ticket.contact.email.toLowerCase());
            }
          }
        }
      }

      const duplicateEmails: string[] = [];
      for (const email of attendeeEmails) {
        if (registeredEmails.has(email.toLowerCase())) {
          duplicateEmails.push(email);
        }
      }

      if (duplicateEmails.length > 0) {
        return { hasDuplicates: true, duplicateEmails };
      }

      return { hasDuplicates: false, duplicateEmails: [] };

    } catch (error) {
      console.error('[checkExistingBackstageRegistrations] Error:', error);
      return { hasDuplicates: false, duplicateEmails: [] };
    }
  }

  // Create Booking
  app.post('/api/functions/createBooking', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const portalId = process.env.ZOHO_BACKSTAGE_PORTAL_ID || '20108049755';
    const baseUrl = 'https://www.zohoapis.eu/backstage/v3';

    try {
      const {
        eventId,
        memberEmail,
        attendees,
        registrationMode,
        numberOfLinks = 0,
        ticketsRequired,
        programTag
      } = req.body;

      if (!eventId || !memberEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: eventId and memberEmail'
        });
      }

      if (registrationMode === 'colleagues' && (!attendees || attendees.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'No attendees provided for colleagues registration'
        });
      }

      if (registrationMode === 'links' && numberOfLinks < 1) {
        return res.status(400).json({
          success: false,
          error: 'Number of links must be at least 1'
        });
      }

      if (registrationMode === 'self' && (!attendees || attendees.length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'No attendee information provided for self registration'
        });
      }

      // Get member details
      const { data: allMembers } = await supabase.from('member').select('*');
      const member = allMembers?.find((m: any) => m.email === memberEmail);

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Member not found'
        });
      }

      // Get event details
      const { data: allEvents } = await supabase.from('event').select('*');
      const event = allEvents?.find((e: any) => e.id === eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Check if event requires program tickets
      if (!programTag || !event.program_tag) {
        return res.status(400).json({
          success: false,
          error: 'This event does not have a program association and cannot be booked'
        });
      }

      // Get organization and verify program ticket balance
      if (!member.organization_id) {
        return res.status(400).json({
          success: false,
          error: 'Member does not have an associated organization'
        });
      }

      const { data: allOrgs } = await supabase.from('organization').select('*');
      let org = allOrgs?.find((o: any) => o.id === member.organization_id);

      if (!org) {
        org = allOrgs?.find((o: any) => o.zoho_account_id === member.organization_id);
      }

      if (!org) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Check program ticket balance
      const currentBalances = org.program_ticket_balances || {};
      const currentBalance = currentBalances[programTag] || 0;

      if (currentBalance < ticketsRequired) {
        return res.status(400).json({
          success: false,
          error: `Insufficient program tickets. Required: ${ticketsRequired}, Available: ${currentBalance}`
        });
      }

      // Check for duplicate registrations in Backstage
      if ((registrationMode === 'self' || registrationMode === 'colleagues') && event.backstage_event_id && attendees) {
        console.log('[createBooking] Checking for duplicate registrations in Backstage...');

        const accessToken = await getValidZohoAccessToken();
        const attendeeEmails = attendees.map((a: any) => a.email).filter(Boolean);

        const duplicateCheck = await checkExistingBackstageRegistrations(
          accessToken,
          event.backstage_event_id,
          attendeeEmails
        );

        if (duplicateCheck.hasDuplicates) {
          const emailList = duplicateCheck.duplicateEmails.join(', ');
          return res.status(409).json({
            success: false,
            error: `The following email address(es) are already registered for this event: ${emailList}. Please remove them and try again.`,
            duplicateEmails: duplicateCheck.duplicateEmails
          });
        }
      }

      // Create bookings
      const bookingReference = generateBookingReference();
      const createdBookings: any[] = [];
      let anyBackstageSyncFailed = false;
      const backstageSyncErrors: string[] = [];
      const individualBackstageOrderDetails: Array<{
        attendeeEmail: string;
        backstageOrderId?: string;
        success: boolean;
        error?: string;
      }> = [];

      // For self/colleagues mode, provision tickets in Backstage
      if ((registrationMode === 'self' || registrationMode === 'colleagues') && event.backstage_event_id) {
        try {
          console.log('[createBooking] Attempting to provision tickets in Backstage...');
          const accessToken = await getValidZohoAccessToken();

          // Fetch ticket classes
          const ticketClassesUrl = `${baseUrl}/portals/${portalId}/events/${event.backstage_event_id}/ticket_classes`;
          const ticketClassesResponse = await fetch(ticketClassesUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`
            }
          });

          if (!ticketClassesResponse.ok) {
            const errorText = await ticketClassesResponse.text();
            console.error('[createBooking] Failed to fetch ticket classes:', errorText);
            anyBackstageSyncFailed = true;
            backstageSyncErrors.push(`Failed to fetch ticket classes: ${errorText}`);
            throw new Error(`Failed to fetch ticket classes: ${errorText}`);
          }

          const ticketClassesData = await ticketClassesResponse.json();
          const ticketClasses = ticketClassesData.ticket_classes || [];

          // Find member ticket class
          let memberTicket = ticketClasses.find((tc: any) =>
            tc.ticket_class_type_string === 'free' &&
            tc.translation?.name?.toLowerCase() === 'member'
          );

          if (!memberTicket) {
            memberTicket = ticketClasses.find((tc: any) => tc.ticket_class_type_string === 'free');
          }

          if (!memberTicket && ticketClasses.length > 0) {
            memberTicket = ticketClasses[0];
          }

          if (!memberTicket) {
            anyBackstageSyncFailed = true;
            backstageSyncErrors.push('No ticket classes available for this event');
            throw new Error('No ticket classes available for this event');
          }

          const ticketClassId = memberTicket.id.toString();

          // Create order for each attendee
          const backstageApiUrl = `${baseUrl}/portals/${portalId}/events/${event.backstage_event_id}/orders`;

          for (const attendee of attendees) {
            const buyerDetails: any = {};
            if (member.first_name) buyerDetails.purchaser_first_name = member.first_name;
            if (member.last_name) buyerDetails.purchaser_last_name = member.last_name;
            if (member.email) buyerDetails.purchaser_email = member.email;
            if (org.name) buyerDetails.purchaser_company = org.name;

            const singleOrderPayload = {
              buyer_details: buyerDetails,
              tickets: [{
                ticketclass_id: ticketClassId,
                data: {
                  first_name: attendee.first_name,
                  last_name: attendee.last_name,
                  email: attendee.email
                }
              }]
            };

            try {
              const individualBackstageResponse = await fetch(backstageApiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Zoho-oauthtoken ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(singleOrderPayload)
              });

              if (individualBackstageResponse.ok) {
                const backstageData = await individualBackstageResponse.json();
                const individualBackstageOrderId = backstageData.order?.id || backstageData.id;
                individualBackstageOrderDetails.push({
                  attendeeEmail: attendee.email,
                  backstageOrderId: individualBackstageOrderId,
                  success: true
                });
                console.log(`[createBooking] ✓ Backstage order created for ${attendee.email}: ${individualBackstageOrderId}`);
              } else {
                const errorText = await individualBackstageResponse.text();
                console.error(`[createBooking] ✗ Backstage API error for ${attendee.email}: ${errorText}`);
                anyBackstageSyncFailed = true;
                backstageSyncErrors.push(`Backstage API Error for ${attendee.email}: ${errorText}`);
                individualBackstageOrderDetails.push({
                  attendeeEmail: attendee.email,
                  success: false,
                  error: `API Error: ${errorText}`
                });
              }
            } catch (individualError: any) {
              console.error(`[createBooking] ✗ Backstage failed for ${attendee.email}:`, individualError);
              anyBackstageSyncFailed = true;
              backstageSyncErrors.push(`Backstage Failed for ${attendee.email}: ${individualError.message}`);
              individualBackstageOrderDetails.push({
                attendeeEmail: attendee.email,
                success: false,
                error: individualError.message
              });
            }
          }

        } catch (backstageError: any) {
          console.error('[createBooking] ✗ Backstage provisioning failed:', backstageError);
          anyBackstageSyncFailed = true;
          backstageSyncErrors.push(`Backstage Provisioning Error: ${backstageError.message}`);
        }
      } else if ((registrationMode === 'self' || registrationMode === 'colleagues') && !event.backstage_event_id) {
        console.warn('[createBooking] Backstage provisioning skipped: Missing backstage_event_id');
        anyBackstageSyncFailed = true;
        backstageSyncErrors.push('Backstage provisioning skipped due to missing event configuration.');
      }

      // Create booking records
      if (registrationMode === 'self' || registrationMode === 'colleagues') {
        for (const attendee of attendees) {
          const correspondingOrder = individualBackstageOrderDetails.find(d => d.attendeeEmail === attendee.email);

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
              status: correspondingOrder?.success ? 'confirmed' : 'pending_backstage_sync',
              payment_method: 'program_ticket',
              backstage_order_id: correspondingOrder?.backstageOrderId || null
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

      // Deduct program tickets from organization balance
      const newBalance = currentBalance - ticketsRequired;
      const updatedBalances = {
        ...currentBalances,
        [programTag]: newBalance
      };

      await supabase
        .from('organization')
        .update({
          program_ticket_balances: updatedBalances,
          last_synced: new Date().toISOString()
        })
        .eq('id', org.id);

      // Create program ticket transaction record
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
          notes: `Used ${ticketsRequired} ${programTag} ticket${ticketsRequired > 1 ? 's' : ''} for ${event.title || 'event'}${registrationMode === 'links' ? ' (link generation)' : registrationMode === 'self' ? ' (self registration)' : ''}${anyBackstageSyncFailed ? ' - Backstage sync failed for some tickets' : ''}`
        });

      const response: any = {
        success: true,
        booking_reference: bookingReference,
        bookings: createdBookings,
        tickets_used: ticketsRequired,
        remaining_balance: newBalance
      };

      if (anyBackstageSyncFailed) {
        response.warning = 'Some bookings created successfully, but Backstage provisioning failed for one or more tickets. An admin may need to manually sync these.';
        response.backstage_sync_errors = backstageSyncErrors;
      }

      res.json(response);

    } catch (error: any) {
      console.error('Booking error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Validate Colleague (check if email belongs to same organization)
  app.post('/api/functions/validateColleague', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';

    try {
      const { email, memberEmail, organizationId } = req.body;

      if (!email || !organizationId) {
        return res.status(400).json({
          valid: false,
          error: 'Missing required parameters'
        });
      }

      const accessToken = await getValidZohoAccessToken();

      // Search for the colleague's contact in CRM
      const criteria = `(Email:equals:${email})`;
      const searchUrl = `${ZOHO_CRM_API_DOMAIN}/crm/v3/Contacts/search?criteria=${encodeURIComponent(criteria)}`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
      });

      // Check if response has content before parsing
      let searchData: { data?: any[] } = { data: [] };
      const responseText = await searchResponse.text();

      if (responseText && responseText.trim() !== '') {
        try {
          searchData = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse search response:', responseText);
          searchData = { data: [] };
        }
      }

      // If contact found, validate organization
      if (searchResponse.ok && searchData.data && searchData.data.length > 0) {
        const contact = searchData.data[0];

        // Check if the contact belongs to the same organization
        if (!contact.Account_Name?.id || contact.Account_Name.id !== organizationId) {
          return res.json({
            valid: false,
            status: 'wrong_organization',
            error: 'A ticket will be sent shortly. This email address cannot be verified, AGCAS will be in touch.'
          });
        }

        // Valid colleague - return their details
        return res.json({
          valid: true,
          status: 'registered',
          first_name: contact.First_Name,
          last_name: contact.Last_Name,
          zoho_contact_id: contact.id
        });
      }

      // Contact not found - check domain matching
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (!emailDomain) {
        return res.json({
          valid: false,
          status: 'invalid_email',
          error: 'Invalid email format'
        });
      }

      // Fetch organization details from CRM
      const orgResponse = await fetch(
        `${ZOHO_CRM_API_DOMAIN}/crm/v3/Accounts/${organizationId}`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      if (!orgResponse.ok) {
        return res.json({
          valid: true,
          status: 'external',
          message: 'External email address. AGCAS may reach out to validate eligibility.'
        });
      }

      const orgData = await orgResponse.json();
      const org = orgData.data[0];

      // Check primary domain
      const primaryDomain = org.Domain?.toLowerCase();
      if (primaryDomain && emailDomain === primaryDomain) {
        return res.json({
          valid: true,
          status: 'unregistered_domain_match',
          message: 'A ticket and member welcome will be sent shortly.'
        });
      }

      // Check additional verified domains - safely handle non-array values
      let additionalDomains = org.Additional_verified_domains;

      // Ensure additionalDomains is always an array
      if (!Array.isArray(additionalDomains)) {
        if (additionalDomains === null || additionalDomains === undefined) {
          additionalDomains = [];
        } else if (typeof additionalDomains === 'string') {
          // If it's a string, try to split by comma or newline
          additionalDomains = additionalDomains
            .split(/[,\n]/)
            .map((d: string) => d.trim())
            .filter((d: string) => d.length > 0);
        } else {
          console.warn('Unexpected type for Additional_verified_domains:', typeof additionalDomains);
          additionalDomains = [];
        }
      }

      const domainMatches = additionalDomains.some(
        (domain: string) => domain.toLowerCase() === emailDomain
      );

      if (domainMatches) {
        return res.json({
          valid: true,
          status: 'unregistered_domain_match',
          message: 'A ticket and member welcome will be sent shortly.'
        });
      }

      // Domain doesn't match - external email
      res.json({
        valid: true,
        status: 'external',
        message: 'A ticket will be sent shortly. This email address cannot be verified, AGCAS will be in touch.'
      });

    } catch (error: any) {
      console.error('Validation error:', error);
      res.status(500).json({
        valid: false,
        status: 'error',
        error: error.message
      });
    }
  });

  // Process Program Ticket Purchase
  app.post('/api/functions/processProgramTicketPurchase', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    let stripe: any = null;
    if (stripeSecretKey) {
      const Stripe = require('stripe');
      stripe = new Stripe(stripeSecretKey);
    }

    try {
      const {
        memberEmail,
        programName,
        quantity,
        purchaseOrderNumber,
        selectedVoucherIds = [],
        trainingFundAmount = 0,
        accountAmount = 0,
        paymentMethod = 'account',
        stripePaymentIntentId = null,
        appliedDiscountId = null
      } = req.body;

      if (!memberEmail || !programName || !quantity) {
        return res.status(400).json({
          error: 'Missing required parameters',
          required: ['memberEmail', 'programName', 'quantity']
        });
      }

      if (quantity < 1 || quantity > 1000) {
        return res.status(400).json({
          error: 'Quantity must be between 1 and 1000'
        });
      }

      // Verify Stripe payment if card payment method
      if (paymentMethod === 'card' && stripePaymentIntentId && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

          if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
              error: 'Payment not completed',
              details: `Payment status: ${paymentIntent.status}`
            });
          }

          console.log('[processProgramTicketPurchase] Stripe payment verified:', paymentIntent.id);
        } catch (stripeError: any) {
          console.error('[processProgramTicketPurchase] Stripe verification failed:', stripeError);
          return res.status(400).json({
            error: 'Failed to verify payment',
            details: stripeError.message
          });
        }
      }

      // Verify that the program exists and is active
      const { data: allPrograms } = await supabase.from('program').select('*');
      const program = allPrograms?.find((p: any) => p.program_tag === programName && p.is_active);

      if (!program) {
        return res.status(404).json({
          error: 'Program not found or not active',
          programName: programName
        });
      }

      // Get member's organization
      const { data: allMembers } = await supabase.from('member').select('*');
      const member = allMembers?.find((m: any) => m.email === memberEmail);

      if (!member || !member.organization_id) {
        return res.status(404).json({
          error: 'Member or organization not found'
        });
      }

      // Get organization
      const { data: allOrgs } = await supabase.from('organization').select('*');
      let org = allOrgs?.find((o: any) => o.id === member.organization_id);

      if (!org) {
        org = allOrgs?.find((o: any) => o.zoho_account_id === member.organization_id);
      }

      if (!org) {
        return res.status(404).json({
          error: 'Organization not found'
        });
      }

      // Calculate cost and tickets based on offer type
      let totalCost: number;
      let totalTicketsReceived: number;
      let discountApplied = false;
      let discountDetails = '';
      let costBeforeDiscountCodeApplication: number;
      let discountAmount = 0;
      let discountCode: any = null;

      // Determine effective offer type
      const offerType = program.offer_type || 'none';
      let effectiveOfferType = offerType;
      if (offerType === 'none') {
        if (program.bogo_buy_quantity && program.bogo_get_free_quantity) {
          effectiveOfferType = 'bogo';
        } else if (program.bulk_discount_threshold && program.bulk_discount_percentage) {
          effectiveOfferType = 'bulk_discount';
        }
      }

      // Calculate cost and total tickets based on offer type
      if (effectiveOfferType === 'bogo') {
        const bogoLogicType = program.bogo_logic_type || 'buy_x_get_y_free';

        if (bogoLogicType === 'buy_x_get_y_free') {
          if (program.bogo_buy_quantity && program.bogo_get_free_quantity &&
              quantity >= program.bogo_buy_quantity) {
            const bogoBlocks = Math.floor(quantity / program.bogo_buy_quantity);
            const freeTickets = bogoBlocks * program.bogo_get_free_quantity;

            totalTicketsReceived = quantity + freeTickets;
            totalCost = program.program_ticket_price * quantity;

            discountApplied = true;
            discountDetails = `Buy ${program.bogo_buy_quantity}, Get ${program.bogo_get_free_quantity} Free - ${freeTickets} free ticket${freeTickets > 1 ? 's' : ''} received`;
          } else {
            totalTicketsReceived = quantity;
            totalCost = program.program_ticket_price * quantity;
          }
        } else {
          totalTicketsReceived = quantity;

          if (program.bogo_buy_quantity && program.bogo_get_free_quantity &&
              quantity >= (program.bogo_buy_quantity + program.bogo_get_free_quantity)) {
            const bogoSetSize = program.bogo_buy_quantity + program.bogo_get_free_quantity;
            const completeBlocks = Math.floor(quantity / bogoSetSize);
            const remainingTickets = quantity % bogoSetSize;
            const freeTickets = completeBlocks * program.bogo_get_free_quantity;

            const ticketsToPay = (completeBlocks * program.bogo_buy_quantity) + remainingTickets;
            totalCost = program.program_ticket_price * ticketsToPay;

            discountApplied = true;
            discountDetails = `BOGO offer applied - ${freeTickets} free ticket${freeTickets > 1 ? 's' : ''} included`;
          } else {
            totalCost = program.program_ticket_price * quantity;
          }
        }
      } else if (effectiveOfferType === 'bulk_discount') {
        totalTicketsReceived = quantity;
        totalCost = program.program_ticket_price * quantity;

        if (program.bulk_discount_threshold && program.bulk_discount_percentage &&
            quantity >= program.bulk_discount_threshold) {
          const bulkDiscountValue = totalCost * (program.bulk_discount_percentage / 100);
          totalCost = totalCost - bulkDiscountValue;
          discountApplied = true;
          discountDetails = `${program.bulk_discount_percentage}% bulk discount`;
        }
      } else {
        totalTicketsReceived = quantity;
        totalCost = program.program_ticket_price * quantity;
      }

      costBeforeDiscountCodeApplication = totalCost;

      // Apply discount code if provided
      if (appliedDiscountId) {
        const { data: allDiscountCodes } = await supabase.from('discount_code').select('*');
        discountCode = allDiscountCodes?.find((dc: any) => dc.id === appliedDiscountId);

        if (discountCode && discountCode.is_active) {
          if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Discount code has expired' });
          }

          if (discountCode.program_tag && discountCode.program_tag !== programName) {
            return res.status(400).json({ error: 'Discount code is not valid for this program' });
          }

          // Validate usage count
          if (discountCode.max_usage_count) {
            let currentUsage = 0;

            if (discountCode.organization_id) {
              const { data: usageRecords } = await supabase
                .from('discount_code_usage')
                .select('*')
                .eq('discount_code_id', discountCode.id)
                .eq('organization_id', org.id);

              if (usageRecords && usageRecords.length > 0) {
                currentUsage = usageRecords[0].usage_count || 0;
              }
            } else {
              currentUsage = discountCode.current_usage_count || 0;
            }

            if (currentUsage >= discountCode.max_usage_count) {
              return res.status(400).json({ error: 'Discount code has reached its maximum usage' });
            }
          }

          // Calculate discount
          if (discountCode.type === 'percentage') {
            discountAmount = totalCost * (discountCode.value / 100);
          } else if (discountCode.type === 'fixed') {
            discountAmount = discountCode.value;
          }

          discountAmount = Math.min(discountAmount, totalCost);
          totalCost = totalCost - discountAmount;

          // Increment usage count
          if (discountCode.organization_id) {
            const { data: usageRecords } = await supabase
              .from('discount_code_usage')
              .select('*')
              .eq('discount_code_id', discountCode.id)
              .eq('organization_id', org.id);

            if (usageRecords && usageRecords.length > 0) {
              await supabase
                .from('discount_code_usage')
                .update({ usage_count: (usageRecords[0].usage_count || 0) + 1 })
                .eq('id', usageRecords[0].id);
            } else {
              await supabase.from('discount_code_usage').insert({
                discount_code_id: discountCode.id,
                organization_id: org.id,
                usage_count: 1
              });
            }
          } else {
            await supabase
              .from('discount_code')
              .update({ current_usage_count: (discountCode.current_usage_count || 0) + 1 })
              .eq('id', discountCode.id);
          }

          console.log(`[processProgramTicketPurchase] Applied discount code ${discountCode.code}: £${discountAmount.toFixed(2)} off`);
        } else {
          return res.status(400).json({ error: 'Invalid or inactive discount code provided.' });
        }
      }

      // Process vouchers
      let voucherAmountUsed = 0;
      const voucherUsageDetails: any[] = [];
      let remainingCost = totalCost;

      if (selectedVoucherIds.length > 0) {
        const { data: allVouchers } = await supabase.from('voucher').select('*');
        const selectedVouchersData = selectedVoucherIds
          .map((voucherId: string) => allVouchers?.find((v: any) => v.id === voucherId))
          .filter((v: any) => v !== undefined)
          .sort((a: any, b: any) => {
            const expiryA = new Date(a.expires_at).getTime();
            const expiryB = new Date(b.expires_at).getTime();
            if (expiryA !== expiryB) return expiryA - expiryB;
            return a.value - b.value;
          });

        for (const voucher of selectedVouchersData) {
          if (voucher.organization_id !== org.id) {
            return res.status(403).json({ error: `Voucher ${voucher.code} does not belong to your organization` });
          }

          if (voucher.status !== 'active') {
            return res.status(400).json({ error: `Voucher ${voucher.code} is not active` });
          }

          if (new Date(voucher.expires_at) < new Date()) {
            return res.status(400).json({ error: `Voucher ${voucher.code} has expired` });
          }

          if (remainingCost <= 0) break;

          const amountToUse = Math.min(voucher.value, remainingCost);
          voucherAmountUsed += amountToUse;
          remainingCost -= amountToUse;

          if (amountToUse >= voucher.value) {
            await supabase.from('voucher').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', voucher.id);
            voucherUsageDetails.push({ code: voucher.code, voucherId: voucher.id, amountUsed: amountToUse, fullyUsed: true });
          } else {
            const newValue = voucher.value - amountToUse;
            await supabase.from('voucher').update({ value: newValue }).eq('id', voucher.id);
            voucherUsageDetails.push({ code: voucher.code, voucherId: voucher.id, amountUsed: amountToUse, fullyUsed: false, remainingValue: newValue });
          }
        }
      }

      // Verify payment allocation
      const remainingAfterInternalFunds = totalCost - voucherAmountUsed - trainingFundAmount;
      const cardAmount = paymentMethod === 'card' ? remainingAfterInternalFunds : 0;
      const totalAllocated = voucherAmountUsed + trainingFundAmount + accountAmount + cardAmount;

      if (Math.abs(totalAllocated - totalCost) > 0.01) {
        return res.status(400).json({
          error: 'Payment allocation does not match total cost',
          totalCost: parseFloat(totalCost.toFixed(2)),
          totalAllocated: parseFloat(totalAllocated.toFixed(2))
        });
      }

      // Verify sufficient balances
      if (trainingFundAmount > (org.training_fund_balance || 0)) {
        return res.status(400).json({
          error: 'Insufficient training fund balance',
          available: org.training_fund_balance || 0,
          requested: trainingFundAmount
        });
      }

      if (accountAmount > 0 && paymentMethod === 'account' && !purchaseOrderNumber) {
        return res.status(400).json({ error: 'Purchase order number required for account charges' });
      }

      // Update organization balances
      const currentProgramBalances = org.program_ticket_balances || {};
      const currentProgramBalance = currentProgramBalances[programName] || 0;
      const newProgramBalance = currentProgramBalance + totalTicketsReceived;

      const updatedProgramBalances = { ...currentProgramBalances, [programName]: newProgramBalance };

      const updateData: any = {
        program_ticket_balances: updatedProgramBalances,
        last_synced: new Date().toISOString()
      };

      if (trainingFundAmount > 0) {
        updateData.training_fund_balance = (org.training_fund_balance || 0) - trainingFundAmount;
      }

      await supabase.from('organization').update(updateData).eq('id', org.id);

      // Build transaction notes
      const paymentMethods = [];
      if (voucherAmountUsed > 0) {
        const voucherSummary = voucherUsageDetails.map((v: any) =>
          `${v.code} (£${v.amountUsed.toFixed(2)}${v.fullyUsed ? ' - fully used' : ` - £${v.remainingValue?.toFixed(2)} remaining`})`
        ).join(', ');
        paymentMethods.push(`Vouchers: ${voucherSummary}`);
      }
      if (trainingFundAmount > 0) paymentMethods.push(`Training Fund: £${trainingFundAmount.toFixed(2)}`);
      if (accountAmount > 0) paymentMethods.push(`Account: £${accountAmount.toFixed(2)}`);
      if (cardAmount > 0) paymentMethods.push(`Card: £${cardAmount.toFixed(2)}${stripePaymentIntentId ? ` (Stripe: ${stripePaymentIntentId})` : ''}`);

      let transactionNotes = `Purchased ${quantity} ticket${quantity > 1 ? 's' : ''} for ${program.name}`;
      if (discountApplied) transactionNotes += ` (${discountDetails})`;
      transactionNotes += `. Total tickets received: ${totalTicketsReceived}.`;
      if (discountCode) transactionNotes += ` Discount code ${discountCode.code} applied: £${discountAmount.toFixed(2)} off.`;
      transactionNotes += ` Payment: ${paymentMethods.join(', ')}`;

      const transactionData: any = {
        organization_id: org.id,
        program_name: programName,
        transaction_type: 'purchase',
        quantity: totalTicketsReceived,
        original_quantity: totalTicketsReceived,
        cancelled_quantity: 0,
        status: 'active',
        purchase_order_number: purchaseOrderNumber || null,
        member_email: memberEmail,
        notes: transactionNotes,
        discount_code_id: discountCode?.id || null,
        discount_amount_applied: discountAmount > 0 ? discountAmount : null,
        total_cost_before_discount: costBeforeDiscountCodeApplication
      };

      // Create transaction record
      const { data: transaction } = await supabase.from('program_ticket_transaction').insert(transactionData).select().single();

      // Update transaction reference in fully used vouchers
      for (const usage of voucherUsageDetails) {
        if (usage.fullyUsed) {
          await supabase.from('voucher').update({ used_for_transaction_id: transaction?.id }).eq('id', usage.voucherId);
        }
      }

      res.json({
        success: true,
        message: `Successfully added ${totalTicketsReceived} ${program.name} ticket${totalTicketsReceived > 1 ? 's' : ''} to ${org.name}`,
        balances: updatedProgramBalances,
        purchase_order_number: purchaseOrderNumber,
        quantity_purchased: quantity,
        total_tickets_received: totalTicketsReceived,
        free_tickets: totalTicketsReceived - quantity,
        total_cost: totalCost,
        discount_applied: discountAmount > 0,
        discount_amount: discountAmount,
        discount_code: discountCode?.code || null,
        discount_details: discountDetails,
        payment_breakdown: {
          vouchers: voucherAmountUsed,
          voucher_usage_details: voucherUsageDetails,
          training_fund: trainingFundAmount,
          account: accountAmount,
          card: cardAmount,
          payment_method: paymentMethod,
          stripe_payment_intent_id: stripePaymentIntentId
        },
        xero_invoice: null,
        is_simulated_payment: false
      });

    } catch (error: any) {
      console.error('Purchase Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process purchase',
        message: error.message
      });
    }
  });

  // Helper function to generate magic link token
  function generateMagicLinkToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Helper function to send email via Mailgun
  async function sendEmailViaMailgun(to: string, subject: string, body: string): Promise<any> {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
    const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL) {
      throw new Error('Mailgun not configured');
    }

    const apiBase = 'https://api.eu.mailgun.net/v3';
    const formData = new URLSearchParams();
    formData.append('from', `AGCAS Events <${MAILGUN_FROM_EMAIL}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', body);

    const url = `${apiBase}/${MAILGUN_DOMAIN}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Mailgun API error (${response.status}): ${responseText}`);
    }

    return JSON.parse(responseText);
  }

  // Send Magic Link
  app.post('/api/functions/sendMagicLink', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      console.log('[sendMagicLink] Processing magic link request for:', email);

      // Validate user - check both TeamMember and Member tables
      const { data: teamMembers } = await supabase
        .from('team_member')
        .select('*')
        .eq('email', email);

      const { data: members } = await supabase
        .from('member')
        .select('*')
        .eq('email', email);

      const teamMember = teamMembers?.[0];
      const member = members?.[0];

      // Check if user exists and has login enabled
      let isValid = false;
      let userType = '';

      if (teamMember) {
        isValid = true;
        userType = 'team_member';
      } else if (member && member.login_enabled !== false) {
        isValid = true;
        userType = 'member';
      }

      if (!isValid) {
        return res.status(404).json({
          success: false,
          error: 'User not found or login not enabled'
        });
      }

      console.log('[sendMagicLink] User validated successfully:', userType);

      // Generate magic link token
      const token = generateMagicLinkToken();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // Clean up old/expired magic links for this email
      await supabase
        .from('magic_link')
        .delete()
        .eq('email', email);

      // Create new magic link
      await supabase.from('magic_link').insert({
        email,
        token,
        expires_at: expiresAt,
        used: false
      });

      console.log('[sendMagicLink] Magic link created in database');

      // Generate the magic link URL
      const baseUrl = process.env.MAGIC_LINK_BASE_URL || 'https://agcas.isaasi.co.uk';
      const magicLinkUrl = `${baseUrl}/VerifyMagicLink?token=${token}`;

      // Send email with magic link via Mailgun
      await sendEmailViaMailgun(
        email,
        'Your AGCAS Events Login Link',
        `
Hello,

Click the link below to access the AGCAS Events portal:

${magicLinkUrl}

This link will expire in 30 minutes.

If you didn't request this login link, please ignore this email.

Best regards,
AGCAS Events Team
        `.trim()
      );

      console.log('[sendMagicLink] Email sent successfully via Mailgun');

      res.json({
        success: true,
        message: 'Magic link sent to your email'
      });

    } catch (error: any) {
      console.error('[sendMagicLink] error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send magic link',
        details: error.message
      });
    }
  });

  // Verify Magic Link
  app.post('/api/functions/verifyMagicLink', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const { token } = req.body;

      console.log('[verifyMagicLink] Token received:', token ? 'yes' : 'no');

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Find the magic link
      const { data: allLinks } = await supabase.from('magic_link').select('*');
      const magicLink = allLinks?.find((link: any) => link.token === token);

      if (!magicLink) {
        console.log('[verifyMagicLink] Token not found in database');
        return res.status(404).json({
          success: false,
          error: 'Invalid or expired link'
        });
      }

      // Check if already used
      if (magicLink.used) {
        console.log('[verifyMagicLink] Token already used');
        return res.status(400).json({
          success: false,
          error: 'This link has already been used'
        });
      }

      // Check if expired
      if (new Date(magicLink.expires_at) < new Date()) {
        console.log('[verifyMagicLink] Token expired');
        return res.status(400).json({
          success: false,
          error: 'This link has expired'
        });
      }

      // Mark as used
      await supabase
        .from('magic_link')
        .update({ used: true })
        .eq('id', magicLink.id);

      console.log('[verifyMagicLink] Validating user for:', magicLink.email);

      // Validate user and get their data
      const { data: teamMembers } = await supabase
        .from('team_member')
        .select('*')
        .eq('email', magicLink.email);

      const { data: members } = await supabase
        .from('member')
        .select('*')
        .eq('email', magicLink.email);

      const teamMember = teamMembers?.[0];
      const member = members?.[0];

      let user: any = null;

      if (teamMember) {
        user = {
          email: teamMember.email,
          first_name: teamMember.first_name,
          last_name: teamMember.last_name,
          is_team_member: true,
          role: teamMember.role
        };
      } else if (member && member.login_enabled !== false) {
        // Get organization details
        const { data: orgs } = await supabase
          .from('organization')
          .select('*')
          .eq('id', member.organization_id);

        const org = orgs?.[0];

        user = {
          email: member.email,
          first_name: member.first_name,
          last_name: member.last_name,
          is_team_member: false,
          organization_id: member.organization_id,
          organization_name: org?.name || null,
          zoho_contact_id: member.zoho_contact_id,
          member_id: member.id
        };

        // Update last_login
        try {
          await supabase
            .from('member')
            .update({ last_login: new Date().toISOString() })
            .eq('id', member.id);
        } catch (updateError: any) {
          console.warn('[verifyMagicLink] Failed to update last_login:', updateError.message);
        }
      }

      if (!user) {
        return res.status(403).json({
          success: false,
          error: 'User not found or login not enabled'
        });
      }

      console.log('[verifyMagicLink] User validated successfully');

      res.json({
        success: true,
        user
      });

    } catch (error: any) {
      console.error('[verifyMagicLink] error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify link',
        details: error.message
      });
    }
  });

  // Sync Organization Contacts from Zoho CRM
  app.post('/api/functions/syncOrganizationContacts', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';

    try {
      const { organizationId } = req.body;

      console.log('=== Sync Organization Contacts Started ===');
      console.log('Organization ID:', organizationId);

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required'
        });
      }

      // Get the organization - try by ID first, then by Zoho Account ID
      const { data: allOrgs } = await supabase.from('organization').select('*');
      let org = allOrgs?.find((o: any) => o.id === organizationId);

      if (!org) {
        console.log('Not found by ID, trying Zoho Account ID...');
        org = allOrgs?.find((o: any) => o.zoho_account_id === organizationId);
      }

      console.log('Organization found:', org ? org.name : 'NOT FOUND');

      if (!org || !org.zoho_account_id) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found or not linked to Zoho',
          details: {
            organizationFound: !!org,
            zohoAccountId: org?.zoho_account_id
          }
        });
      }

      const accessToken = await getValidZohoAccessToken();
      console.log('Access token obtained');

      // Fetch all contacts for this organization from Zoho CRM
      let allContacts: any[] = [];
      let page = 1;
      const perPage = 200;
      let hasMore = true;

      console.log('Searching for contacts with Account Name:', org.name);

      while (hasMore) {
        const criteria = `(Account_Name:equals:${org.name})`;
        const searchUrl = `${ZOHO_CRM_API_DOMAIN}/crm/v3/Contacts/search?criteria=${encodeURIComponent(criteria)}&page=${page}&per_page=${perPage}`;

        console.log(`Fetching page ${page}...`);

        const response = await fetch(searchUrl, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);

        if (!response.ok) {
          console.error('Failed to fetch contacts from Zoho:', responseText);
          break;
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON response');
          break;
        }

        console.log('Contacts in this page:', data.data?.length || 0);

        if (data.data && data.data.length > 0) {
          allContacts = allContacts.concat(data.data);

          if (data.info && data.info.more_records) {
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log('Total contacts fetched from Zoho:', allContacts.length);

      if (allContacts.length === 0) {
        console.log('No contacts found for this organization');
        await supabase
          .from('organization')
          .update({ contacts_synced_at: new Date().toISOString() })
          .eq('id', org.id);

        return res.json({
          success: true,
          synced_count: 0,
          created: 0,
          updated: 0,
          deactivated: 0,
          message: 'No contacts found for this organization'
        });
      }

      // Get existing contacts for this organization
      const { data: existingContacts } = await supabase
        .from('organization_contact')
        .select('*')
        .eq('organization_id', org.id);

      console.log('Existing contacts in database:', existingContacts?.length || 0);

      const existingByZohoId: Record<string, any> = {};
      (existingContacts || []).forEach((contact: any) => {
        existingByZohoId[contact.zoho_contact_id] = contact;
      });

      // Prepare contacts to create or update
      const contactsToCreate: any[] = [];
      const contactsToUpdate: any[] = [];
      const zohoIdsFound = new Set<string>();

      for (const zohoContact of allContacts) {
        zohoIdsFound.add(zohoContact.id);

        if (!zohoContact.Email) {
          console.log(`Skipping Zoho contact ID ${zohoContact.id} because it has no email.`);
          continue;
        }

        const contactData = {
          organization_id: org.id,
          zoho_contact_id: zohoContact.id,
          email: zohoContact.Email,
          first_name: zohoContact.First_Name || '',
          last_name: zohoContact.Last_Name || '',
          is_active: true,
          last_synced: new Date().toISOString()
        };

        if (existingByZohoId[zohoContact.id]) {
          contactsToUpdate.push({
            id: existingByZohoId[zohoContact.id].id,
            ...contactData
          });
        } else {
          contactsToCreate.push(contactData);
        }
      }

      console.log('Contacts to create:', contactsToCreate.length);
      console.log('Contacts to update:', contactsToUpdate.length);

      // Mark contacts no longer in Zoho as inactive
      const contactsToDeactivate = (existingContacts || []).filter(
        (c: any) => !zohoIdsFound.has(c.zoho_contact_id) && c.is_active
      );

      console.log('Contacts to deactivate:', contactsToDeactivate.length);

      // Perform operations
      if (contactsToCreate.length > 0) {
        console.log(`Creating ${contactsToCreate.length} contacts...`);
        await supabase.from('organization_contact').insert(contactsToCreate);
        console.log(`${contactsToCreate.length} contacts created successfully.`);
      }

      if (contactsToUpdate.length > 0) {
        console.log(`Updating ${contactsToUpdate.length} contacts...`);
        for (const contact of contactsToUpdate) {
          const { id, ...updateData } = contact;
          await supabase.from('organization_contact').update(updateData).eq('id', id);
        }
        console.log(`${contactsToUpdate.length} contacts updated successfully.`);
      }

      if (contactsToDeactivate.length > 0) {
        console.log(`Deactivating ${contactsToDeactivate.length} contacts...`);
        for (const contact of contactsToDeactivate) {
          await supabase
            .from('organization_contact')
            .update({ is_active: false, last_synced: new Date().toISOString() })
            .eq('id', contact.id);
        }
        console.log(`${contactsToDeactivate.length} contacts deactivated successfully.`);
      }

      // Update organization sync timestamp
      await supabase
        .from('organization')
        .update({ contacts_synced_at: new Date().toISOString() })
        .eq('id', org.id);

      console.log('=== Sync Complete ===');

      res.json({
        success: true,
        synced_count: allContacts.length,
        created: contactsToCreate.length,
        updated: contactsToUpdate.length,
        deactivated: contactsToDeactivate.length
      });

    } catch (error: any) {
      console.error('=== Sync Error ===');
      console.error('Error message:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Zoho Contact Webhook - receives contact updates from Zoho CRM
  app.post('/api/functions/zohoContactWebhook', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      const webhookData = req.body;

      console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

      // Extract contact information from webhook
      const contactData = webhookData.data || webhookData;

      if (!contactData.id || !contactData.Email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required contact data'
        });
      }

      // Find which organization this contact belongs to
      let organizationId = null;
      if (contactData.Account_Name && contactData.Account_Name.id) {
        const { data: allOrgs } = await supabase.from('organization').select('*');
        const org = allOrgs?.find((o: any) => o.zoho_account_id === contactData.Account_Name.id);
        if (org) {
          organizationId = org.id;
        }
      }

      if (!organizationId) {
        return res.json({
          success: true,
          message: 'Contact not associated with a synced organization'
        });
      }

      // Check if contact already exists
      const { data: existingContacts } = await supabase
        .from('organization_contact')
        .select('*')
        .eq('zoho_contact_id', contactData.id);

      const contactRecord = {
        organization_id: organizationId,
        zoho_contact_id: contactData.id,
        email: contactData.Email,
        first_name: contactData.First_Name || '',
        last_name: contactData.Last_Name || '',
        is_active: true,
        last_synced: new Date().toISOString()
      };

      if (existingContacts && existingContacts.length > 0) {
        // Update existing contact
        await supabase
          .from('organization_contact')
          .update(contactRecord)
          .eq('id', existingContacts[0].id);

        res.json({
          success: true,
          action: 'updated',
          contact_id: existingContacts[0].id
        });
      } else {
        // Create new contact
        const { data: newContact } = await supabase
          .from('organization_contact')
          .insert(contactRecord)
          .select()
          .single();

        res.json({
          success: true,
          action: 'created',
          contact_id: newContact?.id
        });
      }

    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Update Expired Vouchers - administrative task
  app.post('/api/functions/updateExpiredVouchers', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
      console.log('[updateExpiredVouchers] Starting voucher expiry check...');

      // Fetch all active vouchers
      const { data: allVouchers } = await supabase
        .from('voucher')
        .select('*')
        .eq('status', 'active');

      console.log('[updateExpiredVouchers] Found active vouchers:', allVouchers?.length || 0);

      // Check which ones have expired
      const now = new Date();
      console.log('[updateExpiredVouchers] Current time:', now.toISOString());

      const expiredVouchers = (allVouchers || []).filter((v: any) => {
        const expiryDate = new Date(v.expires_at);
        const isExpired = expiryDate.getTime() < now.getTime();
        if (isExpired) {
          console.log(`[updateExpiredVouchers] Voucher ${v.code} (${v.id}) expired at ${v.expires_at}`);
        }
        return isExpired;
      });

      console.log('[updateExpiredVouchers] Expired vouchers to update:', expiredVouchers.length);

      if (expiredVouchers.length === 0) {
        console.log('[updateExpiredVouchers] No expired vouchers to update');
        return res.json({
          success: true,
          updated_count: 0,
          message: 'No expired vouchers found'
        });
      }

      // Update each expired voucher
      const updatePromises = expiredVouchers.map((voucher: any) => {
        console.log(`[updateExpiredVouchers] Updating voucher ${voucher.code} (${voucher.id}) to expired status`);
        return supabase
          .from('voucher')
          .update({ status: 'expired' })
          .eq('id', voucher.id);
      });

      await Promise.all(updatePromises);

      console.log('[updateExpiredVouchers] Successfully updated all expired vouchers');

      res.json({
        success: true,
        updated_count: expiredVouchers.length,
        expired_voucher_ids: expiredVouchers.map((v: any) => v.id)
      });

    } catch (error: any) {
      console.error('[updateExpiredVouchers] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Create Stripe Payment Intent
  app.post('/api/functions/createStripePaymentIntent', async (req: Request, res: Response) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(stripeSecretKey);

      const { amount, currency = 'gbp', metadata = {}, memberEmail } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          details: 'Amount must be greater than 0'
        });
      }

      if (!memberEmail) {
        return res.status(400).json({
          error: 'Member email is required'
        });
      }

      // Create a Payment Intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amount in pence/cents
        currency: currency,
        metadata: {
          member_email: memberEmail,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });

    } catch (error: any) {
      console.error('Stripe Payment Intent Error:', error);
      res.status(500).json({
        error: 'Failed to create payment intent',
        details: error.message
      });
    }
  });

  // Get Stripe Publishable Key (safe to expose to frontend)
  app.get('/api/functions/getStripePublishableKey', async (req: Request, res: Response) => {
    try {
      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

      if (!publishableKey) {
        return res.status(500).json({
          error: 'Stripe publishable key not configured'
        });
      }

      res.json({
        success: true,
        publishableKey
      });

    } catch (error: any) {
      console.error('Error fetching publishable key:', error);
      res.status(500).json({
        error: 'Failed to fetch publishable key',
        details: error.message
      });
    }
  });

  // ============ Xero Integration Routes ============

  // Xero OAuth Callback
  app.get('/api/functions/xeroOAuthCallback', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).send('<html><body><h1>Database not configured</h1></body></html>');
    }

    try {
      const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
      const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
      const XERO_REDIRECT_URI = process.env.XERO_REDIRECT_URI;

      const code = req.query.code as string;
      const error = req.query.error as string;

      if (error) {
        return res.status(400).send(`
          <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1 style="color: #dc2626;">Authentication Error</h1>
              <p>Failed to authenticate with Xero: ${error}</p>
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Close Window
              </button>
            </body>
          </html>
        `);
      }

      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: XERO_REDIRECT_URI || '',
        }).toString(),
      });

      const tokenData = await tokenResponse.json() as any;

      if (!tokenResponse.ok || tokenData.error) {
        return res.status(400).send(`
          <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1 style="color: #dc2626;">Token Exchange Failed</h1>
              <p>Error: ${JSON.stringify(tokenData)}</p>
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Close Window
              </button>
            </body>
          </html>
        `);
      }

      // Get tenant connections
      const connectionsResponse = await fetch('https://api.xero.com/connections', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const connections = await connectionsResponse.json() as any[];

      if (!connections || connections.length === 0) {
        return res.status(400).send(`
          <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1 style="color: #dc2626;">No Xero Organizations Found</h1>
              <p>Please ensure your Xero account has at least one organization.</p>
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Close Window
              </button>
            </body>
          </html>
        `);
      }

      // Use the first tenant
      const tenantId = connections[0].tenantId;

      // Calculate expiration
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      // Store tokens in database
      const { data: existingTokens } = await supabase
        .from('xero_token')
        .select('*');

      const tokenRecord = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        tenant_id: tenantId,
        token_type: tokenData.token_type || 'Bearer',
      };

      if (existingTokens && existingTokens.length > 0) {
        await supabase
          .from('xero_token')
          .update(tokenRecord)
          .eq('id', existingTokens[0].id);
      } else {
        await supabase
          .from('xero_token')
          .insert(tokenRecord);
      }

      res.send(`
        <html>
          <head>
            <style>
              body {
                font-family: system-ui;
                padding: 40px;
                text-align: center;
                background: linear-gradient(to br, #f8fafc, #eff6ff);
              }
              .success { color: #16a34a; margin-bottom: 10px; }
              button {
                margin-top: 20px;
                padding: 12px 24px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
              }
              button:hover { background: #1d4ed8; }
            </style>
          </head>
          <body>
            <h1 class="success">Xero Connected Successfully</h1>
            <p>Your Xero account (${connections[0].tenantName}) has been connected.</p>
            <p style="font-size: 14px; color: #64748b;">You can now close this window.</p>
            <button onclick="window.close()">Close Window</button>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Xero Auth URL
  app.get('/api/functions/getXeroAuthUrl', async (req: Request, res: Response) => {
    try {
      const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
      const XERO_REDIRECT_URI = process.env.XERO_REDIRECT_URI;

      if (!XERO_CLIENT_ID || !XERO_REDIRECT_URI) {
        return res.status(500).json({
          error: 'Xero not configured',
          message: 'Missing XERO_CLIENT_ID or XERO_REDIRECT_URI'
        });
      }

      // Xero OAuth authorization URL
      const authUrl = `https://login.xero.com/identity/connect/authorize?` + new URLSearchParams({
        response_type: 'code',
        client_id: XERO_CLIENT_ID,
        redirect_uri: XERO_REDIRECT_URI,
        scope: 'offline_access accounting.transactions accounting.contacts openid profile email',
        state: 'xero_auth'
      }).toString();

      res.json({ authUrl });

    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate auth URL',
        message: error.message
      });
    }
  });

  // ============ Zoho OAuth Routes ============
  
  // Helper to get Zoho accounts domain from API domain
  const getZohoAccountsDomain = (apiDomain: string): string => {
    if (apiDomain?.includes('.zohoapis.eu')) {
      return 'https://accounts.zoho.eu';
    } else if (apiDomain?.includes('.zohoapis.com.au')) {
      return 'https://accounts.zoho.com.au';
    } else {
      return 'https://accounts.zoho.com';
    }
  };

  // Get Zoho Auth URL
  app.post('/api/functions/getZohoAuthUrl', async (req: Request, res: Response) => {
    const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
    const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';
    
    if (!ZOHO_CLIENT_ID) {
      return res.status(503).json({ error: 'Zoho OAuth not configured - missing ZOHO_CLIENT_ID' });
    }

    try {
      const accountsDomain = getZohoAccountsDomain(ZOHO_CRM_API_DOMAIN);
      const redirectUri = `${req.protocol}://${req.get('host')}/api/functions/zohoOAuthCallback`;
      
      // Build Zoho OAuth authorization URL with CRM and Backstage scopes
      const authUrl = `${accountsDomain}/oauth/v2/auth?` + new URLSearchParams({
        scope: 'ZohoCRM.modules.contacts.ALL,ZohoCRM.modules.accounts.ALL,zohobackstage.portal.READ,zohobackstage.event.READ,zohobackstage.eventticket.READ,zohobackstage.order.READ,zohobackstage.order.CREATE,zohobackstage.attendee.READ',
        client_id: ZOHO_CLIENT_ID,
        response_type: 'code',
        access_type: 'offline',
        redirect_uri: redirectUri,
        prompt: 'consent'
      }).toString();

      res.json({ authUrl });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate auth URL',
        message: error.message
      });
    }
  });

  // Zoho OAuth Callback (GET - browser redirect)
  app.get('/api/functions/zohoOAuthCallback', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1 style="color: #dc2626;">Configuration Error</h1>
            <p>Supabase is not configured</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Close Window
            </button>
          </body>
        </html>
      `);
    }

    const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
    const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
    const ZOHO_CRM_API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || 'https://www.zohoapis.eu';

    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      return res.status(400).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1 style="color: #dc2626;">Authentication Error</h1>
            <p>Failed to authenticate with Zoho: ${error}</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Close Window
            </button>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1 style="color: #dc2626;">Missing Authorization Code</h1>
            <p>No authorization code was provided by Zoho.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Close Window
            </button>
          </body>
        </html>
      `);
    }

    try {
      const accountsDomain = getZohoAccountsDomain(ZOHO_CRM_API_DOMAIN);
      const redirectUri = `${req.protocol}://${req.get('host')}/api/functions/zohoOAuthCallback`;

      // Exchange authorization code for access token
      const tokenResponse = await fetch(`${accountsDomain}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: ZOHO_CLIENT_ID!,
          client_secret: ZOHO_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          code: code,
        }).toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || tokenData.error) {
        return res.status(400).send(`
          <html>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1 style="color: #dc2626;">Token Exchange Failed</h1>
              <p>Error: ${JSON.stringify(tokenData)}</p>
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Close Window
              </button>
            </body>
          </html>
        `);
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      // Store tokens in Supabase
      const { data: existingTokens } = await supabase
        .from('zoho_token')
        .select('id')
        .limit(1);

      if (existingTokens && existingTokens.length > 0) {
        await supabase
          .from('zoho_token')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            token_type: tokenData.token_type || 'Bearer',
          })
          .eq('id', existingTokens[0].id);
      } else {
        await supabase
          .from('zoho_token')
          .insert({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            token_type: tokenData.token_type || 'Bearer',
          });
      }

      res.send(`
        <html>
          <head>
            <style>
              body {
                font-family: system-ui;
                padding: 40px;
                text-align: center;
                background: linear-gradient(to br, #f8fafc, #eff6ff);
              }
              .success { color: #16a34a; margin-bottom: 10px; }
              button {
                margin-top: 20px;
                padding: 12px 24px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
              }
              button:hover { background: #1d4ed8; }
            </style>
          </head>
          <body>
            <h1 class="success">Authentication Successful</h1>
            <p>Your Zoho account has been connected successfully.</p>
            <p style="font-size: 14px; color: #64748b;">You can now close this window.</p>
            <button onclick="window.close()">Close Window</button>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Zoho OAuth callback error:', err);
      res.status(500).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1 style="color: #dc2626;">Server Error</h1>
            <p>An error occurred during authentication.</p>
            <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Close Window
            </button>
          </body>
        </html>
      `);
    }
  });

  // Generic function handler for unimplemented functions
  app.post('/api/functions/:functionName', async (req: Request, res: Response) => {
    const { functionName } = req.params;
    console.log(`Function called: ${functionName}`, req.body);
    
    res.json({ 
      success: false, 
      error: `Function '${functionName}' is not yet implemented on the Replit backend`
    });
  });

  // ============ Health Check ============
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok',
      supabase: !!supabase,
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
