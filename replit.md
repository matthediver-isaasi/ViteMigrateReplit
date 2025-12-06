# Overview

This project is a membership management platform developed with React (Vite) and Express.js. It facilitates the management of members, organizations, events, bookings, program tickets, resources, and blog posts, alongside various administrative functionalities. The platform is undergoing a migration from Base44 to Replit, with a strict requirement to maintain 100% visual and functional parity with the existing application, while adapting the backend infrastructure. It integrates with Supabase for data, Zoho CRM for contact management, Zoho Backstage for event handling, Stripe for payments, and Xero for invoicing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:** React 18 (TypeScript/JSX), Vite, TanStack Query, shadcn/ui (Radix UI), Tailwind CSS.

**Design System:** Uses a customized "new-york" style from shadcn/ui. UI components, layouts, spacing, and visual treatments must be pixel-perfect identical to the Base44 version with no modifications during migration.

**Component Organization:** Components are aliased via `@/components`, UI primitives in `@/components/ui`, utilities in `@/lib/utils`, and hooks in `@/hooks`.

**Routing:** Client-side routing with all routes falling through to `index.html` for SPA behavior, except `/api/*` routes which go to the backend.

## Backend Architecture

**Server Framework:** Express.js with separate development (`server/index-dev.ts`) and production (`server/index-prod.ts`) entry points.

**Database Layer:** PostgreSQL via Neon serverless. Uses Drizzle ORM, with schema defined externally in Supabase. Tables are singular (e.g., `member`).

**API Design Pattern:** Generic entity CRUD API mirroring the Base44 SDK:
- `GET /api/entities/:entity`
- `GET /api/entities/:entity/:id`
- `POST /api/entities/:entity`
- `PATCH /api/entities/:entity/:id`
- `DELETE /api/entities/:entity/:id`

**Authentication:** Password-based authentication with server-side session management using `express-session`. Endpoints include `/api/auth/me` (returns member data with `isAdmin` flag), `/api/auth/login`, `/api/auth/logout`, `/api/auth/change-password`, and `/api/auth/request-password-reset`.

**Admin Security Model:** Admin-only operations use server-validated routes that verify permissions via session:
- `/api/admin/members/:id` (GET/PATCH) - Fetch/update member profile with field allowlist
- `/api/admin/organizations/:id` (PATCH) - Update organization with field allowlist  
- `/api/admin/members/:memberId/communication-preferences/:categoryId` (PATCH) - Update member communication preferences
- Permission verification via `verifyPermission()` helper which checks the role's `excluded_features` array
- Available permissions: `admin_can_edit_members`, `admin_can_manage_communications` - configurable in Role Management
- Roles with `is_admin=true` automatically have all permissions (backwards compatible)
- `/api/auth/me` returns permission flags: `isAdmin`, `canEditMembers`, `canManageCommunications`
- Frontend uses `useServerAdminAuth` hook with `requiredPermission` option to check specific permissions

**Function Handlers:** Server-side functions via `/api/functions/:functionName` for operations like magic link generation, Stripe payments, bookings, and event synchronization.

## Data Model

**Core Entities:** Member, Organization, Role, TeamMember.

**Events & Bookings:** Event (synced from Zoho Backstage or created as one-off), Booking, Program, ProgramTicketTransaction.

**One-Off Events:** Events can be created as "one-off" events (program_tag="" empty string) with direct pricing instead of program ticket deduction. Visibility is determined solely by `program_tag`: empty/null = one-off event, non-empty = program event. Pricing configuration stored in `pricing_config` JSONB column.

**Event Summary & Description:** Events have a `summary` field (150 character limit) for brief previews displayed on event cards and the EventDetails page preview section. The full `description` field supports rich text HTML (via ReactQuill editor) and is only shown in a "More information" modal. Descriptions are sanitized with DOMPurify before rendering to prevent XSS attacks.

**Role-Based Ticket Classes:** One-off events support multiple ticket classes with role-based access control. The `pricing_config` contains:
- `ticket_classes`: Array of ticket class objects, each with:
  - `id`: Unique identifier for the ticket class
  - `name`: Display name (e.g., "Member Ticket", "Non-Member Ticket")
  - `price`: Price per attendee in GBP
  - `role_ids`: Array of role IDs that can purchase this ticket (empty = all roles)
  - `is_default`: Boolean indicating the default ticket class
  - `is_public`: Boolean indicating if the ticket is visible to non-logged-in users (default: false)
  - `offer_type`: 'none', 'bogo', or 'bulk_discount'
  - `bogo_logic_type`: 'buy_x_get_y_free' or 'enter_total_pay_less'
  - `bogo_buy_quantity` / `bogo_get_free_quantity`: For BOGO offers
  - `bulk_discount_threshold` / `bulk_discount_percentage`: For bulk discounts
- `ticket_price`: Legacy field - stores default ticket price for backward compatibility

**Public Tickets:** Ticket classes can be marked as "public" to make them visible to non-logged-in visitors:
- Each ticket class has an `is_public` toggle in the Create/Edit Event forms
- Events with at least one public ticket class appear on the PublicEvents page
- Non-logged-in users on EventDetails only see ticket classes marked as public
- Logged-in members see all ticket classes regardless of public status
- Legacy/migrated events default to `is_public: false` (member-only)

**Ticket Class Selection & Role-Based Filtering:** On EventDetails page for one-off events:
- All ticket classes are displayed to the user, regardless of their role
- Users can select any ticket class they wish to purchase
- The Attendees card is always shown by default (no registration mode selection cards)
- Self-registration via "I am attending" toggle is only available if the user's role matches the selected ticket's `role_ids`
- When adding colleagues, the colleague list is filtered to show only members whose `role_id` matches the selected ticket's `role_ids`
- If a ticket has empty `role_ids`, it's available to all roles (no restrictions)
- When the user switches to a ticket they cannot self-register for, they are removed from the attendee list if they were attending

**One-Off Event Payment Methods:**
- Training vouchers (from ProgramTicketTransaction with type='voucher')
- Training fund (from organization.training_fund_balance)
- Organization account (creates account_charge transaction with PO number)
- Stripe card payment (verified via PaymentIntent before booking creation)

**Guest Checkout (Public Tickets):** Non-logged-in users can purchase public ticket classes:
- Guest registration form captures: first_name, last_name, email (required), organization (required), phone (optional), job_title (optional for Zoom integration)
- Payment via Stripe only (no vouchers, training fund, or account options)
- `isGuestCheckout` flag tracks non-authenticated booking flow
- Frontend passes `guestInfo` object and `isGuestBooking: true` to backend
- ticketsRequired = 1 for guest checkout (single attendee per booking)
- Attendees array includes `isGuest: true` flag for guest attendees

**Backend Function:** `createOneOffEventBooking` handles payment processing with server-side validation of voucher ownership, training fund amounts, and Stripe payment verification. Supports guest bookings with null member_id/organization_id when isGuestBooking is true.

**Content Management:** BlogPost, Resource, NewsPost, IEditPage/IEditPageElement (dynamic page builder).

**Typography System (Page Builder):** Pre-defined typography styles can be applied to text elements in the page builder via `TypographyStyle` entity and `TypographyStyleSelector` component.
- Styles define: font_family, font_size, font_size_mobile, font_weight, line_height, letter_spacing, color, text_transform
- Architecture: "Apply once" pattern - style values are copied to element fields when applied (not dynamically looked up)
- All IEdit elements have TypographyStyleSelector integrated with collapsible "Manual Font Settings" for direct font control
- Mobile responsive sizing implemented via font_size_mobile field and useIsMobile hook
- Elements store applied style ID in `*_typography_style_id` fields for reference
- Managed via `/InstalledFonts` admin page for style definitions

**Forms System:** Custom forms with support for two layout types: `card_swipe` (step-by-step) and `standard` (all fields visible).
- Form entity stores: name, slug, description, layout_type, fields[], pages[], is_active, require_authentication
- Forms support multi-page pagination with the `pages` JSONB column storing an array of page objects
- Each page has: id, title, column_count (1, 2, or 3 columns)
- Fields have: id, label, type, required, page_id (references page), column_index (0, 1, or 2)
- Multi-column layout renders fields in responsive CSS grid columns (stack on mobile)
- Unassigned fields (page_id === null) are rendered on the first page for backwards compatibility
- Organisation dropdown field type uses public endpoint `/api/public/organisations` for both authenticated and guest users
- FormRenderer component handles individual field rendering including auto-populated user fields
- Forms can be embedded in page builder via IEditFormElement with optional header content

**Speakers:** Speaker profiles for event assignments. Similar to GuestWriter but email is optional. Managed via `/SpeakerManagement` admin page. Events can have multiple speakers assigned (stored in `speaker_ids` array on Event).

**Configuration:** NavigationItem, PortalMenu, PageBanner, TourGroup/TourStep, SystemSettings.

**Communications:** CommunicationCategory (marketing segment categories), CommunicationCategoryRole (role-based category assignments), MemberCommunicationPreference (member opt-in/opt-out preferences).

**Custom Fields:** PreferenceField (field definitions with entity_scope = 'member' or 'organization'), MemberPreferenceValue (member custom field values), OrganizationPreferenceValue (organization custom field values). Entity scope determines where fields are displayed and edited.

**Organization Fields:** The organization table includes default contact fields (phone, invoicing_email, invoicing_address, website_url) plus standard metadata (name, logo_url, domain, description). These are displayed on the /myorganisation page and editable via admin endpoints.

## Deployment Architecture

**Development (Replit):** Express.js with Vite middleware, full API functionality, hot module replacement.

**Production (Vercel):** Serverless functions for API endpoints (`/api` directory) and static frontend assets.

**CRM Sync Architecture:** One-way data flow from Zoho CRM to the application. Sync occurs on member login (`validateMember`) and via manual triggers by administrators.

**Data Freshness & Caching:** Utilizes TanStack Query with a global `staleTime: 5000` for general data and `staleTime: 0` for critical content feeds. Supabase Realtime Subscriptions are used for live updates on specific tables (e.g., `blog_post`, `resource`, `article_comment`).

## Runtime Page Provisioning (CMS Feature)

**Overview:** Enables administrators to provision pages/routes at runtime without code deployment. A `/:slug` catch-all route renders dynamic IEdit pages.

**Page Status Flow:** Pages can be `draft` or `published`.

**Access Control:** `public` pages are universally accessible; `member` pages require login.

## My Organisation Page

**Route:** `/myorganisation` (feature ID: `page_user_MyOrganisation`)

**Purpose:** Displays organization details for the logged-in member including contact information and custom fields.

**Default Fields:** Phone number, website URL, invoicing email, invoicing address.

**Custom Fields:** Displays organization-scoped PreferenceField values (entity_scope = 'organization') with support for text, textarea, dropdown, picklist (multi-select), boolean, date, number, and decimal field types.

**Access Control:** Controlled via Role Management using `page_user_MyOrganisation` feature ID in excluded_features array.

# External Dependencies

**Supabase:** Primary database for all application data, used for CRUD operations via service key on the backend and anon key on the frontend for specific features (realtime subscriptions). Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

**Zoho CRM:** Used for contact and account synchronization, employing OAuth-based authentication and webhooks for real-time updates. Tokens are stored in the `zoho_token` table.

**Zoho Backstage:** Integrates for event management and ticket sales, with bi-directional sync for bookings and cancellations.

**Stripe:** Handles payment processing for various purchases. Payment intent creation occurs via server-side API. Environment variable: `STRIPE_SECRET_KEY`.

**Xero:** Used for invoice generation, utilizing OAuth authentication and token refresh. Tokens are stored in the `xero_token` table.

**File Storage:** Handled by Supabase Storage or a Base44 integration layer, storing URLs for images and documents.

**Email Delivery:** Used for magic link authentication and various notifications via an integration layer (SendEmail function).