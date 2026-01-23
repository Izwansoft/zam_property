# ZAM-PROPERTY WEB FRONTEND - AI Coding Agent Instructions

> ⚠️ **ALWAYS READ FIRST**: Before any task, review [part-0.md](docs/ai-prompt/part-0.md) and [master-prompt.md](docs/ai-prompt/master-prompt.md). These are NON-NEGOTIABLE and override any conflicting instructions.

## Project Overview
**Zam-Property Web Frontend** is a **multi-tenant, multi-vertical marketplace dashboard** built with Next.js App Router. Designed for Platform Admins, Tenant Admins, and Vendors to manage listings, interactions, and analytics.

## Quick Reference for AI Agents

### Portal Architecture (3 Portals)
```
/platform/*    → Platform Admin (SUPER_ADMIN only)
/tenant/*      → Tenant Admin Portal (TENANT_ADMIN)
/vendor/*      → Vendor Portal (VENDOR_ADMIN, VENDOR_STAFF)
```
- Each portal has its own layout, navigation, and route guards
- Public pages live at root level (`/`, `/search`, `/listing/[slug]`)
- All authenticated routes require JWT token

### Naming Conventions (MANDATORY)
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

### File Suffixes & Naming
- Components: `*.tsx` (PascalCase)
- Hooks: `use-*.ts` → exports `useXxx`
- Types: `*.types.ts`
- Utils: `*.utils.ts`
- Constants: `*.constants.ts`
- API hooks: `use-*-api.ts` or `use-*-query.ts`

### Component File Structure
```typescript
// 1. Imports (React, libs, local)
// 2. Types/Interfaces
// 3. Component
// 4. Export
```

## Tech Stack (LOCKED)
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v3+
- **UI Components:** shadcn/ui (Radix primitives)
- **State Management:** 
  - Server: TanStack Query v5+
  - Client: Zustand (minimal)
- **Forms:** React Hook Form + Zod
- **API Client:** Generated from OpenAPI (orval/openapi-typescript)
- **Real-time:** Socket.IO client
- **Package Manager:** pnpm

## Folder Structure
```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public pages (home, search, listing)
│   │   ├── (auth)/             # Auth pages (login, register)
│   │   ├── platform/           # Platform Admin portal
│   │   ├── tenant/             # Tenant Admin portal
│   │   ├── vendor/             # Vendor portal
│   │   ├── layout.tsx          # Root layout
│   │   └── providers.tsx       # Global providers
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── common/             # Shared components
│   │   ├── layouts/            # Shell layouts per portal
│   │   └── forms/              # Form components
│   ├── modules/                # Domain modules
│   │   ├── auth/               # Auth hooks, context
│   │   ├── listing/            # Listing hooks, components
│   │   ├── vendor/             # Vendor hooks, components
│   │   ├── interaction/        # Leads/inquiries
│   │   ├── review/             # Reviews & ratings
│   │   ├── subscription/       # Plans & billing
│   │   ├── notification/       # Notifications
│   │   ├── analytics/          # Analytics hooks
│   │   └── search/             # Search & filters
│   ├── verticals/              # Vertical-specific UI
│   │   └── real-estate/        # Real estate forms, filters
│   ├── lib/                    # Core utilities
│   │   ├── api/                # API client, hooks
│   │   ├── auth/               # Auth utilities
│   │   ├── websocket/          # Socket.IO client
│   │   └── utils/              # Pure utilities
│   ├── hooks/                  # Shared hooks
│   ├── types/                  # Global types
│   ├── constants/              # Global constants
│   └── styles/                 # Global styles
├── public/                     # Static assets
└── tests/                      # Test files
```

## Module Pattern (MANDATORY)
Each domain module follows this structure:
```
modules/<domain>/
├── hooks/
│   ├── use-<domain>.ts         # Main query hook
│   ├── use-<domain>-mutations.ts
│   └── use-<domain>-filters.ts
├── components/
│   ├── <domain>-list.tsx
│   ├── <domain>-card.tsx
│   ├── <domain>-form.tsx
│   └── <domain>-detail.tsx
├── types/
│   └── <domain>.types.ts
├── utils/
│   └── <domain>.utils.ts
└── index.ts                    # Public exports
```

## Key Architectural Rules
1. **Server Components by default** - Only use `'use client'` when needed
2. **TanStack Query for ALL API calls** - No raw fetch in components
3. **Zod for ALL form validation** - Schemas match backend DTOs
4. **Route guards via middleware** - Check role before rendering
5. **Tenant context from subdomain/header** - Never hardcode
6. **Vertical-agnostic core** - Use schema registry for attributes
7. **Optimistic updates** - For better UX on mutations

## Role Hierarchy (6 Roles)
| Scope | Role | Portal Access |
|-------|------|---------------|
| PLATFORM | `SUPER_ADMIN` | `/platform/*` |
| TENANT | `TENANT_ADMIN` | `/tenant/*` |
| VENDOR | `VENDOR_ADMIN` | `/vendor/*` |
| VENDOR | `VENDOR_STAFF` | `/vendor/*` (limited) |
| CUSTOMER | `CUSTOMER` | Public + profile |
| PUBLIC | `GUEST` | Public only |

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

## API Conventions (Must Match Backend)
| Type | Convention | Example |
|------|------------|---------|
| URL paths | kebab-case | `/api/v1/vendor-profiles` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| Request body | camelCase | `{ "vendorId": "uuid" }` |
| Response body | camelCase | `{ "createdAt": "..." }` |
| Enum values | SCREAMING_SNAKE | `"status": "PUBLISHED"` |
| Dates | ISO 8601 | `"2025-01-01T00:00:00Z"` |

## TanStack Query Keys Convention
```typescript
// Pattern: [resource, ...identifiers, ...filters]
['listings']                           // All listings
['listings', listingId]                // Single listing
['listings', { status: 'PUBLISHED' }]  // Filtered listings
['listings', 'infinite', filters]      // Infinite query
['vendors', vendorId, 'listings']      // Vendor's listings
```

## Documentation Requirements (MANDATORY)
After implementing ANY feature:
1. Update `docs/PROGRESS.md` - Mark session completed
2. Update `docs/NAV-STRUCTURE.md` - If navigation changed
3. Follow conventions in `docs/API-REGISTRY.md` for hooks

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

## Common AI Mistakes to Avoid
- ❌ Forgetting `'use client'` on interactive components
- ❌ Using wrong query key structure
- ❌ Not invalidating queries after mutations
- ❌ Missing error boundaries
- ❌ Forgetting tenant context in API calls
- ❌ Using PascalCase for file names (use kebab-case)
- ❌ Not matching backend enum values exactly
- ❌ Skipping accessibility attributes (aria-*)

## Domain Modules

### Core (`src/lib/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 1 | API Client | `lib/api/` | part-3.md |
| 2 | Auth Utilities | `lib/auth/` | part-4.md |
| 3 | WebSocket | `lib/websocket/` | part-22.md |
| 4 | Utils | `lib/utils/` | part-0.md |

### Modules (`src/modules/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 5 | Auth & Session | `modules/auth/` | part-4.md |
| 6 | Listings | `modules/listing/` | part-8.md |
| 7 | Vendors | `modules/vendor/` | part-9.md |
| 8 | Tenants | `modules/tenant/` | part-9.md |
| 9 | Interactions | `modules/interaction/` | part-10.md |
| 10 | Reviews | `modules/review/` | part-11.md |
| 11 | Subscriptions | `modules/subscription/` | part-12.md |
| 12 | Analytics | `modules/analytics/` | part-13.md |
| 13 | Notifications | `modules/notification/` | part-15.md |
| 14 | Search | `modules/search/` | part-16.md, part-25.md |
| 15 | Audit | `modules/audit/` | part-14.md |

### Verticals (`src/verticals/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 16 | Vertical Registry | `verticals/registry/` | part-7.md |
| 17 | Real Estate | `verticals/real-estate/` | part-24.md |

### Components (`src/components/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 18 | UI Primitives | `components/ui/` | part-5.md |
| 19 | Layouts | `components/layouts/` | part-5.md |
| 20 | Forms | `components/forms/` | part-6.md |

## Environment Setup
```bash
# Prerequisites
Node.js 20+, pnpm

# Install dependencies
pnpm install

# Environment variables (create .env.local from .env.example)
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Development
pnpm dev                    # Start dev server (port 3000)
pnpm build                  # Production build
pnpm start                  # Run production build
pnpm lint                   # ESLint check
pnpm typecheck              # TypeScript check
```

## Testing Strategy
```bash
pnpm test                   # Unit tests (Vitest)
pnpm test:e2e               # E2E tests (Playwright)
pnpm test:cov               # Coverage report
```

## 🧪 TESTING REQUIREMENTS (MANDATORY)

Every feature/module MUST include tests before marking session complete.

### Unit Tests (Required - Vitest)
For each component/hook, test:
- ✅ Renders correctly - component mounts without error
- ✅ User interactions - clicks, inputs work correctly
- ✅ Loading states - skeleton/spinner shown while loading
- ✅ Error states - error messages display correctly
- ✅ Empty states - empty list message shows
- ✅ Props variations - different props render correctly

### Hook Tests (Required)
For each custom hook, test:
- ✅ Query hooks - return correct data shape
- ✅ Mutation hooks - update cache correctly
- ✅ Loading/error states - isLoading, isError work
- ✅ Optimistic updates - UI updates before server response

### E2E Tests (Required - Playwright)
For each user flow, test:
- ✅ Authentication - login/logout works
- ✅ Navigation - routes accessible by correct roles
- ✅ Form submission - create/edit forms work
- ✅ List/detail - can view list and detail pages
- ✅ Error handling - API errors show user message
- ✅ Role guards - wrong role redirected correctly

### Example Test Structure
```typescript
// Component test example (Vitest + Testing Library)
describe('ListingCard', () => {
  it('should render listing title', () => {});
  it('should show loading skeleton while fetching', () => {});
  it('should display error message on failure', () => {});
  it('should navigate to detail on click', () => {});
});

// Hook test example
describe('useListings', () => {
  it('should return listings array', () => {});
  it('should handle loading state', () => {});
  it('should handle error state', () => {});
});

// E2E test example (Playwright)
test.describe('Listings', () => {
  test('should display listing list', async ({ page }) => {});
  test('should create new listing', async ({ page }) => {});
  test('should redirect unauthenticated user', async ({ page }) => {});
});
```

## ✅ SANITY CHECK (MANDATORY)

Run these commands BEFORE marking any session complete:

```bash
# 1. Linting - No errors allowed
pnpm lint

# 2. Type checking - No TypeScript errors
pnpm typecheck

# 3. Unit tests - All must pass
pnpm test

# 4. E2E tests - All must pass
pnpm test:e2e

# 5. Build - Must compile successfully
pnpm build
```

### Quick Sanity Command
```bash
# Run all checks in sequence
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

### If Any Check Fails
1. **DO NOT** proceed to next session
2. Fix the issue first
3. Re-run all sanity checks
4. Only mark session complete when ALL checks pass

## Reference Documentation

### 📚 Priority Order (Always Check)
1. **[master-prompt.md](docs/ai-prompt/master-prompt.md)** - Master Project Brief *(READ FIRST)*
2. **[part-0.md](docs/ai-prompt/part-0.md)** - Global Rules & Standards *(READ FIRST)*

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

### ⚠️ Conflict Resolution
If any instruction conflicts with master-prompt.md or part-0.md, **master-prompt.md and part-0.md ALWAYS take priority**.
