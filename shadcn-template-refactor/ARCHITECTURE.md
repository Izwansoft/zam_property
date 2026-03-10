# Zam-Property Web — Architecture Guide

> Short reference for developers joining the project.

---

## 1. Folder Boundaries

```
shadcn-template-refactor/
├── app/             # Next.js App Router — route definitions only
│                    # ⚠️ NEVER call lib/api/* from here (except SSR in (public)/)
├── components/      # Shared UI primitives (shadcn/ui, forms, layout)
│                    # No domain logic — presentational only
├── config/          # Navigation config, route mappings
├── hooks/           # Global React hooks (toast, mobile, file-upload)
├── lib/             # Core infrastructure (no domain logic)
│   ├── api/         # Axios client, response types, public-api (SSR)
│   ├── auth/        # Token store, route config, auth helpers
│   ├── config/      # Zod-validated environment config
│   ├── errors/      # Error normalisation (API → UI)
│   ├── mocks/       # MSW handlers for dev/test
│   ├── performance/ # Web Vitals, LazyImage, VirtualList
│   ├── query/       # TanStack Query client, key factory, hooks
│   ├── websocket/   # Socket.IO client + hooks
│   └── accessibility/ # Skip links, focus trap, keyboard nav, ARIA utils
├── modules/         # Domain modules (one per bounded context)
│   ├── auth/        # Login, register, guards, permissions
│   ├── listing/     # CRUD, forms, detail, status management
│   ├── vendor/      # Onboarding, profile, settings
│   ├── tenant/      # Tenant context, CRUD, settings
│   ├── account/     # Customer profile, settings
│   ├── admin/       # Platform admin: tenants, users, jobs
│   ├── analytics/   # Dashboard stats, charts
│   ├── audit/       # Audit trail viewer
│   ├── feature-flags/ # Feature flags + experiments
│   ├── interaction/ # Inquiries, saved listings
│   ├── jobs/        # Background job monitoring
│   ├── media/       # Upload, gallery, management
│   ├── notification/# Real-time + preference management
│   ├── pricing/     # Rules, calculator, config
│   ├── review/      # Review CRUD, moderation
│   ├── search/      # Full-text search, filters
│   ├── subscription/# Plans, checkout, billing
│   └── activity/    # Activity feed
├── verticals/       # Pluggable vertical system
│   ├── registry/    # Central registry (maps vertical slug → config)
│   ├── types/       # Shared interfaces (VerticalConfig, FieldDef)
│   ├── real-estate/ # Concrete vertical: fields, filters, renderers
│   ├── attribute-renderer/ # Generic attribute display
│   └── filter-builder/    # Dynamic filter generation from schema
└── test/            # Test setup, factories, providers
```

### Import Rules (5 Boundary Rules)

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **`app/*` never calls `lib/api/*` directly** | Pages compose module hooks; only `(public)/` SSR is an exception |
| 2 | **Only `modules/*` calls `lib/api/*`** | API calls are encapsulated in module hooks. `hooks/use-api-query.ts` and `hooks/use-api-mutation.ts` are infrastructure wrappers (allowed) |
| 3 | **No cross-module deep imports** | Import from barrel `@/modules/foo`, never `@/modules/foo/hooks/bar` |
| 4 | **`verticals/*` never fetch domain data** | Verticals define schemas; modules fetch data and pass it to vertical renderers |
| 5 | **Core listing UI never hardcodes vertical fields** | Use `ListingAttributeSummary` or vertical registry hints instead of field-specific rendering |

---

## 2. Vertical Schema-Driven System

The vertical system allows the platform to support multiple marketplace types (real-estate, automotive, services, etc.) without changing core listing code.

### How It Works

```
┌──────────────────┐     registers      ┌──────────────────┐
│ real-estate/     │ ─────────────────▶ │ registry/        │
│   fields.ts      │                    │   vertical-      │
│   filters.ts     │                    │   registry.ts    │
│   renderers.tsx  │                    └────────┬─────────┘
└──────────────────┘                             │
                                         resolves config
                                                 │
                              ┌──────────────────▼──────────────┐
                              │ modules/listing/                 │
                              │   listing-form/ (dynamic steps)  │
                              │   listing-card.tsx (generic)     │
                              │   listing-info.tsx (generic)     │
                              └──────────────────────────────────┘
```

1. **Vertical config** defines fields, filters, validation schemas, and display hints
2. **Registry** maps vertical slugs (e.g., `real-estate`) to their config
3. **Listing module** fetches data and delegates field rendering to vertical renderers
4. **Filter builder** generates dynamic filter UIs from vertical field definitions
5. **Attribute renderer** displays listing attributes generically using schema hints

### Adding a New Vertical

1. Create `verticals/<slug>/` with `fields.ts`, `filters.ts`, `renderers.tsx`
2. Register in `verticals/registry/vertical-registry.ts`
3. No changes needed to core listing, search, or filter modules

---

## 3. Key Conventions

### Query Keys

All TanStack Query keys are generated via factory functions in `lib/query/query-keys.ts`:

```typescript
import { queryKeys } from '@/lib/query/query-keys';

// Usage
queryKeys.listings.list({ page: 1, status: 'active' })
// → ['listings', 'list', { page: 1, status: 'active' }]

queryKeys.listings.detail('abc-123')
// → ['listings', 'detail', 'abc-123']
```

Pattern: `queryKeys.<domain>.<operation>(...args)` → deterministic array keys.

### Filter System

Filters follow a URL-first pattern using query strings:

1. **Schema** defines available filters per vertical (field name, type, operators)
2. **`filter-builder`** generates UI controls from schema
3. **Query string** is the source of truth — filters serialize to/from URL params
4. **Hooks** read query params and pass them to API calls

### Forms

All forms use **React Hook Form + Zod**:

```typescript
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { ... },
});
```

Multi-step forms use `FormProvider` + `useFormContext` in child steps.
The `FormWrapper` component in `components/forms/` enforces this pattern.

### Auth & RBAC

Two-layer route protection:
1. **Edge proxy** (`proxy.ts`) — validates JWT at the edge, redirects unauthorized
2. **Client guards** (`ProtectedRoute`) — role-based rendering gates per portal layout

Roles: `SUPER_ADMIN`, `TENANT_ADMIN`, `VENDOR_ADMIN`, `VENDOR_STAFF`, `CUSTOMER`

### Portal Routes

| Portal | Path Prefix | Roles |
|--------|-------------|-------|
| Platform Admin | `/dashboard/platform/` | `SUPER_ADMIN` |
| Tenant Admin | `/dashboard/tenant/` | `SUPER_ADMIN`, `TENANT_ADMIN` |
| Vendor | `/dashboard/vendor/` | `VENDOR_ADMIN`, `VENDOR_STAFF` |
| Customer | `/dashboard/account/` | Any authenticated |
| Public | `/` (root) | No auth required |
| Auth | `/login`, `/register`, `/forgot-password` | Guest only |

---

## 4. State Management

| Concern | Solution |
|---------|----------|
| Server state | TanStack Query v5 (`useQuery`, `useMutation`, `useInfiniteQuery`) |
| Client state | Zustand stores (auth, tenant context, UI preferences) |
| Form state | React Hook Form + Zod validation |
| URL state | Next.js `useSearchParams` + custom sync hooks |
| Real-time | Socket.IO via `lib/websocket/` |

---

## 5. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript 5.9 (strict) |
| Styling | Tailwind CSS v4 |
| UI Library | shadcn/ui (58+ components) |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library + Playwright |
| API Client | Axios (via `lib/api/client.ts`) |
| Real-time | Socket.IO |
| Accessibility | Custom a11y layer (skip links, focus trap, ARIA, keyboard nav) |
