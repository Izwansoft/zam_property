# ZAM-PROPERTY BACKEND - AI Coding Agent Instructions

> ⚠️ **ALWAYS READ FIRST**: Before any task, review [part-0.md](docs/ai-prompt/part-0.md) and [master-prompt.md](docs/ai-prompt/master-prompt.md). These are NON-NEGOTIABLE and override any conflicting instructions.

## Project Overview
**Zam-Property** is a **vertical-agnostic, multi-tenant marketplace platform** designed for property and classified listings. Built as a **modular monolith** with pluggable vertical modules.

## Quick Reference for AI Agents

### Multi-Tenant Architecture
```
Platform
├─ Tenant A (Marketplace) ──→ Vendor A1, A2, A3...
├─ Tenant B (Enterprise) ──→ Vendor B1, B2...
└─ Tenant C (White-label) ──→ Vendor C1, C2...
```
- Each tenant is a **separate marketplace** with complete data isolation
- Tenants NEVER share data (no cross-tenant access)
- Each tenant can have multiple vendors (sellers)
- Ownership chain: **Tenant → Vendor → Listing**

### Naming Conventions (MANDATORY)
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `create-listing.dto.ts` |
| Classes | PascalCase | `ListingService`, `CreateListingDto` |
| Variables | camelCase | `listingId`, `isActive` |
| DB Tables | snake_case | `listings`, `vendor_profiles` |
| DB Columns | snake_case | `tenant_id`, `created_at` |
| API URLs | kebab-case | `/api/v1/vendor-profiles` |
| Constants | SCREAMING_SNAKE | `MAX_PAGE_SIZE` |
| Enums | SCREAMING_SNAKE | `ListingStatus.PUBLISHED` |

### File Suffixes
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts` (create-*, update-*, *-response, *-query)
- Guards: `*.guard.ts`
- Modules: `*.module.ts`

### Standard Columns (All Operational Tables)
```
id, tenant_id, created_at, updated_at, created_by, updated_by
```

### Permission Format
```
<resource>:<action>
Examples: listing:create, vendor:approve, report:export
```

### HTTP Status Codes
- 200: GET/PUT/PATCH success
- 201: POST created
- 204: DELETE success
- 400: Validation error (VAL_*)
- 401: Not authenticated (AUTH_*)
- 403: No permission (AUTHZ_*)
- 404: Not found (*_NOT_FOUND)
- 409: Conflict (*_CONFLICT)
- 422: Business rule violation (BIZ_*)

## Tech Stack (LOCKED)
- **Framework:** NestJS v10+ (TypeScript strict mode)
- **Architecture:** Modular Monolith (Domain-Driven)
- **ORM:** Prisma v5+ with PostgreSQL 15+
- **API Style:** REST with OpenAPI/Swagger
- **Auth:** JWT with @nestjs/passport
- **Real-time:** Socket.IO with Redis adapter
- **Background Jobs:** BullMQ v5+ with Redis 7+
- **Search:** OpenSearch 2.x for global search
- **Caching:** Redis 7+ with multi-tier strategy
- **Storage:** S3-compatible (presigned URLs)
- **Package Manager:** pnpm

## Multi-Tenant Model (CRITICAL)
```
Tenant (Marketplace) → Vendor (Seller) → Listing/Interaction
```
- **Every operational table** MUST have `tenant_id`
- Vendor-owned tables also have `vendor_id`
- **NEVER** accept `tenant_id` from request body - resolve from JWT/subdomain
- **Cross-tenant access is FORBIDDEN** - tenants are completely isolated
- Each tenant can configure their own branding, domains, settings

### Role Hierarchy (6 Roles)
| Scope | Role | Purpose |
|-------|------|---------|
| PLATFORM | `SUPER_ADMIN` | Platform-wide management |
| TENANT | `TENANT_ADMIN` | Full tenant administration |
| VENDOR | `VENDOR_ADMIN` | Vendor owner, full vendor access |
| VENDOR | `VENDOR_STAFF` | Limited vendor operations |
| CUSTOMER | `CUSTOMER` | Browse, inquire, review |
| PUBLIC | `GUEST` | Browse only, no write |

## Folder Structure
```
/
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── core/               # Platform spine (auth, tenant, config)
│   ├── infrastructure/     # Technical adapters (db, redis, queue, search)
│   ├── modules/            # Domain modules
│   │   ├── listing/        # Listing engine
│   │   ├── vendor/         # Vendor management
│   │   ├── interaction/    # Leads, inquiries
│   │   ├── media/          # Media management
│   │   ├── review/         # Reviews & ratings
│   │   └── subscription/   # Plans & billing
│   ├── verticals/          # Pluggable vertical modules
│   │   └── real-estate/    # Real estate vertical
│   ├── shared/             # Pure utilities, constants, types
│   ├── config/             # Typed configuration
│   ├── app.module.ts
│   └── main.ts
├── test/                   # E2E tests
└── docker/                 # Docker configurations
```

## Domain Module Pattern
Each domain follows this structure:
```
<domain>/
├─ <domain>.module.ts
├─ <domain>.controller.ts    # HTTP layer ONLY
├─ <domain>.service.ts       # Business logic ONLY
├─ repositories/             # Database access via Prisma
├─ dto/                      # Input/output validation
├─ events/                   # Domain events
└─ types/                    # Domain types
```

## Key Architectural Rules
1. **Backend-first, API-first** - All business rules live in backend
2. **Domain isolation** - Domains MUST NOT directly access other domains' tables
3. **Repository pattern** - All repos enforce tenant isolation
4. **Guard-based RBAC** - Use `@Roles()` and `@RequirePermission()` decorators
5. **Event-driven** - Use domain events for cross-domain communication
6. **Async indexing** - Search index updates via BullMQ, not synchronous

## Status Enums (LOCKED)
```typescript
// Tenant
TenantStatus = ACTIVE | SUSPENDED | DEACTIVATED

// User
UserStatus = ACTIVE | SUSPENDED | DEACTIVATED

// Vendor
VendorStatus = PENDING | APPROVED | REJECTED | SUSPENDED

// Listing
ListingStatus = DRAFT | PUBLISHED | EXPIRED | ARCHIVED

// Interaction
InteractionStatus = NEW | CONTACTED | CONFIRMED | CLOSED | INVALID

// Review
ReviewStatus = PENDING | APPROVED | REJECTED | FLAGGED
```

## API Documentation Requirements (MANDATORY)
After implementing ANY endpoint:
1. Update `docs/API-REGISTRY.md` with:
   - Endpoint URL and method
   - ALL parameters (path, query, body) with exact types
   - Request/response examples
   - Required permission
2. Follow these conventions STRICTLY:
   - URL paths: `kebab-case` → `/vendor-profiles`
   - Query params: `camelCase` → `?pageSize=20`
   - Request/Response body: `camelCase` → `{ "vendorId": "uuid" }`
   - Enums: `SCREAMING_SNAKE` → `"status": "PUBLISHED"`
   - Dates: ISO 8601 → `"2025-01-01T00:00:00Z"`
3. **Cross-validate Swagger and API Registry (MANDATORY)**:
   - After implementing endpoints, verify Swagger UI at `/api/docs` shows correct info
   - Ensure `docs/API-REGISTRY.md` matches exactly what Swagger displays
   - Check: endpoint paths, HTTP methods, request/response schemas, auth requirements
   - If discrepancy found, fix both the code decorators AND the API-REGISTRY.md
   - Run the server and visually confirm Swagger matches documentation

## Progress Tracking (MANDATORY)
After completing ANY session:
1. Update `docs/PROGRESS.md`:
   - Mark session checkbox `[x]`
   - Check off deliverables
   - Record completion date
   - Add relevant notes

## What NOT To Do
- ❌ Hardcode tenant IDs
- ❌ Bypass RBAC or permission guards
- ❌ Put business logic in controllers
- ❌ Create cross-domain database joins
- ❌ Allow cross-tenant writes
- ❌ Perform synchronous search indexing in request path
- ❌ Store sensitive data without encryption
- ❌ Skip audit logging for critical operations
- ❌ Accept tenant_id from request body

## Common AI Mistakes to Avoid
- ❌ Forgetting `tenant_id` on new tables
- ❌ Creating entities without `created_at`, `updated_at`
- ❌ Using camelCase for database columns (use snake_case)
- ❌ Returning Prisma models directly (use Response DTOs)
- ❌ Importing one domain module into another directly
- ❌ Skipping `@RequirePermission()` decorator on protected endpoints
- ❌ Using raw SQL without Prisma parameterization
- ❌ Creating circular dependencies between modules

## Domain List

### Core (`src/core/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 1 | Auth & Session | `core/auth/` | part-4.md |
| 2 | Tenant Management | `core/tenant/` | part-5.md |
| 3 | User Management | `core/user/` | part-4.md, part-5.md |
| 4 | Configuration | `core/config/` | part-3.md, part-25.md |

### Infrastructure (`src/infrastructure/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 5 | Database (Prisma) | `infrastructure/database/` | part-27.md |
| 6 | Redis Cache | `infrastructure/redis/` | part-32.md |
| 7 | Queue (BullMQ) | `infrastructure/queue/` | part-31.md |
| 8 | Search (OpenSearch) | `infrastructure/search/` | part-34.md |
| 9 | Storage (S3) | `infrastructure/storage/` | part-10.md |
| 10 | WebSocket | `infrastructure/websocket/` | part-33.md |

### Domain Modules (`src/modules/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 11 | Listing Engine | `modules/listing/` | part-6.md, part-7.md |
| 12 | Vendor Management | `modules/vendor/` | part-5.md |
| 13 | Interaction (Leads) | `modules/interaction/` | part-11.md |
| 14 | Media Management | `modules/media/` | part-10.md |
| 15 | Review & Ratings | `modules/review/` | part-12.md |
| 16 | Subscription & Billing | `modules/subscription/` | part-16.md, part-17.md, part-18.md |
| 17 | Notification | `modules/notification/` | part-13.md |
| 18 | Billing & Payments | `modules/billing/` | part-19.md, part-20.md |
| 19 | Analytics | `modules/analytics/` | part-21.md |
| 20 | Admin | `modules/admin/` | part-23.md |
| 21 | Audit | `modules/audit/` | part-22.md |

### Verticals (`src/verticals/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 22 | Real Estate | `verticals/real-estate/` | part-29.md |

### Core Infrastructure (`src/core/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 23 | Feature Flags | `core/feature-flags/` | part-24.md |
| 24 | Events | `core/events/` | part-28.md |
| 25 | Workflow/State Machines | `core/workflow/` | part-14.md |

## Environment Setup
```bash
# Prerequisites
Node.js 20+, PostgreSQL 15+, Redis 7+, pnpm

# Install dependencies
pnpm install

# Environment variables (create .env from .env.example)
DATABASE_URL="postgresql://postgres:password@localhost:5432/zam_property?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Database setup
pnpm prisma generate          # Generate Prisma client
pnpm prisma migrate dev       # Run migrations (dev)
pnpm prisma db seed           # Seed reference data
```

## Development Commands
```bash
pnpm start:dev               # Start with hot-reload
pnpm build                   # Production build
pnpm start:prod              # Run production build
pnpm lint                    # ESLint check
pnpm format                  # Prettier format
pnpm typecheck               # TypeScript check
```

## Testing Strategy
```bash
pnpm test                    # Unit tests
pnpm test:e2e                # E2E tests
pnpm test:cov                # Coverage report
```

## 🧪 TESTING REQUIREMENTS (MANDATORY)

Every feature/module MUST include tests before marking session complete.

### Unit Tests (Required)
For each service/module, test:
- ✅ Happy path - main functionality works
- ✅ Validation - invalid inputs rejected
- ✅ Authorization - user cannot access other user's data
- ✅ Tenant isolation - cross-tenant access forbidden
- ✅ State transitions - status changes follow rules
- ✅ Edge cases - null, empty, boundary values

### E2E Tests (Required)
For each endpoint, test:
- ✅ Authentication - unauthenticated requests rejected
- ✅ Authorization - wrong role gets 403
- ✅ CRUD operations - create, read, update, delete work
- ✅ Validation - invalid payloads return 400
- ✅ Not found - missing resources return 404
- ✅ Tenant isolation - cannot access other tenant's data

### Example Test Structure
```typescript
// Unit test example
describe('ListingService', () => {
  it('should create listing with valid data', async () => {});
  it('should reject listing without title', async () => {});
  it('should not allow vendor to access other vendor listing', async () => {});
  it('should enforce tenant isolation', async () => {});
});

// E2E test example
describe('Listings (e2e)', () => {
  it('POST /listings creates listing', async () => {});
  it('GET /listings/:id returns listing', async () => {});
  it('GET /listings/:id returns 403 for other vendor', async () => {});
  it('GET /listings/:id returns 404 for non-existent', async () => {});
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

# 6. Database - Migrations must apply cleanly
pnpm prisma migrate dev

# 7. Prisma client - Must generate without errors
pnpm prisma generate
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
| Project brief & vision | part-1.md |
| System architecture | part-2.md |
| Repository structure & tooling | part-3.md |
| Core platform domains | part-4.md |
| Tenant & multi-tenancy | part-5.md |
| Listing engine | part-6.md |
| Attribute engine & validation | part-7.md |
| Vertical module contract | part-8.md |
| Search architecture | part-9.md |
| Media & CDN | part-10.md |
| Leads, enquiries & booking | part-11.md |
| Reviews & ratings | part-12.md |
| Notifications | part-13.md |
| Workflows & state machines | part-14.md |
| API design & error handling | part-15.md |
| Subscriptions & plans | part-16.md |
| Entitlements & enforcement | part-17.md |
| Usage tracking & quota | part-18.md |
| Billing & payments | part-19.md |
| Pricing models | part-20.md |
| Analytics & reporting | part-21.md |
| Audit logs & compliance | part-22.md |
| Admin & backoffice | part-23.md |
| Feature flags & experiments | part-24.md |
| Infrastructure & deployment | part-25.md |
| Testing strategy | part-26.md |
| Database schema | part-27.md |
| Event catalog | part-28.md |
| Real estate vertical | part-29.md |
| API endpoints | part-30.md |
| Background jobs | part-31.md |
| Caching strategy | part-32.md |
| WebSocket strategy | part-33.md |
| OpenSearch & search | part-34.md |

### ⚠️ Conflict Resolution
If any instruction conflicts with master-prompt.md or part-0.md, **master-prompt.md and part-0.md ALWAYS take priority**.
