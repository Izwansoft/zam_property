# Zam-Property Backend Development Cheatsheet

> **Copy-paste these prompts in order. Each prompt = one session.**
> After each session, check the box [x] to track progress.

---

## 🧠 How AI Context Works

| File | Auto-Loaded? | When to Explicitly Read |
|------|--------------|-------------------------|
| `.github/copilot-instructions.md` | ✅ **YES** - Every chat | Never (automatic) |
| `docs/ai-prompt/master-prompt.md` | ❌ No | Session 1.1 only (foundation) |
| `docs/ai-prompt/part-0.md` | ❌ No | Session 1.1 only (foundation) |
| `docs/ai-prompt/part-X.md` (specific) | ❌ No | Each session reads its own part |

**Session 1.1** = Read full foundation (master-prompt, part-0, part-1)  
**Session 1.2+** = Just say "Continuing Zam-Property backend development" + read specific part-X

The AI will automatically get the quick reference from `copilot-instructions.md` for every new chat.

---

## 📚 Documentation Files (MANDATORY Updates)

After **EVERY session**, ensure the AI updates these files:

| File | Purpose | When to Update |
|------|---------|----------------|
| `docs/PROGRESS.md` | Track session completion | After each session ✅ |
| `docs/API-REGISTRY.md` | Document all endpoints | After implementing endpoints |

### Post-Session Command (Run at END of each session)
```
Session X.X completed.

Please update the following documentation:
1. docs/PROGRESS.md - Mark session X.X as completed
2. docs/API-REGISTRY.md - Add any new endpoints with full parameter details

Follow the exact conventions in these files.
```

---

## 🔧 PHASE 1 — FOUNDATION

### Session 1.1: Initialize NestJS Project
```
I'm starting Zam-Property backend development.

FIRST, read these foundation documents to understand the project:
1. docs/ai-prompt/master-prompt.md - Master Project Brief
2. docs/ai-prompt/part-0.md - Global Rules & Standards
3. docs/ai-prompt/part-1.md - Project Brief & System Vision
4. docs/ai-prompt/part-2.md - Architectural Principles
5. docs/ai-prompt/part-3.md - Repository Structure & Tooling

Task: Initialize the NestJS project with:
1. Create NestJS project structure
2. Install all dependencies (Prisma, class-validator, passport-jwt, BullMQ, Socket.IO, etc.)
3. Create folder structure per Part 1 (src/core, src/infrastructure, src/modules, src/verticals, src/shared, src/config)
4. Setup tsconfig paths (@/, @core/, @infrastructure/, @modules/, @shared/)
5. Create .env.example file with all required variables

Do NOT create business logic yet. Just the skeleton.
```
- [x] Completed

---

### Session 1.2: Prisma & Database Setup
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-27.md (Database Schema)

Task: Setup Prisma with PostgreSQL:
1. Initialize Prisma with PostgreSQL provider
2. Create initial schema.prisma with extensions (uuid-ossp)
3. Create database config module
4. Create PrismaService with connection handling
5. Add prisma scripts to package.json

The schema should be empty for now (just datasource and generator).
```
- [x] Completed

---

### Session 1.3: Tenant Entity & Multi-Tenancy Foundation
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-5.md (Multi-Tenancy & Vendor Model)
Read docs/ai-prompt/part-27.md (Tenant schema section)

Task: Implement Tenant foundation:
1. Create Tenant entity in Prisma schema
2. Create TenantSettings entity
3. Create TenantDomain entity
4. Run prisma migrate dev
5. Create seed file for one test tenant

Tables needed: tenants, tenant_settings, tenant_domains
```
- [x] Completed

---

### Session 1.4: TenantContext Middleware
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-5.md (TenantContext section)

Task: Implement TenantContext:
1. Create TenantContext interface
2. Create TenantContextService (request-scoped)
3. Create TenantMiddleware to extract tenant from subdomain/header
4. Create BaseTenantRepository with tenant enforcement
5. Register middleware globally

Every request must have tenant resolved from subdomain or X-Tenant-ID header.
```
- [x] Completed

---

### Session 1.5: User Entity & Auth Module
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-4.md (Core Platform Domains - Auth section)
Read docs/ai-prompt/part-5.md (User & Ownership Model)

Task: Implement Authentication:
1. Create User entity in Prisma schema
2. Create auth.module.ts, auth.controller.ts, auth.service.ts
3. Implement JWT strategy (passport-jwt) with access + refresh tokens
4. Create login endpoint POST /api/v1/auth/login
5. Create refresh endpoint POST /api/v1/auth/refresh
6. Create JwtAuthGuard
7. Hash passwords with bcrypt

User fields: id, tenant_id, email, password_hash, full_name, phone, role, status
```
- [x] Completed

---

### Session 1.6: RBAC Permission Engine
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-4.md (Core Platform Domains - RBAC section)

Task: Implement RBAC:
1. Create Role enum (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, GUEST)
2. Create Permission entity (optional, for granular permissions)
3. Create RolesGuard
4. Create @Roles() decorator
5. Create @RequirePermission() decorator
6. Integrate with JWT payload

Role scopes: PLATFORM, TENANT, VENDOR, CUSTOMER, PUBLIC
```
- [x] Completed

---

### Session 1.7: User Management APIs
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-4.md (Core Platform Domains - User section)
Read docs/ai-prompt/part-5.md (User & Ownership Model)

Task: Implement User CRUD:
1. Create user.module.ts, user.controller.ts, user.service.ts
2. Create UserRepository extending BaseTenantRepository
3. Implement CRUD endpoints (list, get, create, update, deactivate)
4. Create DTOs with validation
5. Implement user registration for customers

All endpoints must enforce RBAC and tenant isolation.
```
- [x] Completed

---

### Session 1.8: Swagger Setup
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-30.md (API Endpoints section)

Task: Setup Swagger/OpenAPI:
1. Install @nestjs/swagger
2. Configure SwaggerModule in main.ts
3. Add @ApiTags, @ApiBearerAuth to existing controllers
4. Add @ApiProperty to all DTOs
5. Document permission requirements in descriptions

Swagger should be accessible at /api/docs
```
- [x] Completed

---

### Session 1.9: Error Handling & Response Format
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-15.md (API Design - Error Handling section)

Task: Implement Error Handling:
1. Create GlobalExceptionFilter
2. Create standard error response format
3. Create error code constants (AUTH_*, VAL_*, BIZ_*, etc.)
4. Create standard success response wrapper
5. Implement request ID tracking

All responses must follow the standard format from part-15.
```
- [x] Completed

---

### Session 1.10: Event System & Async Processing
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-28.md (Event Catalog)
Read docs/ai-prompt/part-31.md (Background Jobs)

Task: Implement Event System:
1. Setup EventEmitter2 for domain events
2. Configure BullMQ with Redis for background jobs
3. Create base domain event classes
4. Create EventBus service
5. Create queue processor template

Focus on infrastructure, not business events yet.
```
- [x] Completed

---

### Session 1.11: Redis & Caching Setup
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-32.md (Caching Strategy)

Task: Implement Caching:
1. Setup Redis connection
2. Create CacheService with multi-tier strategy
3. Create cache key builders
4. Create @Cacheable() decorator
5. Setup cache invalidation patterns

Implement L1 (in-memory) + L2 (Redis) caching.
```
- [x] Completed

---

### Session 1.12: Configuration Module
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-3.md (Repository Structure - Config section)
Read docs/ai-prompt/part-25.md (Infrastructure & Environments)

Task: Implement Configuration:
1. Create typed configuration classes
2. Create ConfigModule with validation
3. Create environment-specific configs
4. Implement secrets management pattern
5. Create health check endpoint

Configuration must be type-safe and validated at startup.
```
- [x] Completed

---

## ✅ PHASE 1 CHECKPOINT
```
Before continuing to Phase 2, verify:

1. Run: pnpm build (should compile without errors)
2. Run: pnpm start:dev (should start without errors) 
3. Test: POST /api/v1/auth/login with seeded user
4. Test: GET /api/v1/users with JWT token
5. Check: Swagger UI at /api/docs
6. Check: Redis connection working
7. Check: Event system emitting events

If all pass, continue to Phase 2.
```
- [x] All checks passed

---

## 🏢 PHASE 2 — CORE DOMAINS

### Session 2.1: Vendor Entity & Management
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-5.md (Multi-Tenancy, Vendor & Ownership Model)
Read docs/ai-prompt/part-27.md (Vendor schema section)

Task: Implement Vendor Entity:
1. Create Vendor entity in Prisma schema
2. Create VendorProfile entity
3. Create VendorSettings entity
4. Create vendor.module.ts, vendor.controller.ts, vendor.service.ts
5. Implement vendor CRUD endpoints
6. Implement vendor approval workflow

Status: PENDING → APPROVED/REJECTED/SUSPENDED
```
- [ ] Completed

---

### Session 2.2: Listing Entity & Core CRUD
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-6.md (Generic Listing Engine)
Read docs/ai-prompt/part-7.md (Attribute Engine & Validation)
Read docs/ai-prompt/part-27.md (Listing schema section)

Task: Implement Listing Entity:
1. Create Listing entity in Prisma schema
2. Create ListingMedia entity
3. Create ListingAttribute entity (JSON)
4. Create listing.module.ts, listing.controller.ts, listing.service.ts
5. Implement listing CRUD endpoints
6. Implement listing status workflow

Status: DRAFT → PUBLISHED → EXPIRED/ARCHIVED
```
- [ ] Completed

---

### Session 2.2b: Workflows & State Machines
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-14.md (Workflows, State Machines & Long-Running Processes)

Task: Implement State Machine Infrastructure:
1. Create StateMachine base class with typed transitions
2. Implement ListingStateMachine (DRAFT → PUBLISHED → EXPIRED/ARCHIVED)
3. Implement VendorStateMachine (PENDING → APPROVED/REJECTED → SUSPENDED)
4. Implement InteractionStateMachine (NEW → CONTACTED → CONFIRMED → CLOSED)
5. Create @Transition() decorator for action methods
6. Add transition guards and side effects

All status changes MUST go through state machines. No direct status updates.
```
- [ ] Completed

---

### Session 2.3: Listing Search & Filters
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-9.md (Search Architecture & Indexing)
Read docs/ai-prompt/part-34.md (OpenSearch Infrastructure)

Task: Implement Listing Search:
1. Create OpenSearch index mapping for listings
2. Create ListingSearchService
3. Implement search endpoint with filters
4. Implement faceted search (aggregations)
5. Implement geo-search for location
6. Create async indexing via events

Search must support: text query, filters, facets, geo-distance, sorting.
```
- [x] Completed

---

### Session 2.4: Media Management
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-10.md (Media, Assets & CDN Strategy)

Task: Implement Media Management:
1. Create Media entity in Prisma schema
2. Create S3 storage adapter
3. Implement presigned URL generation
4. Implement upload completion callback
5. Create media.module.ts, media.controller.ts, media.service.ts
6. Implement media CRUD endpoints

Upload flow: Request presigned URL → Upload to S3 → Confirm upload
```
- [x] Completed

---

### Session 2.5: Interaction (Leads/Inquiries)
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-11.md (Leads, Enquiries & Booking)
Read docs/ai-prompt/part-27.md (Interaction schema section)

Task: Implement Interaction Entity:
1. Create Interaction entity in Prisma schema
2. Create InteractionMessage entity
3. Create interaction.module.ts with controllers
4. Implement interaction CRUD endpoints
5. Implement interaction status workflow
6. Implement messaging within interaction

Types: LEAD, ENQUIRY, BOOKING
Status: NEW → CONTACTED → CONFIRMED → CLOSED/INVALID
```
- [ ] Completed

---

### Session 2.6: Review & Ratings
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-12.md (Reviews, Ratings & Trust Signals)

Task: Implement Review Entity:
1. Create Review entity in Prisma schema
2. Create review.module.ts, review.controller.ts, review.service.ts
3. Implement review CRUD endpoints
4. Implement review moderation workflow
5. Implement rating aggregation for vendors

Status: PENDING → APPROVED/REJECTED/FLAGGED
```
- [ ] Completed

---

### Session 2.7: Subscription & Plans
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-16.md (Subscriptions, Plans & Monetisation)
Read docs/ai-prompt/part-17.md (Entitlements & Enforcement)
Read docs/ai-prompt/part-18.md (Usage Tracking & Quota)

Task: Implement Subscription Entity:
1. Create SubscriptionPlan entity
2. Create VendorSubscription entity
3. Create PlanFeature entity
4. Create subscription.module.ts with controllers
5. Implement plan management endpoints
6. Implement subscription assignment

Plans control: listing limits, featured listings, analytics access, etc.
```
- [ ] Completed

---

### Session 2.7b: Billing Provider Integration
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-19.md (Billing Provider Abstraction & Payments Integration)

Task: Implement Billing Integration:
1. Create BillingProvider interface (abstract)
2. Implement StripeBillingProvider adapter
3. Create PaymentIntent flow for subscriptions
4. Implement webhook handler for payment events
5. Create Invoice entity and generation
6. Implement payment method management

Payments are ISOLATED from domain logic. Use events for side effects.
```
- [ ] Completed

---

### Session 2.7c: Pricing Models Configuration
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-20.md (Pricing Models - Lead-Based, Commission, SaaS)

Task: Implement Pricing Models:
1. Create PricingModel entity (SaaS, LEAD_BASED, COMMISSION, HYBRID)
2. Implement SaaS flat-fee pricing logic
3. Implement lead-based pricing (pay-per-lead)
4. Implement commission-based pricing (percentage of transaction)
5. Create TenantPricingConfig for tenant-specific pricing
6. Implement pricing calculation service

Pricing is CONFIG, not code. Tenants choose their model.
```
- [ ] Completed

---

### Session 2.8: Notification System
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-13.md (Notifications & Communication System)

Task: Implement Notification System:
1. Create Notification entity in Prisma schema
2. Create NotificationTemplate entity
3. Create NotificationService
4. Implement email provider integration (SMTP/SendGrid)
5. Create in-app notification endpoints
6. Implement event-driven notifications

Support: email, in-app, push (later)
```
- [ ] Completed

---

### Session 2.9: Event-Driven Architecture
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-28.md (Event Catalog & Domain Event Specifications)

Task: Implement Event Architecture:
1. Create EventBus service using EventEmitter2
2. Define all domain events from event catalog
3. Implement event handlers for each domain
4. Add event logging and tracking
5. Connect modules via events (not direct calls)
6. Implement saga patterns for complex workflows

Events drive: notifications, search indexing, analytics, billing.
```
- [ ] Completed

---

## ✅ PHASE 2 CHECKPOINT
```
Before continuing to Phase 3, verify:

1. Vendor CRUD working with approval workflow
2. Listing CRUD working with status transitions
3. State machines enforcing valid transitions only
4. Search returning results with filters
5. Media upload working with presigned URLs
6. Interactions can be created and messaged
7. Reviews can be submitted and moderated
8. Subscriptions can be assigned to vendors
9. Billing provider integration working (test mode)
10. Pricing models configurable per tenant
11. Events flowing between modules correctly

If all pass, continue to Phase 3.
```
- [ ] All checks passed

---

## 🔌 PHASE 3 — REAL-TIME & VERTICALS

### Session 3.1: WebSocket Infrastructure
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-33.md (WebSocket Strategy)

Task: Implement WebSocket:
1. Setup Socket.IO with Redis adapter
2. Create WebSocket gateway
3. Implement namespace structure (/, /tenant, /vendor, /notifications)
4. Implement room-based messaging
5. Implement authentication for WebSocket
6. Create event handlers for real-time updates

Events: listing updates, new interactions, notifications
```
- [x] Completed

---

### Session 3.2: Vertical Registry
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-8.md (Vertical Module Contract)

Task: Implement Vertical Registry:
1. Create VerticalDefinition entity
2. Create TenantVertical enablement entity
3. Create vertical.module.ts with controllers
4. Implement vertical enablement endpoints
5. Create VerticalGuard for route protection

Verticals: real_estate, automotive, jobs, services, etc.
```
- [x] Completed

---

### Session 3.3: Real Estate Vertical - Schema
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-29.md (Real Estate Vertical)

Task: Implement Real Estate Schema:
1. Define real estate attribute schema
2. Create RealEstateListingService
3. Implement attribute validation
4. Create real estate specific filters
5. Create OpenSearch mapping for real estate

Attributes: propertyType, listingType, tenure, bedrooms, bathrooms, etc.
```
- [x] Completed

---

### Session 3.4: Real Estate Vertical - Search
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-29.md (Search section)
Read docs/ai-prompt/part-34.md (OpenSearch)

Task: Implement Real Estate Search:
1. Create real estate search endpoint
2. Implement property type facets
3. Implement bedroom/bathroom filters
4. Implement geo-search for properties
5. Implement price range filters
6. Create real estate aggregations

Facets: propertyType, bedrooms, furnishing, cities, priceRanges
```
- [x] Completed

---

### Session 3.5: Validation Engine
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-7.md (Attribute Engine & Validation System)

Task: Implement Validation Engine:
1. Create AttributeSchema registry
2. Create ValidationService
3. Implement draft vs publish validation
4. Implement cross-field validation
5. Create vertical-specific validators

Validation must support: required fields, conditional fields, cross-field rules.
```
- [x] Completed

---

### Session 3.6: Background Jobs - Full Implementation
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-31.md (Background Jobs)

Task: Implement All Background Jobs:
1. Create search.index queue and processor
2. Create media.process queue for image optimization
3. Create notification.send queue
4. Create listing.expire queue for expiration
5. Create analytics.aggregate queue
6. Implement job monitoring endpoints

All jobs must handle failures gracefully with retries.
```
- [x] Completed

---

## ✅ PHASE 3 CHECKPOINT
```
Before continuing to Phase 4, verify:

1. WebSocket connections working
2. Real-time notifications being delivered
3. Vertical registry working
4. Real estate vertical attributes validating
5. Real estate search returning filtered results
6. Background jobs processing correctly

If all pass, continue to Phase 4.
```
- [ ] All checks passed

---

## 🚀 PHASE 4 — PLATFORM FEATURES

### Session 4.1: Analytics & Reporting
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-21.md (Analytics & Reporting)

Task: Implement Analytics:
1. Create ListingStats entity
2. Create VendorStats entity
3. Implement view tracking
4. Implement interaction analytics
5. Create analytics dashboard endpoints

Track: views, inquiries, conversion rates, popular listings
```
- [ ] Completed

---

### Session 4.2: Admin Dashboard APIs
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-23.md (Admin, Backoffice & Operational Tooling)

Task: Implement Admin APIs:
1. Create tenant dashboard stats endpoint
2. Create vendor management dashboard
3. Create listing moderation endpoints
4. Create system health endpoints
5. Create bulk action endpoints

Admin must be able to: moderate listings, manage vendors, view stats
```
- [ ] Completed

---

### Session 4.2b: Feature Flags & Experiments
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-24.md (Feature Flags, Experiments & Progressive Rollout)

Task: Implement Feature Flags:
1. Create FeatureFlag entity in Prisma schema
2. Create FeatureFlagService with evaluation logic
3. Implement @FeatureFlag() decorator for routes
4. Create percentage rollout strategy
5. Create tenant-specific flag overrides
6. Implement A/B experiment framework
7. Create feature flag admin endpoints

Flags support: boolean, percentage, user-segment, tenant-specific targeting.
```
- [ ] Completed

---

### Session 4.3: Public API & Rate Limiting
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-30.md (API Endpoints)

Task: Implement Public API:
1. Create public search endpoint (no auth required)
2. Create public listing detail endpoint
3. Create public vendor profile endpoint
4. Implement rate limiting with Redis
5. Create API versioning strategy

Public endpoints must be rate-limited and cached.
```
- [x] Completed

---

### Session 4.4: Audit Logging
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-22.md (Audit Logs, Compliance & Governance)

Task: Implement Audit Logging:
1. Create AuditLog entity in Prisma schema
2. Create AuditService for recording actions
3. Create AuditInterceptor for automatic logging
4. Create audit query endpoints
5. Implement sensitive data masking

Log: action, resource, resource_id, old_value, new_value, user_id, tenant_id
```
- [ ] Completed

---

### Session 4.5: Testing & E2E
```
Continuing Zam-Property backend development.

Read docs/ai-prompt/part-26.md (Testing Strategy, Quality Gates & Release)

Task: Implement Tests:
1. Create unit tests for core services
2. Create E2E tests for auth flow
3. Create E2E tests for listing CRUD
4. Create E2E tests for vendor workflow
5. Create tenant isolation tests

All critical paths must have E2E test coverage.
```
- [x] Completed

---

## ✅ PHASE 4 CHECKPOINT (BACKEND COMPLETE)
```
Final verification before frontend development:

1. All API endpoints documented in API-REGISTRY.md
2. All E2E tests passing
3. Swagger UI fully documented
4. Error handling consistent
5. Tenant isolation verified
6. Feature flags working with percentage rollout
7. Performance acceptable
8. Security review passed

Backend is now ready for frontend integration.
```
- [x] All checks passed

---

## 📝 Session Completion Template

After completing each session, use this prompt:
```
Session [X.X] completed.

Please update the following documentation:
1. docs/PROGRESS.md - Mark session [X.X] as completed with today's date
2. docs/API-REGISTRY.md - Add any new endpoints implemented

Summary of what was implemented:
- [List key deliverables]

Any notes or issues:
- [List any deviations or problems]
```

---

## 🔍 Quick Debugging Prompts

### Check Tenant Isolation
```
Review the [module] for tenant isolation issues:
1. Are all queries filtered by tenant_id?
2. Is tenant_id from JWT, not request body?
3. Are cross-tenant joins prevented?
```

### Check RBAC Implementation
```
Review the [endpoint] for RBAC issues:
1. Is @Roles() or @RequirePermission() decorator present?
2. Are role checks appropriate for the action?
3. Is the guard correctly applied?
```

### Check Error Handling
```
Review the [service] for error handling:
1. Are business errors using correct error codes?
2. Are errors logged appropriately?
3. Is sensitive data masked in error responses?
```
