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

// Entity name to Supabase table mapping (snake_case)
const entityToTable: Record<string, string> = {
  'Member': 'members',
  'Organization': 'organizations',
  'Event': 'events',
  'ZohoToken': 'zoho_tokens',
  'Booking': 'bookings',
  'ProgramTicketTransaction': 'program_ticket_transactions',
  'MagicLink': 'magic_links',
  'OrganizationContact': 'organization_contacts',
  'Program': 'programs',
  'Voucher': 'vouchers',
  'XeroToken': 'xero_tokens',
  'BlogPost': 'blog_posts',
  'Role': 'roles',
  'TeamMember': 'team_members',
  'DiscountCode': 'discount_codes',
  'DiscountCodeUsage': 'discount_code_usages',
  'SystemSettings': 'system_settings',
  'TourGroup': 'tour_groups',
  'TourStep': 'tour_steps',
  'Resource': 'resources',
  'ResourceCategory': 'resource_categories',
  'FileRepository': 'file_repository',
  'ResourceAuthorSettings': 'resource_author_settings',
  'JobPosting': 'job_postings',
  'PageBanner': 'page_banners',
  'IEditPage': 'iedit_pages',
  'IEditPageElement': 'iedit_page_elements',
  'IEditElementTemplate': 'iedit_element_templates',
  'ResourceFolder': 'resource_folders',
  'FileRepositoryFolder': 'file_repository_folders',
  'NavigationItem': 'navigation_items',
  'ArticleCategory': 'article_categories',
  'ArticleComment': 'article_comments',
  'CommentReaction': 'comment_reactions',
  'ArticleReaction': 'article_reactions',
  'ArticleView': 'article_views',
  'ButtonStyle': 'button_styles',
  'Award': 'awards',
  'OfflineAward': 'offline_awards',
  'OfflineAwardAssignment': 'offline_award_assignments',
  'WallOfFameSection': 'wall_of_fame_sections',
  'WallOfFameCategory': 'wall_of_fame_categories',
  'WallOfFamePerson': 'wall_of_fame_persons',
  'Floater': 'floaters',
  'Form': 'forms',
  'FormSubmission': 'form_submissions',
  'NewsPost': 'news_posts',
  'SupportTicket': 'support_tickets',
  'SupportTicketResponse': 'support_ticket_responses',
  'PortalNavigationItem': 'portal_navigation_items',
  'MemberGroup': 'member_groups',
  'MemberGroupAssignment': 'member_group_assignments',
  'GuestWriter': 'guest_writers',
  'PortalMenu': 'portal_menus',
  'AwardClassification': 'award_classifications',
  'AwardSublevel': 'award_sublevels',
  'MemberGroupGuest': 'member_group_guests',
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

  // Helper to get table name from entity
  const getTableName = (entity: string): string => {
    return entityToTable[entity] || entity.toLowerCase() + 's';
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
    // This would connect to Zoho CRM API
    // For now, return a placeholder
    res.json({ success: true, message: 'Zoho CRM sync not yet implemented' });
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
