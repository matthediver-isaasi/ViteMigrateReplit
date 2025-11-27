# Overview

This project is a membership management platform built with React (Vite) and Express.js. It handles members, organizations, events, bookings, program tickets, resources, and blog posts, along with administrative features. The primary goal is a platform migration from Base44 to Replit, ensuring 100% visual and functional parity with the existing application while adapting the backend infrastructure. It integrates with Supabase, Zoho CRM, Zoho Backstage, Stripe, and Xero.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:** React 18 with TypeScript/JSX, Vite, TanStack Query, shadcn/ui (Radix UI primitives), and Tailwind CSS with custom design tokens.

**Design System:** Uses a "new-york" style variant from shadcn/ui. The migration enforces pixel-perfect parity with the Base44 version, with no UI modifications permitted.

**Component Organization:** Components aliased via `@/components`, UI primitives in `@/components/ui`, shared utilities in `@/lib/utils`, and hooks in `@/hooks`.

**Routing:** Client-side routing with all routes falling through to `index.html` for SPA behavior, except `/api/*` routes which go to the backend.

## Backend Architecture

**Server Framework:** Express.js with dual entry points for development (`server/index-dev.ts`) and production (`server/index-prod.ts`).

**Database Layer:** PostgreSQL via Neon serverless, using Drizzle ORM. Schema is defined externally in Supabase, using singular table names.

**API Design Pattern:** A generic entity CRUD API mirrors the Base44 SDK interface, supporting `GET`, `POST`, `PATCH`, and `DELETE` operations on `/api/entities/:entity`. This abstraction maintains frontend compatibility during migration.

**Authentication:** Magic link-based authentication with session management. Member verification uses email lookup in Supabase.

**Function Handlers:** Server-side functions are accessible via `/api/functions/:functionName` for operations like magic link handling, Stripe payment intent creation, and booking management.

## Data Model

**Core Entities:** Member, Organization, Role, TeamMember.

**Events & Bookings:** Event (synced from Zoho Backstage), Booking, Program, ProgramTicketTransaction.

**Content Management:** BlogPost, Resource, NewsPost, IEditPage/IEditPageElement (dynamic page builder).

**Configuration:** NavigationItem, PortalMenu, PageBanner, TourGroup/TourStep, SystemSettings.

## Multi-Tenant Architecture

The platform supports multiple organizations (tenants) with data isolation, subdomain routing, and per-tenant theming.

**Database Schema:** Includes `tenant`, `tenant_domain`, `tenant_theme`, and `tenant_integration` tables. All application tables contain a `tenant_id` column for data isolation.

**Tenant Detection:** `tenantMiddleware.ts` extracts the tenant from the request hostname, supporting subdomains and custom domains.

**Data Isolation Security:** All CRUD handlers enforce tenant scoping by filtering queries by `tenant_id` and injecting/stripping `tenant_id` in create/update operations.

**Frontend Theming:** `TenantContext.jsx` provides tenant configuration to the React app, fetching from `/api/tenant/bootstrap` and computing CSS variables for dynamic theming.

## Runtime Page Provisioning (CMS Feature)

The application features runtime page/route provisioning. A `/:slug` catch-all route renders IEdit pages dynamically via the `DynamicPage` component. Admins can publish pages instantly, with `draft` and `published` statuses. Access control supports public and member-only pages.

# External Dependencies

**Supabase:** Primary database for all application data, used for CRUD operations and real-time subscriptions.

**Zoho CRM:** Contact and account synchronization via OAuth.

**Zoho Backstage:** Event management and ticket sales, with bi-directional sync for bookings.

**Stripe:** Payment processing for purchases, using server-side payment intent creation and webhooks.

**Xero:** Invoice generation, using OAuth for authentication and token refresh.

**File Storage:** Handled via Supabase Storage or Base44 integration.

**Email Delivery:** For magic link authentication and notifications, via an integration layer.