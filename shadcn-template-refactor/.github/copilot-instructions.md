# ZAM-PROPERTY WEB FRONTEND - AI Coding Agent Instructions

> ⚠️ **ALWAYS READ FIRST**: Before any task, review [part-0.md](../docs/ai-prompt/part-0.md) and [master-prompt.md](../docs/ai-prompt/master-prompt.md). These are NON-NEGOTIABLE and override any conflicting instructions.

## Project Overview

**Zam-Property Web Frontend** is a **multi-tenant, multi-vertical marketplace dashboard** built with Next.js 16 App Router and shadcn/ui. Designed for Platform Admins, Tenant Admins, Vendors, and Customers to manage listings, interactions, and analytics.

This project is built on top of a **shadcn/ui dashboard template** with 17+ pre-built dashboards and 58+ UI components.

---

## Tech Stack (LOCKED)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.10 | App Router framework |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.9+ | Type safety (strict mode) |
| **Tailwind CSS** | v4+ | Styling with CSS variables |
| **shadcn/ui** | latest | UI component library |
| **TanStack Query** | v5+ | Server state management |
| **Zustand** | v5+ | Client state (minimal) |
| **React Hook Form** | v7+ | Form handling |
| **Zod** | v3+ | Schema validation |
| **Recharts** | v2+ | Charts & analytics |
| **TanStack Table** | v8+ | Data tables |
| **Socket.IO Client** | latest | Real-time updates |
| **Motion** | v12+ | Animations |
| **Lucide React** | latest | Icons |
| **pnpm** | latest | Package manager |

---

## Portal Architecture (5 Portals)

```
/platform/*    → Platform Admin (SUPER_ADMIN only)
/tenant/*      → Tenant Admin Portal (TENANT_ADMIN)
/vendor/*      → Vendor Portal (VENDOR_ADMIN, VENDOR_STAFF)
/account/*     → Customer Account (CUSTOMER)
/(public)/*    → Public pages (GUEST + all roles)
```

| Portal | Route | Roles | Description |
|--------|-------|-------|-------------|
| **Platform** | `/platform/*` | SUPER_ADMIN | System-wide management |
| **Tenant** | `/tenant/*` | TENANT_ADMIN | Tenant-specific management |
| **Vendor** | `/vendor/*` | VENDOR_ADMIN, VENDOR_STAFF | Vendor dashboard |
| **Account** | `/account/*` | CUSTOMER | Customer profile & inquiries |
| **Public** | `/(public)/*` | GUEST + all | Home, search, listing details |

---

## Project Structure

```
shadcn-template-refactor/
├── app/
│   ├── (public)/                   # Public pages (home, search, listing)
│   │   ├── page.tsx                # Landing page
│   │   ├── search/                 # Search & discovery
│   │   └── listing/[slug]/         # Listing detail
│   ├── (auth)/                     # Auth pages (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── platform/                   # Platform Admin portal
│   │   ├── layout.tsx              # Platform shell
│   │   ├── page.tsx                # Platform dashboard
│   │   ├── tenants/                # Tenant management
│   │   └── settings/               # Platform settings
│   ├── tenant/                     # Tenant Admin portal
│   │   ├── layout.tsx              # Tenant shell
│   │   ├── page.tsx                # Tenant dashboard
│   │   ├── listings/               # Listing management
│   │   ├── vendors/                # Vendor management
│   │   └── analytics/              # Tenant analytics
│   ├── vendor/                     # Vendor portal
│   │   ├── layout.tsx              # Vendor shell
│   │   ├── page.tsx                # Vendor dashboard
│   │   ├── listings/               # My listings
│   │   └── interactions/           # Leads & inquiries
│   ├── account/                    # Customer account portal
│   │   ├── layout.tsx              # Account shell
│   │   ├── page.tsx                # Account dashboard
│   │   ├── profile/                # Profile settings
│   │   └── inquiries/              # My inquiries
│   ├── dashboard/                  # ⚠️ TEMPLATE REFERENCE (DO NOT DELETE)
│   │   ├── (auth)/                 # Auth layout examples
│   │   │   ├── reference/          # 17+ dashboard examples
│   │   │   └── page.tsx            # Example dashboard
│   │   └── (guest)/                # Guest page examples
│   │       ├── login/              # Login v1, v2
│   │       └── register/           # Register v1, v2
│   ├── layout.tsx                  # Root layout
│   └── providers.tsx               # Global providers
│
├── components/
│   ├── ui/                         # shadcn/ui primitives (58 components)
│   ├── common/                     # Shared components
│   ├── layout/                     # Layout components
│   │   ├── sidebar/                # Sidebar navigation
│   │   │   ├── app-sidebar.tsx     # Main sidebar
│   │   │   ├── nav-main.tsx        # Navigation items
│   │   │   └── nav-user.tsx        # User menu
│   │   └── header/                 # Header components
│   └── forms/                      # Form components
│
├── modules/                        # Domain modules
│   ├── auth/                       # Auth hooks, context
│   ├── listing/                    # Listing hooks, components
│   ├── vendor/                     # Vendor hooks, components
│   ├── tenant/                     # Tenant hooks, components
│   ├── interaction/                # Leads/inquiries
│   ├── review/                     # Reviews & ratings
│   ├── subscription/               # Plans & billing
│   ├── notification/               # Notifications
│   ├── analytics/                  # Analytics hooks
│   ├── search/                     # Search & filters
│   ├── audit/                      # Audit logs
│   └── account/                    # Account management
│
├── verticals/                      # Vertical-specific UI
│   ├── registry/                   # Vertical registry
│   └── real-estate/                # Real estate forms, filters
│
├── lib/                            # Core utilities
│   ├── api/                        # API client
│   │   ├── client.ts               # Axios/fetch wrapper
│   │   └── hooks/                  # Base query hooks
│   ├── auth/                       # Auth utilities
│   ├── websocket/                  # Socket.IO client
│   ├── utils.ts                    # Pure utilities (cn, etc.)
│   ├── themes.ts                   # Theme configuration
│   └── fonts.ts                    # Font setup
│
├── hooks/                          # Shared hooks
│   ├── use-mobile.ts               # Mobile detection
│   ├── use-toast.ts                # Toast notifications
│   └── use-file-upload.ts          # File upload
│
├── types/                          # Global types
├── constants/                      # Global constants
├── docs/                           # Documentation
│   ├── ai-prompt/                  # AI prompts (33 parts)
│   ├── PROGRESS.md                 # Development progress
│   ├── API-REGISTRY.md             # API hooks registry
│   └── NAV-STRUCTURE.md            # Navigation structure
└── public/                         # Static assets
```

---

## Naming Conventions (MANDATORY)

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `listing-card.tsx`, `use-listings.ts` |
| Components | PascalCase | `ListingCard`, `VendorProfile` |
| Hooks | camelCase with `use` | `useListings`, `useAuth` |
| Variables | camelCase | `listingId`, `isLoading` |
| Constants | SCREAMING_SNAKE | `MAX_PAGE_SIZE`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `ListingResponse`, `CreateListingDto` |
| Route folders | kebab-case | `listing-create`, `vendor-profile` |
| Query keys | camelCase array | `['listings', tenantId]` |

### File Suffixes
- Components: `*.tsx` (PascalCase exports)
- Hooks: `use-*.ts` → exports `useXxx`
- Types: `*.types.ts`
- Utils: `*.utils.ts`
- Constants: `*.constants.ts`
- API hooks: `use-*-api.ts` or `use-*-query.ts`

---

## Module Pattern (MANDATORY)

Each domain module follows this structure:

```
modules/<domain>/
├── hooks/
│   ├── use-<domain>.ts             # Main query hook
│   ├── use-<domain>-mutations.ts   # Mutation hooks
│   └── use-<domain>-filters.ts     # Filter state
├── components/
│   ├── <domain>-list.tsx
│   ├── <domain>-card.tsx
│   ├── <domain>-form.tsx
│   └── <domain>-detail.tsx
├── types/
│   └── <domain>.types.ts
├── utils/
│   └── <domain>.utils.ts
└── index.ts                        # Public exports
```

---

## Key Architectural Rules

1. **Server Components by default** - Only use `'use client'` when needed
2. **TanStack Query for ALL API calls** - No raw fetch in components
3. **Zod for ALL form validation** - Schemas match backend DTOs
4. **Route guards via middleware** - Check role before rendering
5. **Tenant context from subdomain/header** - Never hardcode
6. **Vertical-agnostic core** - Use schema registry for attributes
7. **Optimistic updates** - For better UX on mutations
8. **NO hardcoded bypass flags** - Always use env variables for dev settings

---

## Role Hierarchy (6 Roles)

| Scope | Role | Portal Access |
|-------|------|---------------|
| PLATFORM | `SUPER_ADMIN` | `/platform/*` |
| TENANT | `TENANT_ADMIN` | `/tenant/*` |
| VENDOR | `VENDOR_ADMIN` | `/vendor/*` |
| VENDOR | `VENDOR_STAFF` | `/vendor/*` (limited) |
| CUSTOMER | `CUSTOMER` | `/account/*` + Public |
| PUBLIC | `GUEST` | Public only |

---

## Status Enums (Must Match Backend)

```typescript
// Tenant
TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'

// User
UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'

// Vendor
VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

// Listing
ListingStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED'

// Interaction
InteractionStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CLOSED' | 'INVALID'

// Review
ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED'
```

---

## API Conventions (Must Match Backend)

| Type | Convention | Example |
|------|------------|---------|
| URL paths | kebab-case | `/api/v1/vendor-profiles` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| Request body | camelCase | `{ "vendorId": "uuid" }` |
| Response body | camelCase | `{ "createdAt": "..." }` |
| Enum values | SCREAMING_SNAKE | `"status": "PUBLISHED"` |
| Dates | ISO 8601 | `"2025-01-01T00:00:00Z"` |

### Required Headers
```typescript
headers: {
  'Content-Type': 'application/json',
  'X-Tenant-ID': tenantId,           // Required for all requests
  'Authorization': `Bearer ${token}` // Required for auth requests
}
```

---

## TanStack Query Keys Convention

```typescript
// Pattern: [resource, ...identifiers, ...filters]
['listings']                           // All listings
['listings', listingId]                // Single listing
['listings', { status: 'PUBLISHED' }]  // Filtered listings
['listings', 'infinite', filters]      // Infinite query
['vendors', vendorId, 'listings']      // Vendor's listings
['auth', 'me']                         // Current user
```

---

## Available UI Components (58+)

All components are in `components/ui/`:

### Forms & Inputs
`button`, `button-group`, `input`, `input-group`, `input-otp`, `textarea`, `select`, `native-select`, `checkbox`, `radio-group`, `switch`, `slider`, `form`, `field`, `label`, `calendar`

### Layout & Structure
`card`, `separator`, `resizable`, `tabs`, `accordion`, `collapsible`, `aspect-ratio`, `scroll-area`

### Overlays & Modals
`dialog`, `sheet`, `drawer`, `popover`, `tooltip`, `hover-card`, `dropdown-menu`, `context-menu`, `menubar`, `alert-dialog`

### Data Display
`table`, `avatar`, `badge`, `chart`, `progress`, `skeleton`, `timeline`, `empty`

### Navigation
`sidebar`, `navigation-menu`, `breadcrumb`, `pagination`, `command`

### Feedback
`alert`, `sonner`, `toast`, `spinner`

### Advanced
`kanban`, `carousel`, `toggle`, `toggle-group`, `kbd`, `reel`, `item`

---

## Template Reference (DO NOT DELETE)

The `app/dashboard/` folder contains pre-built examples:

### Dashboard Examples
- `reference/default/` - Classic admin dashboard
- `reference/ecommerce/` - E-commerce dashboard
- `reference/crm/` - CRM dashboard
- `reference/hotel/` - Hotel management (great for property!)
- `reference/finance/` - Financial analytics
- `reference/project-management/` - Project tracking
- `reference/file-manager/` - File management

### App Examples
- `reference/apps/kanban/` - Kanban board
- `reference/apps/chat/` - Chat application
- `reference/apps/calendar/` - Calendar app
- `reference/apps/ai-chat/` - AI chat interface

### Page Examples
- `reference/pages/settings/` - Settings (profile, account, billing)
- `reference/pages/users/` - Users list & management
- `reference/pages/products/` - Product CRUD
- `reference/pages/pricing/` - Pricing pages

> **Usage**: Copy patterns from reference, adapt for Zam-Property needs.

---

## Environment Setup

```bash
# Prerequisites
Node.js 20+, pnpm

# Install dependencies
pnpm install

# Environment variables (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
NEXT_PUBLIC_WS_URL="ws://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3002"
NEXT_PUBLIC_DEFAULT_TENANT="demo"

# Development
pnpm dev                    # Start dev server (port 3002)
pnpm build                  # Production build
pnpm lint                   # ESLint check
```

---

## Common Patterns

### Creating a New Page
```tsx
// app/tenant/listings/page.tsx
import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Listings - Zam Property",
    description: "Manage your property listings",
    canonical: "/tenant/listings"
  });
}

export default function ListingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Listings</h1>
      {/* Content */}
    </div>
  );
}
```

### Using Toast Notifications
```tsx
import { toast } from "sonner";

toast.success("Listing published!");
toast.error("Failed to save changes");
toast.loading("Uploading images...");
```

### Using Cards
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Property Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

## What NOT To Do

- ❌ Use `useState` for server data (use TanStack Query)
- ❌ Call APIs directly in components (use hooks)
- ❌ Hardcode tenant IDs or vertical types
- ❌ Put business logic in components (use hooks/utils)
- ❌ Skip loading/error states
- ❌ Forget `Suspense` boundaries for async components
- ❌ Use `any` type
- ❌ Skip form validation
- ❌ Bypass route guards
- ❌ **Hardcode DEV_BYPASS flags** (always use env variables!)
- ❌ Delete or modify `app/dashboard/` reference folder

---

## Common AI Mistakes to Avoid

- ❌ Forgetting `'use client'` on interactive components
- ❌ Using wrong query key structure
- ❌ Not invalidating queries after mutations
- ❌ Missing error boundaries
- ❌ Forgetting tenant context in API calls
- ❌ Using PascalCase for file names (use kebab-case)
- ❌ Not matching backend enum values exactly
- ❌ Skipping accessibility attributes (aria-*)
- ❌ Hardcoding `const DEV_BYPASS = true` instead of reading from env

---

## Domain Modules Reference

### Core (`lib/`)
| Domain | Folder | Reference |
|--------|--------|-----------|
| API Client | `lib/api/` | part-3.md |
| Auth Utilities | `lib/auth/` | part-4.md |
| WebSocket | `lib/websocket/` | part-22.md |
| Utils | `lib/utils.ts` | part-0.md |

### Modules (`modules/`)
| Domain | Folder | Reference |
|--------|--------|-----------|
| Auth & Session | `modules/auth/` | part-4.md |
| Listings | `modules/listing/` | part-8.md |
| Vendors | `modules/vendor/` | part-9.md |
| Tenants | `modules/tenant/` | part-9.md |
| Interactions | `modules/interaction/` | part-10.md |
| Reviews | `modules/review/` | part-11.md |
| Subscriptions | `modules/subscription/` | part-12.md |
| Analytics | `modules/analytics/` | part-13.md |
| Notifications | `modules/notification/` | part-15.md |
| Search | `modules/search/` | part-16.md, part-25.md |
| Audit | `modules/audit/` | part-14.md |
| Account | `modules/account/` | part-4.md |
| **PM: Occupant** | `modules/occupant/` | part-27.md |
| **PM: Contract** | `modules/contract/` | part-28.md |
| **PM: Deposit** | `modules/deposit/` | part-28.md |
| **PM: Billing** | `modules/billing/` | part-29.md |
| **PM: Rent Payment** | `modules/rent-payment/` | part-29.md |
| **PM: Payout** | `modules/payout/` | part-30.md |
| **PM: Maintenance** | `modules/maintenance/` | part-31.md |
| **PM: Inspection** | `modules/inspection/` | part-31.md |
| **PM: Claim** | `modules/claim/` | part-32.md |
| **PM: Company** | `modules/company/` | part-32.md |
| **PM: Agent** | `modules/agent/` | part-32.md |
| **PM: Affiliate** | `modules/affiliate/` | part-32.md |
| **PM: Legal Case** | `modules/legal-case/` | part-33.md |

### Verticals (`verticals/`)
| Domain | Folder | Reference |
|--------|--------|-----------|
| Vertical Registry | `verticals/registry/` | part-7.md |
| Real Estate | `verticals/real-estate/` | part-24.md |

---

## Documentation Requirements (MANDATORY)

After implementing ANY feature:
1. Update `docs/PROGRESS.md` - Mark session completed
2. Update `docs/NAV-STRUCTURE.md` - If navigation changed
3. Update `docs/API-REGISTRY.md` - For new API hooks

---

## Sanity Check (MANDATORY)

Run before marking session complete:

```bash
# All checks must pass
pnpm lint && pnpm build
```

---

## Reference Documentation

### 📚 Priority Order (Always Check)
1. **[master-prompt.md](../docs/ai-prompt/master-prompt.md)** - Master Project Brief *(READ FIRST)*
2. **[part-0.md](../docs/ai-prompt/part-0.md)** - Global Rules & Standards *(READ FIRST)*

### 🔧 Task-Specific References
| Task | Reference Doc |
|------|---------------|
| Project brief & dashboard scope | part-1.md |
| Architecture & routing | part-2.md |
| API client & queries | part-3.md |
| Auth, session & route guards | part-4.md |
| UI composition & layouts | part-5.md |
| Domain module patterns | part-6.md |
| Vertical UI plugin system | part-7.md |
| Listings module | part-8.md |
| Tenants & vendors module | part-9.md |
| Interactions module | part-10.md |
| Reviews & ratings module | part-11.md |
| Subscriptions & plans UI | part-12.md |
| Analytics dashboards | part-13.md |
| Audit logs & feature flags | part-14.md |
| Notifications & activity feeds | part-15.md |
| Search UI & filters | part-16.md |
| Performance & SSR/CSR | part-17.md |
| Testing strategy | part-18.md |
| Environment & deployment | part-19.md |
| Final checklist | part-20.md |
| Accessibility (a11y) | part-21.md |
| WebSocket integration | part-22.md |
| Backend alignment | part-23.md |
| Real estate vertical | part-24.md |
| Global search & discovery | part-25.md |
| Occupant portal & tenancy UI | part-27.md |
| Contracts, deposits & e-sign | part-28.md |
| Billing, payments & receipts | part-29.md |
| Owner dashboard & payouts | part-30.md |
| Maintenance & inspections | part-31.md |
| Claims, companies, agents, affiliates | part-32.md |
| Legal cases & platform admin PM | part-33.md |

### ⚠️ Conflict Resolution
If any instruction conflicts with master-prompt.md or part-0.md, **master-prompt.md and part-0.md ALWAYS take priority**.

---

## Backend Connection

```
Backend API: http://localhost:3000/api/v1
Swagger Docs: http://localhost:3000/api/docs

Services:
- PostgreSQL: localhost:5433
- Redis: localhost:6380
- OpenSearch: localhost:9200
- MinIO: localhost:9002
```

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | superadmin@demo.local | Password123! |
| TENANT_ADMIN | admin@demo.local | Password123! |
| CUSTOMER | customer@demo.local | Password123! |
