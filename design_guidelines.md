# Design Guidelines: Platform Migration - No UI/UX Changes

## Critical Directive: PRESERVE EXISTING DESIGN

**This is a platform migration only - NOT a redesign project.**

### Primary Constraint
- **Zero UI/UX modifications permitted**
- Client-approved frontend must remain pixel-perfect identical
- All design decisions have already been finalized in the base44 version

### Migration Scope
The engineering team should:

1. **Import existing codebase exactly as-is** from GitHub repository
2. **Preserve all component structures** - no refactoring of UI components
3. **Maintain identical styling** - keep all CSS/Tailwind classes unchanged
4. **Keep existing layouts** - same spacing, typography, colors, and visual hierarchy
5. **Retain all interactions** - animations, transitions, and user flows must remain identical

### Technical Migration Focus Only
- Configure Vite build for Replit environment
- Implement proper routing configuration
- Establish stable caching strategy
- Migrate API connections (Supabase, Zoho CRM)
- Set up environment variables in Replit Secrets

### Design Deliverable
**None required.** The existing base44 application serves as the complete design specification. Any visual changes would violate client requirements and project constraints.

---

**Engineering Priority:** Achieve 100% visual and functional parity with the base44 version while solving the platform's routing and caching limitations.