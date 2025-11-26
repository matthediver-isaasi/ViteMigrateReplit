# Overview

This is a membership management platform built with React (Vite) and Express.js. The application manages members, organizations, events, bookings, program tickets, resources, blog posts, and various administrative features. It is currently undergoing a platform migration from Base44 to Replit, maintaining 100% visual and functional parity with the existing application while adapting the backend infrastructure.

The system integrates with Supabase for database operations, Zoho CRM for contact/account management, Zoho Backstage for event management, Stripe for payments, and Xero for invoicing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript/JSX
- Vite as the build tool and development server
- TanStack Query for server state management
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens

**Design System:**
The application uses a "new-york" style variant from shadcn/ui with extensive customization. The design system enforces a strict no-modification policy during migration - all UI components, layouts, spacing, and visual treatments must remain pixel-perfect identical to the Base44 version.

**Component Organization:**
- Components aliased via `@/components` path
- UI primitives in `@/components/ui` (Radix-based)
- Shared utilities in `@/lib/utils`
- Hooks in `@/hooks`

**Routing:**
Client-side routing handled by the frontend framework. All routes fall through to `index.html` for SPA behavior, with special handling for `/api/*` routes going to the backend.

## Backend Architecture

**Server Framework:**
- Express.js server with dual entry points:
  - `server/index-dev.ts` - Development mode with Vite middleware integration
  - `server/index-prod.ts` - Production mode serving static assets from `dist/public`

**Database Layer:**
- PostgreSQL database via Neon serverless
- Drizzle ORM configured but schema defined externally in Supabase
- Connection string via `DATABASE_URL` environment variable
- Uses singular table names (e.g., `member`, `organization`, `event`)

**API Design Pattern:**
The backend provides a generic entity CRUD API that mirrors the Base44 SDK interface:
- `GET /api/entities/:entity` - List entities with filtering, sorting, pagination
- `GET /api/entities/:entity/:id` - Get single entity with optional expand
- `POST /api/entities/:entity` - Create entity
- `PATCH /api/entities/:entity/:id` - Update entity
- `DELETE /api/entities/:entity/:id` - Delete entity

This abstraction layer allows frontend code to remain unchanged during migration by providing the same interface the Base44 SDK used, but communicating with Supabase instead.

**Authentication:**
- Magic link-based authentication system
- Session management using express-session with MemoryStore (development) or connect-pg-simple (production)
- Auth endpoints: `/api/auth/me`, `/api/auth/logout`
- Member verification via email lookup in Supabase

**Function Handlers:**
Server-side functions accessible via `/api/functions/:functionName` endpoint for operations like:
- Magic link generation and verification
- Stripe payment intent creation
- Booking creation and management
- Program ticket purchases
- Event synchronization

## Data Model

**Core Entities:**
- **Member**: User accounts with roles, organizations, biographies, handles
- **Organization**: Company/institution accounts with domains, training funds, program ticket balances
- **Role**: Permission system defining feature access via excluded features list
- **TeamMember**: Admin/staff accounts separate from members

**Events & Bookings:**
- **Event**: Synced from Zoho Backstage with program tags, dates, pricing
- **Booking**: Event registrations with payment methods (voucher, training fund, account, program ticket)
- **Program**: Event categories with special pricing and offers (BOGO, bulk discounts)
- **ProgramTicketTransaction**: Purchase/usage history for program tickets

**Content Management:**
- **BlogPost**: Articles with authors (members or guest writers), categories, tags, reactions
- **Resource**: Downloadable files, videos, external links with categorization
- **NewsPost**: News articles (non-member authored)
- **IEditPage/IEditPageElement**: Dynamic page builder system with element templates

**Configuration:**
- **NavigationItem**: Dynamic navigation menu configuration for top/main nav
- **PortalMenu**: Internal portal navigation structure
- **PageBanner**: Configurable banner images for pages
- **TourGroup/TourStep**: Interactive guided tours for user onboarding
- **SystemSettings**: Key-value configuration store

## External Dependencies

**Supabase:**
- Primary database for all application data
- Used for CRUD operations via service key on backend
- Anon key exposed to frontend for specific features (realtime subscriptions)
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Zoho CRM:**
- Contact and account synchronization
- OAuth-based authentication flow
- Webhook receivers for real-time updates
- Token storage in `zoho_token` table with refresh mechanism

**Zoho Backstage:**
- Event management and ticket sales
- Bi-directional sync for bookings and cancellations
- Event data includes program tags, dates, locations, pricing
- Booking references linked to Backstage ticket types

**Stripe:**
- Payment processing for program tickets, job postings, and other purchases
- Payment intent creation via server-side API
- Webhook handlers for payment confirmation
- Environment variable: `STRIPE_SECRET_KEY`

**Xero:**
- Invoice generation for purchases
- OAuth authentication with token refresh
- Tenant ID configuration for organization targeting
- Token storage in `xero_token` table

**File Storage:**
- File uploads handled via Supabase Storage or Base44 integration layer
- URLs stored in database for images, documents, videos
- Support for both public and private file repositories

**Email Delivery:**
- Magic link authentication emails
- Notification emails for bookings, cancellations
- Handled via integration layer (SendEmail function)

## Migration Strategy

The application is transitioning from Base44 (previous platform) to Replit while maintaining zero UI/UX changes:

1. **Frontend Compatibility Layer**: The `base44Client.js` adapter provides the same SDK interface as Base44, proxying requests to the Express backend instead
2. **Entity Mapping**: Maps Base44 entity names to Supabase singular table names
3. **API Translation**: Express routes translate between Base44-style requests and Supabase queries
4. **Environment Configuration**: Secrets management via Replit Secrets for database URLs, API keys, OAuth credentials
5. **Build Process**: Vite builds to `dist/public` for production deployment
6. **Routing Configuration**: `vercel.json` configured for Vercel production deployment

## Deployment Architecture

**Development (Replit):**
- Express.js server with Vite middleware integration
- Full API functionality including Zoho Backstage sync
- Hot module replacement for frontend development
- Server runs on port 5000

**Production (Vercel):**
- Serverless functions in `/api` directory
- `api/functions/[functionName].js` - Main function dispatcher (validateMember, createBooking, etc.)
- `api/entities/[entity]/index.js` - Entity list/create operations
- `api/entities/[entity]/[id].js` - Entity get/update/delete operations
- Static frontend served from Vite build output

**Deployment Parity Status (Updated Nov 2024):**
All critical functions now have parity between Express and Vercel serverless:
- validateMember with Zoho CRM sync
- Magic link generation/verification
- createBooking with program ticket deduction
- validateColleague with organization validation
- processProgramTicketPurchase/cancel/reinstate
- Job posting functions (member and non-member)
- Discount code application
- Training fund balance sync

**Table Name Mappings:**
Entity names map to Supabase table names using singular form:
- `IEditPage` → `i_edit_page` (note underscore between i and edit)
- `IEditPageElement` → `i_edit_page_element`
- `IEditElementTemplate` → `i_edit_element_template`
- All other entities use snake_case conversion

**Critical Constraints:**
- No visual or UX modifications permitted
- All component structures must remain identical
- Styling and layouts must be pixel-perfect matches
- Only infrastructure and platform integration changes allowed

**Architecture Pattern for Member/Role Access:**
React Router's `<Routes>` component doesn't propagate props from parent Layout. All pages requiring member/role data use the centralized `useMemberAccess` hook located at `client/src/hooks/useMemberAccess.js`.

The hook provides:
- `memberInfo` - Current member data from sessionStorage (reactive to updates)
- `organizationInfo` - Current organization data from sessionStorage (reactive to updates)
- `memberRole` - Role data fetched via useQuery
- `isAdmin` - Boolean indicating if memberRole.is_admin === true
- `isFeatureExcluded(featureId)` - Function to check if a feature is excluded for the user
- `isAccessReady` - Boolean indicating if all access data is loaded
- `reloadMemberInfo()` - Function to refresh member data from API and update state
- `refreshOrganizationInfo()` - Function to refresh organization data from API and update state

Example usage in pages:
```javascript
import { useMemberAccess } from "@/hooks/useMemberAccess";

export default function MyPage() {
  const { memberInfo, organizationInfo, isAdmin, isAccessReady, reloadMemberInfo } = useMemberAccess();
  
  // For admin-only pages, add access control:
  const [accessChecked, setAccessChecked] = useState(false);
  
  useEffect(() => {
    if (isAccessReady) {
      if (!isAdmin) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, isAccessReady]);
  
  if (!accessChecked) return <LoadingState />;
  
  // Rest of component...
}
```

**Testing Notes:**
- Use `/testlogin` page with `mat@isaasi.co.uk` as authentication backdoor for testing admin features
- Magic link authentication stores member data in sessionStorage key `agcas_member`
- React Query uses `staleTime: Infinity`, requiring manual cache invalidation to see updated data