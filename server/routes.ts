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

      const { data: member } = await supabase
        .from('members')
        .select('*')
        .eq('email', email?.toLowerCase())
        .single();

      res.json({ valid: !!member, member });
    } catch (error) {
      console.error('Validate member error:', error);
      res.status(500).json({ error: 'Failed to validate member' });
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

  // Sync Events from Zoho Backstage
  app.post('/api/functions/syncEventsFromBackstage', async (req: Request, res: Response) => {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const ZOHO_BACKSTAGE_PORTAL_NAME = process.env.ZOHO_BACKSTAGE_PORTAL_NAME;

    if (!ZOHO_BACKSTAGE_PORTAL_NAME) {
      return res.status(503).json({ error: 'ZOHO_BACKSTAGE_PORTAL_NAME not configured' });
    }

    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: 'Missing access token' });
      }

      // Fetch events from Zoho Backstage V3 API
      const eventsResponse = await fetch(
        `https://backstage.zoho.com/api/v3/${ZOHO_BACKSTAGE_PORTAL_NAME}/events`,
        {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!eventsResponse.ok) {
        const errorData = await eventsResponse.text();
        return res.status(eventsResponse.status).json({
          error: 'Failed to fetch events from Backstage',
          details: errorData
        });
      }

      const eventsData = await eventsResponse.json();
      const events = eventsData.data || [];

      let syncedCount = 0;
      let errorCount = 0;

      // Get all existing events once
      const { data: allExistingEvents } = await supabase
        .from('event')
        .select('*');

      // Sync each event to Supabase
      for (const event of events) {
        try {
          // Extract program tag (first tag in the list)
          const programTag = event.tags && event.tags.length > 0 ? event.tags[0] : null;

          const eventData = {
            title: event.name,
            description: event.description || '',
            program_tag: programTag,
            start_date: event.start_time,
            end_date: event.end_time,
            location: event.venue?.name || 'Online',
            ticket_price: event.tickets?.[0]?.price || 0,
            available_seats: event.tickets?.[0]?.quantity_available || 0,
            backstage_event_id: event.id,
            image_url: event.banner_url || null,
            last_synced: new Date().toISOString()
          };

          // Check if event already exists
          const existingEvent = allExistingEvents?.find(
            (e: any) => e.backstage_event_id === event.id
          );

          if (existingEvent) {
            await supabase
              .from('event')
              .update(eventData)
              .eq('id', existingEvent.id);
          } else {
            await supabase
              .from('event')
              .insert(eventData);
          }

          syncedCount++;
        } catch (error: any) {
          console.error(`Error syncing event ${event.id}:`, error);
          errorCount++;
        }
      }

      res.json({
        success: true,
        synced: syncedCount,
        errors: errorCount,
        total: events.length
      });

    } catch (error: any) {
      console.error('Sync events from Backstage error:', error);
      res.status(500).json({
        error: 'Failed to sync events',
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
