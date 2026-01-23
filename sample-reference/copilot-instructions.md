# TERRA IMS - AI Coding Agent Instructions

> ⚠️ **ALWAYS READ FIRST**: Before any task, review [part-0.md](docs/part-0.md) and [part-1.md](docs/part-1.md). These are NON-NEGOTIABLE and override any conflicting instructions.

## Project Overview
TERRA Integrated Management System (IMS) - an **enterprise-grade, multi-tenant SaaS platform** for business management. Designed to support **multiple industries** (agency, construction, professional services) with complete tenant isolation, AI-powered operations, and white-label capabilities.

## Quick Reference for AI Agents

### Multi-Tenant Architecture
```
Platform
├─ Account A (Business Group) ──→ Company A1, A2, A3...
├─ Account B (Enterprise) ──→ Company B1, B2...
└─ Partner C (Reseller) ──→ Managed Tenants C1, C2...
```
- Each account is a **separate business entity** with complete data isolation
- Accounts NEVER share data (no cross-account access)
- Each account can have multiple companies (subsidiaries)
- White-label and partner reselling supported

### Naming Conventions (MANDATORY)
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `create-client.dto.ts` |
| Classes | PascalCase | `ClientService`, `CreateClientDto` |
| Variables | camelCase | `clientId`, `isActive` |
| DB Tables | snake_case | `clients`, `project_phases` |
| DB Columns | snake_case | `tenant_id`, `created_at` |
| API URLs | kebab-case | `/api/v1/project-phases` |
| Constants | SCREAMING_SNAKE | `MAX_PAGE_SIZE` |
| Enums | PascalCase | `ClientStatus.Active` |

### File Suffixes
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts` (create-*, update-*, *-response, *-query)
- Guards: `*.guard.ts`
- Modules: `*.module.ts`

### Standard Columns (All Operational Tables)
```
id, tenant_id, company_id, created_at, updated_at, created_by, updated_by
```

### Permission Format
```
<resource>:<action>
Examples: client:create, project:approve, report:export
```

### HTTP Status Codes
- 200: GET/PUT/PATCH success
- 201: POST created
- 204: DELETE success
- 400: Validation error
- 401: Not authenticated
- 403: No permission
- 404: Not found
- 422: Business rule violation

## Tech Stack (LOCKED)
- **Framework:** NestJS v10+ (TypeScript strict mode)
- **Architecture:** Modular Monolith (Domain-Driven)
- **ORM:** Prisma v5+ with PostgreSQL 15+
- **API Style:** REST with Swagger/OpenAPI
- **Auth:** JWT with @nestjs/passport (SSO-ready)
- **Real-time:** WebSocket (Socket.io) with Redis adapter, SSE for AI streaming
- **Background Jobs:** BullMQ v4+ with Redis 7+
- **Search:** OpenSearch 2.x for global search
- **AI Integration:** Pluggable providers (OpenAI, Claude, Azure, Ollama) with pgvector for RAG
- **Caching:** Redis 7+ with @nestjs/cache-manager
- **Observability:** Prometheus metrics, Winston logging

## Multi-Tenant Model (CRITICAL)
```
Account (Business Group) → Company (Subsidiary) → Users/Data
```
- **Every operational table** MUST have `tenant_id` and `company_id`
- Account-level users have `company_id = NULL` (cross-company read access within account)
- Company users are **strictly scoped** to their company
- **NEVER** accept `tenant_id` or `company_id` from request body - resolve from JWT context
- **Cross-tenant access is FORBIDDEN** - tenants are completely isolated
- Each tenant can configure their own workflows, branding, integrations

## Folder Structure
```
/
├── prisma/                 # Single source of truth for DB schema
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── spine/              # Platform core (auth, tenant, billing, audit)
│   ├── infrastructure/     # Technical adapters (db, redis, queue, search)
│   ├── modules/            # Domain modules (hr, projects, billing, agency)
│   ├── shared/             # Pure utilities, constants, types
│   ├── config/             # Typed configuration
│   ├── app.module.ts
│   └── main.ts
├── test/                   # E2E tests
└── docker/                 # Docker configurations
```

## Domain Module Pattern
Each domain follows this structure (see `src/modules/<domain>/`):
```
<domain>/
├─ <domain>.module.ts
├─ <domain>.controller.ts    # HTTP layer ONLY
├─ <domain>.service.ts       # Business logic ONLY
├─ repositories/             # Database access via Prisma
├─ dto/                      # Input/output validation
└─ entities/                 # Types (Prisma models are in schema.prisma)
```

## Key Architectural Rules
1. **Backend-first, API-first** - All business rules live in backend, never trust frontend
2. **Domain isolation** - Domains MUST NOT directly access other domains' tables; use services
3. **Repository pattern** - All repos extend `BaseRepository` which enforces tenant isolation
4. **Guard-based RBAC** - Use `@RequirePermission("resource:action")` decorator on endpoints
5. **Event-driven** - Use domain events for cross-domain communication
6. **AI is advisory** - AI MUST NOT make autonomous decisions without human approval

## RBAC & Scope System
Scopes: `PLATFORM` (cross-tenant) | `ACCOUNT` (account HQ) | `COMPANY` (company-bound) | `SELF` (own data only)

### Core Roles (Expandable per Vertical)
| Scope | Role | Purpose |
|-------|------|---------|
| PLATFORM | `PLATFORM_ADMIN` | Manage tenants, platform-wide config |
| PLATFORM | `PARTNER_ADMIN` | Manage partner accounts, reseller operations |
| ACCOUNT | `ACCOUNT_OWNER` | Full account-wide access |
| ACCOUNT | `ACCOUNT_ADMIN` | Account administration |
| ACCOUNT | `ACCOUNT_VIEWER` | Read-only across account |
| COMPANY | `COMPANY_ADMIN` | Full company access |
| COMPANY | `HR_ADMIN` | HR operations |
| COMPANY | `FINANCE_ADMIN` | Billing, invoicing, payments |
| COMPANY | `PROJECT_MANAGER` | Projects, tasks, resources |
| COMPANY | `OPERATIONS_MANAGER` | Day-to-day operations |
| COMPANY | `SALES_MANAGER` | Clients, opportunities |
| SELF | `EMPLOYEE` | Own data, assigned tasks |
| SELF | `CLIENT_PORTAL` | Client self-service |

Permission format: `<resource>:<action>` (e.g., `client:create`, `project:approve`)

## Vertical Domains (Industry-Specific)
| Vertical | Folder | Purpose |
|----------|--------|---------|
| Agency | `horizontal/agency/` | Creative/marketing agency operations |
| Construction | `vertical/construction/` | Construction project management |
| Professional Services | `vertical/professional-services/` | Consulting, legal, accounting |

## Mandatory Patterns
- **Audit logging**: All create/update/delete/approve actions via centralized interceptor
- **Input validation**: All inputs via DTOs with class-validator
- **Error handling**: Generic user-facing errors, no internal details exposed
- **Swagger**: All endpoints documented with `@ApiTags`, `@ApiBearerAuth`, permission notes
- **API Registry**: All endpoints MUST be documented in `docs/API-REGISTRY.md`
- **Navigation Structure**: All domains MUST update `docs/NAV-STRUCTURE.md`
- **Progress Tracking**: Mark sessions complete in `PROGRESS.md` after each task

## API Documentation Requirements (MANDATORY)
After implementing ANY endpoint:
1. Update `docs/API-REGISTRY.md` with:
   - Endpoint URL and method
   - ALL parameters (path, query, body) with exact types
   - Request/response examples
   - Required permission
2. Follow these conventions STRICTLY:
   - URL paths: `kebab-case` → `/project-phases`
   - Query params: `camelCase` → `?pageSize=20`
   - Request/Response body: `camelCase` → `{ "fullName": "Ahmad" }`
   - Enums: `SCREAMING_SNAKE` → `"status": "ACTIVE"`
   - Dates: ISO 8601 → `"2025-01-01T00:00:00Z"`

## Frontend Preparation Requirements (MANDATORY)
After implementing ANY domain:
1. Update `docs/NAV-STRUCTURE.md` with:
   - Navigation items for each portal
   - Page routes and components
   - Reusable components needed
2. Follow these conventions:
   - Files: `kebab-case` → `client-card.tsx`
   - Components: `PascalCase` → `ClientCard`
   - Routes: `kebab-case` → `/project-phases`

## Progress Tracking (MANDATORY)
After completing ANY session:
1. Update `PROGRESS.md`:
   - Mark session checkbox `[x]`
   - Check off deliverables
   - Record completion date
   - Add relevant notes
2. Update API Registry Summary table
3. Update Navigation Structure Summary table

## What NOT To Do
- ❌ Hardcode tenant/company IDs
- ❌ Bypass RBAC or permission guards
- ❌ Put business logic in controllers
- ❌ Create cross-domain database joins
- ❌ Allow cross-company writes (unless explicitly approved)
- ❌ Pre-optimize or over-engineer infrastructure
- ❌ Invent requirements not in specifications
- ❌ Let AI make autonomous decisions without approval
- ❌ Store sensitive data without encryption
- ❌ Skip audit logging for critical operations

## Common AI Mistakes to Avoid
- ❌ Forgetting `tenant_id` and `company_id` on new tables
- ❌ Creating entities without `created_at`, `updated_at`, `created_by`, `updated_by`
- ❌ Using camelCase for database columns (use snake_case)
- ❌ Returning Prisma models directly (use Response DTOs)
- ❌ Importing one domain module into another
- ❌ Skipping `@RequirePermission()` decorator on protected endpoints
- ❌ Using raw SQL without Prisma parameterization
- ❌ Creating circular dependencies between modules
- ❌ Allowing AI to perform irreversible actions
- ❌ Skipping approval workflows for sensitive operations

## Domain List (Platform Spine + Domains)

### Platform Spine (`src/spine/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 1 | Multi-Tenancy & Auth | `spine/auth/`, `spine/tenant/` | part-3.md, part-3a.md |
| 2 | Module Registry | `spine/module-registry/` | part-4.md |
| 3 | Subscription & Billing | `spine/subscription/` | part-5.md |
| 4 | Audit Logging | `spine/audit/` | part-8.md |
| 5 | Feature Flags | `spine/feature-flag/` | part-4.md |
| 6 | Health & Readiness | `spine/health/` | part-12.md |

### Infrastructure (`src/infrastructure/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 7 | Database (Prisma) | `infrastructure/database/` | part-2.md |
| 8 | Redis Cache | `infrastructure/redis/` | part-2.md |
| 9 | Queue (BullMQ) | `infrastructure/queue/` | part-7.md |
| 10 | Search (OpenSearch) | `infrastructure/search/` | part-6.md |
| 11 | Mail | `infrastructure/mail/` | part-9.md |
| 12 | Storage | `infrastructure/storage/` | part-2.md |
| 13 | Metrics | `infrastructure/metrics/` | part-12.md |

### Domain Modules (`src/modules/`)
| # | Domain | Folder | Reference |
|---|--------|--------|-----------|
| 14 | HR Domain | `modules/hr/` | part-13.md |
| 15 | Projects Domain | `modules/projects/` | part-14.md |
| 16 | Billing/Invoicing | `modules/billing/` | part-15.md |
| 17 | Agency Domain | `modules/agency/` | part-16.md |
| 18 | Construction Vertical | `modules/construction/` | part-29.md |
| 19 | Reporting & Analytics | `modules/analytics/` | part-17.md |
| 20 | AI Services | `modules/ai/` | part-18.md |
| 21 | Notifications | `modules/notifications/` | part-9.md |
| 22 | Webhooks | `modules/webhooks/` | part-28.md |
| 23 | Automation | `modules/automation/` | part-22.md |

## Environment Setup
```bash
# Prerequisites
Node.js 18+, PostgreSQL 15+, Redis 7+, npm/pnpm

# Install dependencies
npm install

# Environment variables (create .env from .env.example)
DATABASE_URL="postgresql://postgres:password@localhost:5432/terra?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"

# Database setup
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations (dev)
npx prisma db seed           # Seed reference data
```

## Development Commands
```bash
npm run start:dev            # Start with hot-reload
npm run build                # Production build
npm run start:prod           # Run production build
npm run lint                 # ESLint check
npm run format               # Prettier format
npm run typecheck            # TypeScript check
```

## Testing Strategy
- **Unit tests**: Service and repository logic (`*.spec.ts`)
- **E2E tests**: API endpoint testing (`test/*.e2e-spec.ts`)
- **RBAC tests**: Every endpoint must have permission boundary tests
- **Tenant isolation tests**: Verify cross-company data cannot leak

```bash
npm run test                 # Unit tests
npm run test:e2e             # E2E tests
npm run test:cov             # Coverage report
```

## Reference Documentation

### 📚 Priority Order (Always Check)
1. **[part-0.md](docs/part-0.md)** - Global Rules & AI Constitution *(READ FIRST)*
2. **[part-1.md](docs/part-1.md)** - Master Project Brief *(READ FIRST)*

### 🔧 Task-Specific References
| Task | Reference Doc |
|------|---------------|
| System architecture, folder structure | [part-2.md](docs/part-2.md) |
| Multi-tenancy, authentication | [part-3.md](docs/part-3.md) |
| Account & multi-company model | [part-3a.md](docs/part-3a.md) |
| Module registry, feature flags | [part-4.md](docs/part-4.md) |
| Subscription & billing | [part-5.md](docs/part-5.md) |
| Global search (OpenSearch) | [part-6.md](docs/part-6.md) |
| Event system, async processing | [part-7.md](docs/part-7.md) |
| Audit logging | [part-8.md](docs/part-8.md) |
| Notification system | [part-9.md](docs/part-9.md) |
| Rate limiting, abuse protection | [part-10.md](docs/part-10.md) |
| Configuration & secrets | [part-11.md](docs/part-11.md) |
| Health & observability | [part-12.md](docs/part-12.md) |
| HR domain | [part-13.md](docs/part-13.md) |
| Projects domain | [part-14.md](docs/part-14.md) |
| Billing/invoicing domain | [part-15.md](docs/part-15.md) |
| Agency domain | [part-16.md](docs/part-16.md) |
| Reporting & analytics | [part-17.md](docs/part-17.md) |
| AI & intelligent services | [part-18.md](docs/part-18.md) |
| AI copilot | [part-19.md](docs/part-19.md) |
| Compliance & governance | [part-20.md](docs/part-20.md) |
| Real-time infrastructure | [part-21.md](docs/part-21.md) |
| Automation framework | [part-22.md](docs/part-22.md) |
| QA & security review | [part-23.md](docs/part-23.md) |
| Portal configuration | [part-24.md](docs/part-24.md) |
| Deployment & SRE | [part-25.md](docs/part-25.md) |
| Public API & developer platform | [part-26.md](docs/part-26.md) |
| Integration marketplace | [part-27.md](docs/part-27.md) |
| Webhooks & event subscriptions | [part-28.md](docs/part-28.md) |
| Construction vertical | [part-29.md](docs/part-29.md) |
| Partner & reseller model | [part-30.md](docs/part-30.md) |
| White-label & branding | [part-31.md](docs/part-31.md) |
| Industry templates | [part-32.md](docs/part-32.md) |
| Multi-vertical governance | [part-33.md](docs/part-33.md) |
| Global expansion & localization | [part-34.md](docs/part-34.md) |
| Cost optimization & FinOps | [part-35.md](docs/part-35.md) |
| Data archival & retention | [part-36.md](docs/part-36.md) |
| Disaster recovery & BCP | [part-37.md](docs/part-37.md) |
| AI model governance | [part-38.md](docs/part-38.md) |
| GRC operations | [part-39.md](docs/part-39.md) |
| Customer success | [part-40.md](docs/part-40.md) |
| Ecosystem trust & certification | [part-41.md](docs/part-41.md) |
| Organizational operating model | [part-42.md](docs/part-42.md) |
| Platform exit strategy | [part-43.md](docs/part-43.md) |

### 🗺️ Recommended Implementation Sequence
```
Phase 1 — Foundation (parts 0-12)
├─ 0. Global Rules & AI Constitution
├─ 1. Master Project Brief
├─ 2. System Architecture
├─ 3. Multi-Tenancy & Auth
├─ 3a. Account & Multi-Company
├─ 4. Module Registry
├─ 5. Subscription & Billing
├─ 6. Global Search
├─ 7. Event System
├─ 8. Audit Logging
├─ 9. Notification System
├─ 10. Rate Limiting
├─ 11. Configuration
└─ 12. Health & Observability

Phase 2 — Core Business (parts 13-16)
├─ 13. HR Domain
├─ 14. Projects Domain
├─ 15. Billing/Invoicing Domain
└─ 16. Agency Domain

Phase 3 — Intelligence & Automation (parts 17-22)
├─ 17. Reporting & Analytics
├─ 18. AI Services
├─ 19. AI Copilot
├─ 20. Compliance & Governance
├─ 21. Real-time Infrastructure
└─ 22. Automation Framework

Phase 4 — Platform Capabilities (parts 23-28)
├─ 23. QA & Security Review
├─ 24. Portal Configuration
├─ 25. Deployment & SRE
├─ 26. Public API
├─ 27. Marketplace
└─ 28. Webhooks

Phase 5 — Verticals & Ecosystem (parts 29-35)
├─ 29. Construction Vertical
├─ 30. Partner & Reseller
├─ 31. White-Label & Branding
├─ 32. Industry Templates
├─ 33. Multi-Vertical Governance
├─ 34. Global Expansion
└─ 35. Cost Optimization

Phase 6 — Enterprise & Governance (parts 36-43)
├─ 36. Data Archival
├─ 37. Disaster Recovery
├─ 38. AI Model Governance
├─ 39. GRC Operations
├─ 40. Customer Success
├─ 41. Ecosystem Trust
├─ 42. Organizational Model
└─ 43. Platform Exit Strategy
```

### ⚠️ Conflict Resolution
If any instruction conflicts with part-0 or part-1, **part-0 and part-1 ALWAYS take priority**.
