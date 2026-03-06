# Zam-Property Backend - Development Progress

> **Track overall development progress by session.**  
> Update checkboxes as sessions are completed.

---

## 📊 Overall Progress

| Phase | Sessions | Completed | Progress |
|-------|----------|-----------|----------|
| Phase 1: Foundation | 12 | 12 | 100% |
| Phase 2: Core Domains | 12 | 12 | 100% |
| Phase 3: Real-Time & Verticals | 6 | 6 | 100% |
| Phase 4: Platform Features | 6 | 6 | 100% |
| Phase 5: Property Management Foundation | 8 | 8 | 100% |
| Phase 6: Rent & Maintenance | 8 | 8 | 100% |
| Phase 7: Operations | 6 | 6 | 100% |
| Phase 8: Growth Features | 8 | 8 | 100% |
| **Total** | **66** | **66** | **100%** |

---

## 🏗️ Phase 1: Foundation (12 Sessions)

### Session 1.1: Project Bootstrap
- [x] Initialize NestJS project with pnpm
- [x] Configure TypeScript strict mode
- [x] Set up ESLint and Prettier
- [x] Create initial folder structure
- [x] Configure path aliases

**Deliverables:**
- `package.json` with dependencies
- `tsconfig.json` configured
- `.eslintrc.js` and `.prettierrc`
- Base folder structure created

---

### Session 1.2: Prisma & Database Setup
- [x] Initialize Prisma with PostgreSQL provider
- [x] Create initial schema.prisma with extensions (uuid-ossp)
- [x] Create database config module
- [x] Create PrismaService with connection handling
- [x] Add Prisma scripts to package.json

**Deliverables:**
- `prisma/schema.prisma` (datasource + generator only)
- `src/infrastructure/database/database.module.ts`
- `src/infrastructure/database/prisma.service.ts`
- Prisma scripts (`prisma:*`) in package.json

---

### Session 1.3: Tenant Entity & Multi-Tenancy Foundation
- [x] Create Tenant entity in Prisma schema
- [x] Create TenantSettings entity
- [x] Create TenantDomain entity
- [x] Run prisma migrate dev (migration applied + seed executed)
- [x] Create seed file for one test tenant

**Deliverables:**
- `prisma/schema.prisma` (tenants, tenant_settings, tenant_domains)
- `prisma/seed.ts` for demo tenant

---

### Session 1.4: TenantContext Middleware
- [x] Create TenantContext interface
- [x] Create TenantContextService (request-scoped)
- [x] Create TenantMiddleware to extract tenant from subdomain/header
- [x] Create BaseTenantRepository with tenant enforcement
- [x] Register middleware globally

**Deliverables:**
- `src/core/tenant-context/tenant-context.interface.ts`
- `src/core/tenant-context/tenant-context.service.ts`
- `src/core/tenant-context/tenant.middleware.ts`
- `src/core/tenant-context/base-tenant.repository.ts`
- `src/app.module.ts` updated to register middleware globally

---

### Session 1.5: User Entity & Auth Module
- [x] Create User entity in Prisma schema
- [x] Create auth.module.ts, auth.controller.ts, auth.service.ts
- [x] Implement JWT strategy (passport-jwt) with access + refresh tokens
- [x] Create login endpoint POST /api/v1/auth/login
- [x] Create refresh endpoint POST /api/v1/auth/refresh
- [x] Create JwtAuthGuard
- [x] Hash passwords with bcrypt

**Deliverables:**
- `prisma/schema.prisma` (users table + Role/UserStatus enums)
- `src/core/auth/auth.module.ts`
- `src/core/auth/auth.controller.ts`
- `src/core/auth/auth.service.ts`
- `src/core/auth/strategies/jwt.strategy.ts`
- `src/core/auth/guards/jwt-auth.guard.ts`
- `src/core/user/user.repository.ts`

---

### Session 1.6: RBAC Permission Engine
- [x] Create Role enum (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF, CUSTOMER, GUEST)
- [x] Create Permission entity (optional)
- [x] Create RolesGuard
- [x] Create @Roles() decorator
- [x] Create @RequirePermission() decorator
- [x] Integrate with JWT payload

---

### Session 1.7: User Management APIs
- [x] Create user.module.ts, user.controller.ts, user.service.ts
- [x] Create UserRepository extending BaseTenantRepository
- [x] Implement CRUD endpoints (list, get, create, update, deactivate)
- [x] Create DTOs with validation
- [x] Implement user registration for customers

---

### Session 1.8: Swagger Setup
- [x] Install @nestjs/swagger
- [x] Configure SwaggerModule in main.ts
- [x] Add @ApiTags, @ApiBearerAuth to controllers
- [x] Add @ApiProperty to DTOs
- [x] Document permission requirements in descriptions

---

### Session 1.9: Error Handling & Response Format
- [x] Create GlobalExceptionFilter
- [x] Create standard error response format
- [x] Create error code constants (AUTH_*, VAL_*, BIZ_*, etc.)
- [x] Create standard success response wrapper
- [x] Implement request ID tracking

**Deliverables:**
- `src/shared/errors/error-codes.ts` (all error code constants)
- `src/shared/errors/error-response.interface.ts` (ErrorResponse, ErrorDetail)
- `src/shared/errors/app.exception.ts` (AppException class with factory methods)
- `src/shared/errors/global-exception.filter.ts` (GlobalExceptionFilter)
- `src/shared/constants/headers.constant.ts` (REQUEST_ID_HEADER, TENANT_ID_HEADER)
- `src/shared/interceptors/request-id.interceptor.ts` (RequestIdInterceptor)
- `src/shared/responses/api-response.interface.ts` (ApiResponse, PaginatedResponse)
- `src/common/middleware/request-id.middleware.ts` (RequestIdMiddleware - runs before TenantMiddleware)
- Updated `src/main.ts` with GlobalExceptionFilter and RequestIdInterceptor
- Updated `src/app.module.ts` with RequestIdMiddleware registered globally
- Updated `tsconfig.json` with `@common/*` path alias

---

### Session 1.10: Event System & Async Processing
- [x] Setup EventEmitter2 for domain events
- [x] Configure BullMQ with Redis for background jobs
- [x] Create base domain event classes
- [x] Create EventBus service
- [x] Create queue processor template

**Deliverables:**
- `src/infrastructure/events/domain-event.interface.ts` (DomainEvent interface)
- `src/infrastructure/events/base-domain-event.ts` (BaseDomainEvent, GenericDomainEvent classes)
- `src/infrastructure/events/event-bus.service.ts` (EventBusService)
- `src/infrastructure/events/events.module.ts` (EventsModule with EventEmitter2)
- `src/infrastructure/events/decorators/domain-event-handler.decorator.ts` (@DomainEventHandler, @DomainWildcardHandler)
- `src/infrastructure/redis/redis.service.ts` (RedisService)
- `src/infrastructure/redis/redis.module.ts` (RedisModule)
- `src/infrastructure/queue/queue.constants.ts` (QUEUE_NAMES, JOB_TYPES)
- `src/infrastructure/queue/queue.config.ts` (job options, concurrency, timeouts)
- `src/infrastructure/queue/queue.interfaces.ts` (job payload interfaces)
- `src/infrastructure/queue/base-processor.ts` (BaseProcessor abstract class)
- `src/infrastructure/queue/queue.service.ts` (QueueService)
- `src/infrastructure/queue/queue.module.ts` (QueueModule)
- `src/infrastructure/queue/example-processor.ts` (processor template)
- `src/health/health.controller.ts` (health endpoints for Redis/queues)
- `src/health/health.module.ts` (HealthModule)
- Updated `src/app.module.ts` with EventsModule, RedisModule, QueueModule, HealthModule
- Updated `.env.example` with Redis configuration

---

### Session 1.11: Redis & Caching Setup
- [x] Setup Redis connection
- [x] Create CacheService with multi-tier strategy
- [x] Create cache key builders
- [x] Create @Cacheable() decorator
- [x] Setup cache invalidation patterns

**Deliverables:**
- `src/infrastructure/cache/cache-key.builder.ts` (key builders, TTL constants, patterns)
- `src/infrastructure/cache/memory-cache.service.ts` (L1 in-memory cache with node-cache)
- `src/infrastructure/cache/cache.service.ts` (multi-tier L1+L2 Redis cache)
- `src/infrastructure/cache/distributed-lock.service.ts` (Redis distributed locks)
- `src/infrastructure/cache/cache-invalidation.service.ts` (event-driven invalidation)
- `src/infrastructure/cache/rate-limit.service.ts` (sliding window rate limiting)
- `src/infrastructure/cache/cache.module.ts` (global CacheModule)
- `src/infrastructure/cache/decorators/cacheable.decorator.ts` (@Cacheable, @CacheEvict, @CachePut)
- `src/infrastructure/cache/decorators/cache.interceptor.ts` (CacheInterceptor)
- Updated `src/health/health.controller.ts` with GET /api/v1/health/cache endpoint
- Updated `src/app.module.ts` with CacheModule import

---

### Session 1.12: Configuration Module
- [x] Create typed configuration classes
- [x] Create ConfigModule with validation
- [x] Create environment-specific configs
- [x] Implement secrets management pattern
- [x] Create health check endpoint

**Deliverables:**
- `src/config/app.config.ts` (App configuration with environment detection)
- `src/config/database.config.ts` (Database URL parsing and config)
- `src/config/redis.config.ts` (Redis connection configuration)
- `src/config/jwt.config.ts` (JWT secrets and TTL configuration)
- `src/config/opensearch.config.ts` (OpenSearch connection config)
- `src/config/s3.config.ts` (S3/object storage configuration)
- `src/config/cors.config.ts` (CORS settings)
- `src/config/config.validation.ts` (Joi validation schema)
- `src/config/typed-config.service.ts` (Type-safe config service with secrets masking)
- `src/config/config.module.ts` (AppConfigModule with startup validation)
- Updated `src/health/health.controller.ts` with GET /api/v1/health/config endpoint
- Updated `src/app.module.ts` with AppConfigModule import

---

### ✅ Phase 1 Checkpoint

Before continuing to Phase 2, verify:

- [x] Run: pnpm build (should compile without errors)
- [x] Run: pnpm start:dev (should start without errors)
- [x] Test: POST /api/v1/auth/login with seeded user
- [x] Test: GET /api/v1/users with JWT token
- [x] Check: Swagger UI at /api/docs
- [x] Check: Redis connection working
- [x] Check: Event system emitting events (EventBridgeService wired)

---

## 📦 Phase 2: Core Domains (12 Sessions)

### Session 2.1: Vendor Module
- [x] Create Vendor Prisma schema
- [x] Implement VendorService
- [x] Create VendorController
- [x] Add vendor approval workflow
- [x] Create vendor DTOs

**Deliverables:**
- `prisma/schema.prisma` (Vendor, VendorProfile, VendorSettings entities + VendorStatus, VendorType enums)
- `src/modules/vendor/vendor.module.ts`
- `src/modules/vendor/vendor.repository.ts`
- `src/modules/vendor/vendor.service.ts`
- `src/modules/vendor/vendor.controller.ts`
- `src/modules/vendor/dto/create-vendor.dto.ts`
- `src/modules/vendor/dto/update-vendor.dto.ts`
- `src/modules/vendor/dto/vendor-query.dto.ts`
- `src/modules/vendor/dto/vendor-response.dto.ts`
- `src/modules/vendor/dto/vendor-action.dto.ts` (approve, reject, suspend, reactivate)
- `src/modules/vendor/dto/vendor-profile.dto.ts`
- Migration: `20260115155312_add_vendor_entities`

**Endpoints Created:**
- GET /api/v1/vendors - List vendors with pagination/filtering
- GET /api/v1/vendors/:id - Get vendor by ID with details
- GET /api/v1/vendors/by-slug/:slug - Get vendor by slug
- POST /api/v1/vendors - Create new vendor (status: PENDING)
- PATCH /api/v1/vendors/:id - Update vendor details
- DELETE /api/v1/vendors/:id - Soft delete vendor
- POST /api/v1/vendors/:id/actions/approve - Approve vendor
- POST /api/v1/vendors/:id/actions/reject - Reject vendor
- POST /api/v1/vendors/:id/actions/suspend - Suspend vendor
- POST /api/v1/vendors/:id/actions/reactivate - Reactivate vendor
- PATCH /api/v1/vendors/:id/profile - Update vendor profile
- PATCH /api/v1/vendors/:id/settings - Update vendor settings

**Status Workflow:**
- PENDING → APPROVED (approveVendor)
- PENDING → REJECTED (rejectVendor)
- APPROVED → SUSPENDED (suspendVendor)
- SUSPENDED/REJECTED → APPROVED (reactivateVendor)

---

### Session 2.2: Listing Module (Core)
- [x] Create Listing Prisma schema
- [x] Implement ListingService
- [x] Create ListingController (CRUD)
- [x] Add listing status workflow
- [x] Create listing DTOs with validation

**Deliverables:**
- `prisma/schema.prisma` (Listing, ListingMedia entities + ListingStatus, MediaType, MediaVisibility enums)
- `src/modules/listing/listing.module.ts`
- `src/modules/listing/listing.repository.ts`
- `src/modules/listing/listing.service.ts`
- `src/modules/listing/listing.controller.ts`
- `src/modules/listing/dto/create-listing.dto.ts` (with LocationDto nested class)
- `src/modules/listing/dto/update-listing.dto.ts`
- `src/modules/listing/dto/listing-query.dto.ts`
- `src/modules/listing/dto/listing-response.dto.ts`
- `src/modules/listing/dto/listing-action.dto.ts` (publish, unpublish, archive, expire, feature)
- Migration: `20260116192546_add_listing_entities`

**Endpoints Created:**
- GET /api/v1/listings - List listings with pagination/filtering
- GET /api/v1/listings/:id - Get listing by ID with details (increments view count)
- GET /api/v1/listings/by-slug/:slug - Get listing by slug
- GET /api/v1/listings/vendor/:vendorId - Get listings by vendor
- POST /api/v1/listings - Create new listing (status: DRAFT)
- PATCH /api/v1/listings/:id - Update listing details
- DELETE /api/v1/listings/:id - Soft delete listing
- POST /api/v1/listings/:id/publish - Publish listing (DRAFT → PUBLISHED)
- POST /api/v1/listings/:id/unpublish - Unpublish listing (PUBLISHED → DRAFT)
- POST /api/v1/listings/:id/expire - Expire listing (PUBLISHED → EXPIRED)
- POST /api/v1/listings/:id/archive - Archive listing (any → ARCHIVED)
- POST /api/v1/listings/:id/feature - Feature listing (sets isFeatured + featuredUntil)
- POST /api/v1/listings/:id/unfeature - Remove featured status

**Status Workflow:**
- DRAFT → PUBLISHED (publishListing)
- PUBLISHED → DRAFT (unpublishListing)
- PUBLISHED → EXPIRED (expireListing)
- DRAFT | PUBLISHED | EXPIRED → ARCHIVED (archiveListing)

**Key Features:**
- JSONB storage for location and vertical-specific attributes
- Schema versioning for attributes (schemaVersion field)
- Featured listing support with expiry
- View count tracking
- Automatic slug generation with uniqueness guarantee

---

### Session 2.2b: Workflows & State Machines
- [x] Create StateMachine base class
- [x] Implement ListingStateMachine
- [x] Implement VendorStateMachine
- [x] Implement InteractionStateMachine
- [x] Create @Transition() decorator
- [x] Add transition guards and side effects

**Deliverables:**
- `src/core/workflows/types.ts` - Type definitions (StateTransition, TransitionGuard, StateConfig, TransitionResult, TransitionMetadata)
- `src/core/workflows/state-machine.base.ts` - Generic StateMachine<TState, TEvent> base class
- `src/core/workflows/transition.decorator.ts` - @Transition() decorator for marking state transition methods
- `src/core/workflows/listing.state-machine.ts` - ListingStateMachine with DRAFT→PUBLISHED→EXPIRED/ARCHIVED transitions
- `src/core/workflows/vendor.state-machine.ts` - VendorStateMachine with PENDING→APPROVED/REJECTED→SUSPENDED transitions
- `src/core/workflows/interaction.state-machine.ts` - InteractionStateMachine placeholder (NEW→CONTACTED→CONFIRMED→CLOSED)
- `src/core/workflows/index.ts` - Barrel export
- Updated `src/modules/listing/listing.service.ts` - Refactored to use ListingStateMachine
- Updated `src/modules/listing/listing.module.ts` - Added ListingStateMachine provider
- Updated `src/modules/vendor/vendor.service.ts` - Refactored to use VendorStateMachine
- Updated `src/modules/vendor/vendor.module.ts` - Added VendorStateMachine provider

**State Machine Features:**
- Type-safe state transitions with generic `<TState, TEvent>` parameters
- Declarative transition registration via `registerTransition()`
- Transition validation with guard functions
- Before/after hooks for side effects
- State-specific onEnter/onExit hooks
- Invalid transition detection with detailed error messages
- `canTransition()` method for validation without execution
- `assertCanTransition()` for throwing exceptions

**Listing State Machine:**
- DRAFT → PUBLISHED (publish event)
- PUBLISHED → DRAFT (unpublish event)
- PUBLISHED → EXPIRED (expire event)
- DRAFT/PUBLISHED/EXPIRED → ARCHIVED (archive event)

**Vendor State Machine:**
- PENDING → APPROVED (approve event)
- PENDING → REJECTED (reject event, with rejection reason guard)
- APPROVED → SUSPENDED (suspend event)
- SUSPENDED/REJECTED → APPROVED (reactivate event)

**Interaction State Machine (Placeholder):**
- NEW → CONTACTED (contact event)
- CONTACTED → CONFIRMED (confirm event)
- NEW/CONTACTED/CONFIRMED → CLOSED (close event)
- NEW/CONTACTED/CONFIRMED → INVALID (invalidate event)

**Architecture Principles Enforced:**
- ✅ All status changes MUST go through state machines (Part 14)
- ✅ No direct status updates allowed in services
- ✅ State transitions are explicit and observable
- ✅ Invalid transitions are rejected at runtime
- ✅ Workflows are event-driven
- ✅ Business logic separated from state management

---

### Session 2.3: Listing Search & Filters
**Completed:** 2026-01-20

- [x] Create OpenSearch index mapping for listings
- [x] Create ListingSearchService
- [x] Implement search endpoint with filters
- [x] Implement faceted search (aggregations)
- [x] Implement geo-search for location
- [x] Create async indexing via events

**Deliverables:**
1. **New Infrastructure Files (11 files):**
   - `src/infrastructure/search/opensearch.service.ts` - OpenSearch client wrapper with connection management
   - `src/infrastructure/search/types/search.types.ts` - Type definitions for search documents and queries
   - `src/infrastructure/search/dto/search.dto.ts` - DTOs with validation for search API
   - `src/infrastructure/search/mappings/listings.mapping.ts` - OpenSearch index template and mappings
   - `src/infrastructure/search/services/listing-search.service.ts` - Core search logic with query building
   - `src/infrastructure/search/services/indexing.service.ts` - Document indexing and reindexing logic
   - `src/infrastructure/search/listeners/search-event-handlers.service.ts` - Event subscribers for async indexing
   - `src/infrastructure/search/processors/search-index.processor.ts` - BullMQ processor for search jobs
   - `src/infrastructure/search/controllers/search.controller.ts` - Search API endpoints
   - `src/infrastructure/search/search.module.ts` - Module registration and DI setup
   - `src/infrastructure/search/index.ts` - Barrel exports

2. **Modified Files (3 files):**
   - `src/app.module.ts` - Imported SearchModule
   - `src/modules/listing/listing.repository.ts` - Added findDetailById() and findManyDetailed() methods

**Features Implemented:**
- Full-text search with autocomplete analyzer (edge_ngram)
- Multi-match query across title, description, location.address
- Price range filtering (scaled_float for precision)
- Location filters (city, state, country as keywords)
- Geo-distance search (search within radius of coordinates)
- Dynamic attribute filtering (vertical-specific attributes)
- Featured listings filter
- Vendor-scoped search
- Sorting (relevance, price, newest, oldest, title)
- Pagination with configurable page size
- Search result highlighting
- Faceted search with aggregations:
  - verticalTypes (terms aggregation)
  - cities (terms aggregation)
  - states (terms aggregation)
  - priceRanges (range aggregation with predefined buckets)
  - Real estate vertical facets: propertyTypes, bedrooms, bathrooms, furnishing, listingType
- Async event-driven indexing
- Bulk indexing for tenant reindexing
- Automatic index creation with mappings
- Vendor denormalization in search documents

**Search Architecture:**
- OpenSearch 2.x integration
- Event-driven indexing (listing.published, listing.updated, listing.unpublished, listing.archived, listing.deleted)
- BullMQ queue (search.index) with retry logic (3 attempts, exponential backoff)
- Tenant-isolated indexes (listings-{tenantId})
- Only PUBLISHED and EXPIRED listings indexed
- Index mappings include:
  - title with autocomplete analyzer + keyword + raw fields
  - price as scaled_float
  - location.coordinates as geo_point
  - attributes as dynamic object
  - vendor denormalized (id, name, slug)
  - timestamps for filtering and sorting

**API Endpoints:**
- GET /api/v1/search/listings - Main search endpoint
- GET /api/v1/search/suggestions - Autocomplete suggestions

**Query Parameters Supported:**
- q (text query)
- verticalType
- status (default: PUBLISHED)
- priceMin, priceMax
- city, state, country
- lat, lng, radius (geo-search)
- vendorId
- featuredOnly (boolean)
- sort (price:asc, price:desc, newest, oldest, title:asc, title:desc)
- page, pageSize (pagination)
- highlight (boolean)
- attr.{attributeName} (dynamic attribute filters)

**Compliance:**
- Part 9: Search architecture compliant (async indexing, read-optimized documents, event-driven, tenant isolation)
- Part 34: OpenSearch infrastructure compliant (index templates, mappings, aggregations, geo-search)

---

### Session 2.4: Media Management
**Completed:** 2026-01-20

- [x] Create Media entity in Prisma schema
- [x] Create S3 storage adapter
- [x] Implement presigned URL generation
- [x] Implement upload completion callback
- [x] Create media.module.ts, media.controller.ts, media.service.ts
- [x] Implement media CRUD endpoints

**Deliverables:**
1. **New Infrastructure Files (3 files):**
   - `src/infrastructure/storage/s3.service.ts` - S3 client wrapper with presigned URL generation
   - `src/infrastructure/storage/storage.module.ts` - Storage module
   - `src/infrastructure/storage/index.ts` - Barrel exports

2. **New Media Module Files (6 files):**
   - `src/modules/media/media.service.ts` - Media business logic with upload flow
   - `src/modules/media/media.repository.ts` - Media data access layer
   - `src/modules/media/media.controller.ts` - Media REST API
   - `src/modules/media/media.module.ts` - Media module configuration
   - `src/modules/media/dto/media.dto.ts` - Request/response DTOs
   - `src/modules/media/types/media.types.ts` - Type definitions
   - `src/modules/media/index.ts` - Barrel exports

3. **Modified Files (2 files):**
   - `prisma/schema.prisma` - Added Media model and ProcessingStatus enum
   - `src/app.module.ts` - Imported MediaModule

**Features Implemented:**
- **Presigned URL Upload Flow:**
  - Client requests presigned URL → Backend generates URL and creates pending media record → Client uploads to S3 → Client confirms upload → Backend verifies and updates media status
  - Upload flow prevents backend from streaming large files
  - Presigned URLs expire after 1 hour (configurable)
  - Upload verification ensures file exists in S3 before marking as complete

- **S3 Integration:**
  - S3Client initialization with configurable endpoint, region, credentials
  - Presigned URL generation for uploads (PUT) and downloads (GET)
  - Public URL generation (CDN or S3 direct)
  - Object existence verification
  - File metadata retrieval (size, content-type, etag, last-modified)
  - Single and bulk object deletion
  - Support for S3-compatible storage (MinIO, DigitalOcean Spaces, etc.)

- **Media Management:**
  - Polymorphic ownership (listing, vendor, user)
  - File type validation (IMAGE, VIDEO, DOCUMENT)
  - MIME type validation (JPEG, PNG, WebP, GIF, MP4, PDF, DOC)
  - File size limits (10MB images, 100MB videos, 20MB documents)
  - Visibility control (PUBLIC, PRIVATE)
  - Sorting and primary media designation
  - Soft delete with optional storage cleanup
  - Tenant isolation enforcement

- **Processing Status Tracking:**
  - PENDING → COMPLETED workflow
  - Processing metadata (width, height, duration, format)
  - Thumbnail URL placeholder (for async processing)
  - Processing failure handling (FAILED state)

- **Storage Key Generation:**
  - Format: media/{tenantId}/{ownerType}/{ownerId}/{uuid}{ext}
  - Unique storage keys prevent collisions
  - UUID-based naming for security
  - Preserves file extension

- **Media Repository:**
  - Tenant-scoped queries
  - Pagination support (max 100 per page)
  - Filtering by owner type, owner ID, media type, visibility
  - Soft delete implementation
  - Media count by owner

- **API Endpoints (6 endpoints):**
  - POST /api/v1/media/request-upload - Request presigned URL
  - POST /api/v1/media/:id/confirm-upload - Confirm upload completion
  - GET /api/v1/media - List media (paginated, filtered)
  - GET /api/v1/media/:id - Get media by ID
  - PATCH /api/v1/media/:id - Update media metadata
  - DELETE /api/v1/media/:id - Delete media (soft delete)

**Media Architecture:**
- Shared infrastructure across all verticals
- Metadata in PostgreSQL, binaries in S3
- Ownership via polymorphic relationship (ownerType + ownerId)
- Tenant isolation via tenantId
- Public media served via CDN
  - Private media served via presigned download URLs
- Async processing ready (thumbnailKey, processingStatus fields)

**Compliance:**
- Part 10 (Media, Assets & CDN Strategy):
  - ✅ S3-compatible object storage
  - ✅ Immutable objects (no in-place updates)
  - ✅ Soft deletes (logical, not physical)
  - ✅ Metadata in database, binaries in S3
  - ✅ Presigned URLs for uploads/downloads
  - ✅ Backend never streams large files
  - ✅ File size and type validation
  - ✅ Upload intent authorization
  - ✅ CDN integration ready
  - ✅ Tenant isolation
  - ✅ Ownership enforcement
  - ✅ Visibility control
- Part 27 (Database Schema):
  - ✅ Media model matches schema specification
  - ✅ ProcessingStatus enum defined
  - ✅ Polymorphic ownership (ownerType, ownerId)
  - ✅ All required fields present
  - ✅ Timestamps and soft delete

---

### Session 2.5: Interaction Module
**Completed:** 2026-01-20

- [x] Create Interaction/Message Prisma schema
- [x] Implement InteractionService
- [x] Create InteractionController
- [x] Add message handling
- [x] Implement status workflow

**Deliverables:**

*New Files (8 files):*
- `src/modules/interaction/interaction.module.ts` - Module configuration with DI setup
- `src/modules/interaction/interaction.service.ts` - Business logic with status workflow (205 lines)
- `src/modules/interaction/interaction.controller.ts` - REST API controller with 6 endpoints (118 lines)
- `src/modules/interaction/interaction.repository.ts` - Tenant-scoped data access (236 lines)
- `src/modules/interaction/interaction-message.repository.ts` - Message data access (77 lines)
- `src/modules/interaction/dto/interaction.dto.ts` - Request/response DTOs with validation (169 lines)
- `src/modules/interaction/types/interaction.types.ts` - TypeScript type definitions (75 lines)
- `src/modules/interaction/index.ts` - Barrel exports

*Modified Files (4 files):*
- `prisma/schema.prisma` - Added InteractionType/InteractionStatus enums, Interaction model, InteractionMessage model
- `src/app.module.ts` - Registered InteractionModule
- Relations added to `Tenant`, `Vendor`, `Listing` models

**Features Implemented:**

*Interaction Entity:*
- Full interaction lifecycle (NEW → CONTACTED → CONFIRMED → CLOSED/INVALID)
- Polymorphic relationships (vendor, listing, tenant)
- Three interaction types: LEAD, ENQUIRY, BOOKING
- Contact information capture (name, email, phone)
- Optional message and booking data (JSON)
- Source tracking (web, mobile, api)
- Referrer tracking for analytics
- Timestamp tracking (created, updated, contacted, closed)

*InteractionMessage Entity:*
- Threaded messaging within interactions
- Sender type classification (vendor, customer, system)
- Internal notes support (not visible to customers)
- Chronological message ordering
- Cascade deletion with parent interaction

*State Machine Workflow:*
- Valid transitions enforced:
  - NEW → CONTACTED (vendor responds)
  - NEW → INVALID (spam/invalid)
  - CONTACTED → CONFIRMED (booking confirmed)
  - CONTACTED → CLOSED (resolved)
  - CONFIRMED → CLOSED (booking complete)
- Invalid transitions rejected with BadRequestException
- Status timestamps automatically set (contactedAt, closedAt)

*Interaction Repository (Tenant-Scoped):*
- `create()` - Create interaction with automatic tenant scoping
- `findById()` - Retrieve with vendor/listing relations
- `findMany()` - Paginated list with filters (vendor, listing, type, status)
- `findByVendor()` - All interactions for specific vendor
- `findByListing()` - All interactions for specific listing
- `updateStatus()` - Status updates with timestamp management
- `countByStatus()` - Analytics aggregation by status
- All queries enforce tenant isolation

*Message Repository:*
- `create()` - Add message to interaction
- `findByInteractionId()` - Get all messages for interaction
- `findMany()` - Paginated message retrieval
- Chronological ordering (oldest first)

*Interaction Service:*
- Create interactions with validation
- Find all with pagination and filtering
- Find by ID with error handling
- Update status with state machine validation
- Add messages to interactions
- Get messages for interaction
- Domain event emission:
  - `interaction.created`
  - `interaction.status.updated`
  - `interaction.message.added`

*REST API Endpoints (6):*
1. `POST /interactions` - Create new interaction
2. `GET /interactions` - List with filters (vendorId, listingId, type, status, page, pageSize)
3. `GET /interactions/:id` - Get single interaction
4. `PATCH /interactions/:id/status` - Update interaction status
5. `POST /interactions/:id/messages` - Add message to interaction
6. `GET /interactions/:id/messages` - Get messages for interaction

*DTOs with Validation:*
- `CreateInteractionDto` - Vendor ID, listing ID, vertical type, interaction type, contact info, message, booking data, source
- `UpdateInteractionStatusDto` - New status (enum validation)
- `AddMessageDto` - Sender type, sender ID, sender name, message, isInternal flag
- `InteractionQueryDto` - Filters with pagination (vendorId, listingId, type, status, page, pageSize)

*Interaction Architecture:*
- Generic interaction core (vertical-agnostic)
- Minimal PII capture (contact info only)
- Booking data in JSON for flexibility
- Event-driven for decoupling
- Monetization-aware (usage tracking via events)
- Append-only except status updates
- No CRM/chat features (out of scope per Part 11)

*Compliance:*
- Follows Part 11 (Leads, Enquiries & Booking Core) specifications
- Follows Part 27 (Database Schema - Interaction section)
- Tenant isolation enforced
- State machine transitions validated
- Domain events for side effects
- Separation of concerns (core vs vertical extensions)

---

### Session 2.6: Review Module
**Completed:** 2026-01-20

- [x] Create Review Prisma schema
- [x] Implement ReviewService
- [x] Create ReviewController
- [x] Add moderation workflow
- [x] Calculate vendor ratings

**Deliverables:**

*New Files (7 files):*
- `src/modules/review/review.module.ts` - Module configuration with DI setup
- `src/modules/review/review.service.ts` - Business logic with moderation workflow (204 lines)
- `src/modules/review/review.controller.ts` - REST API controller with 7 endpoints (168 lines)
- `src/modules/review/review.repository.ts` - Tenant-scoped data access (308 lines)
- `src/modules/review/dto/review.dto.ts` - Request/response DTOs with validation (175 lines)
- `src/modules/review/types/review.types.ts` - TypeScript type definitions (53 lines)
- `src/modules/review/index.ts` - Barrel exports

*Modified Files (4 files):*
- `prisma/schema.prisma` - Added ReviewStatus enum and Review model
- `src/app.module.ts` - Registered ReviewModule
- Relations added to `Tenant`, `Vendor`, `Listing` models

**Features Implemented:**

*Review Entity:*
- Full moderation lifecycle (PENDING → APPROVED/REJECTED/FLAGGED)
- Polymorphic relationships (vendor, listing, tenant)
- Target types: vendor, listing
- Anonymized reviewer references (privacy-compliant)
- Rating system (1-5 scale)
- Optional title and content
- Timestamp tracking (created, updated, moderated, responded)
- Moderation workflow with notes
- Vendor response capability

*Moderation State Machine:*
- Valid transitions enforced:
  - PENDING → APPROVED (visible to public)
  - PENDING → REJECTED (hidden from public)
  - PENDING → FLAGGED (requires investigation)
  - FLAGGED → APPROVED (after investigation)
  - FLAGGED → REJECTED (confirmed violation)
- Terminal states: APPROVED, REJECTED (immutable)
- Moderator tracking (who approved/rejected)
- Moderation notes for internal reference

*Rating Aggregation:*
- Calculate average rating for targets (vendor/listing)
- Rating distribution (1-5 stars histogram)
- Total review count
- Only APPROVED reviews count towards ratings
- Precision: 1 decimal place

*ReviewRepository (308 lines):*
- create() - creates with PENDING status, anonymized reviewer ref
- findById() - tenant-scoped with vendor/listing relations
- findMany() - paginated with filters (targetType, targetId, status, rating)
- findByTarget() - get all reviews for specific vendor/listing
- updateStatus() - moderation with timestamp tracking
- addVendorResponse() - vendors can respond to approved reviews
- calculateAverageRating() - rating aggregation with distribution
- countByStatus() - analytics by moderation status

*ReviewService (204 lines):*
- create() - validates rating range (1-5), emits review.created event
- findAll() - paginated with filters
- findById() - with error handling
- moderateReview() - validates state transitions, emits review.moderated event
- addVendorResponse() - only for approved reviews, same vendor only
- getRatingAggregation() - calculates average rating and distribution
- getReviewsByTarget() - retrieves reviews by target (vendor/listing)
- validateModerationTransition() - state machine guard logic

*ReviewController (168 lines):*
- POST /reviews - create review
- GET /reviews - list with pagination and filters
- GET /reviews/:id - get single review
- PATCH /reviews/:id/moderate - moderate review (admin)
- POST /reviews/:id/response - add vendor response
- GET /reviews/target/:targetType/:targetId/rating - get rating aggregation
- GET /reviews/target/:targetType/:targetId - get all reviews for target

*Trust System Architecture:*
- Anonymized reviewer references (no PII exposure)
- Immutable approved/rejected reviews (audit trail)
- Vendor response capability (engagement)
- Internal moderation notes (not visible to public)
- Spam/abuse detection ready (FLAGGED status)
- Moderation workflow logging
- Terminal state enforcement

*Compliance with Part 12:*
- ✅ Reviewer anonymization (reviewerRef hashed)
- ✅ Moderation workflow (PENDING → APPROVED/REJECTED/FLAGGED)
- ✅ Immutable approved reviews
- ✅ Trust signals (rating aggregation)
- ✅ Event-driven architecture (3 events)
- ✅ Audit trail (moderation timestamps/notes)
- ✅ Privacy compliant (no PII in reviews)
- ✅ Vendor engagement (response capability)

---

### Session 2.7: Subscription & Plans Module
**Completed:** 2026-01-20

- [x] Create Plan Prisma schema (entitlements, pricing)
- [x] Create Subscription Prisma schema (lifecycle, overrides)
- [x] Create EntitlementSnapshot schema (caching)
- [x] Create UsageCounter schema (tracking)
- [x] Implement PlanService with validation
- [x] Implement SubscriptionService with state machine
- [x] Implement EntitlementService with caching
- [x] Implement UsageService with threshold detection
- [x] Create PlanController (7 endpoints)
- [x] Create SubscriptionController (7 endpoints)

**Deliverables:**

*New Files (13 files):*
- `src/modules/subscription/subscription.module.ts` - Module configuration with DI setup (47 lines)
- `src/modules/subscription/types/subscription.types.ts` - Type definitions (156 lines)
- `src/modules/subscription/dto/subscription.dto.ts` - DTOs with validation (370 lines)
- `src/modules/subscription/repositories/plan.repository.ts` - Plan data access (152 lines)
- `src/modules/subscription/repositories/subscription.repository.ts` - Subscription data access (168 lines)
- `src/modules/subscription/repositories/usage.repository.ts` - Usage tracking data access (146 lines)
- `src/modules/subscription/services/plan.service.ts` - Plan business logic (190 lines)
- `src/modules/subscription/services/subscription.service.ts` - Subscription lifecycle (204 lines)
- `src/modules/subscription/services/entitlement.service.ts` - Entitlement resolution (240 lines)
- `src/modules/subscription/services/usage.service.ts` - Usage tracking (201 lines)
- `src/modules/subscription/controllers/plan.controller.ts` - Plan REST API (141 lines)
- `src/modules/subscription/controllers/subscription.controller.ts` - Subscription REST API (131 lines)
- `src/modules/subscription/index.ts` - Barrel exports

*Modified Files (2 files):*
- `prisma/schema.prisma` - Added SubscriptionStatus enum, Plan/Subscription/EntitlementSnapshot/UsageCounter models
- `src/app.module.ts` - Registered SubscriptionModule

**Features Implemented:**

*Plan Entity:*
- Declarative entitlements (JSON configuration)
- Multi-currency pricing (MYR default)
- Monthly and yearly pricing (Decimal precision)
- Public/private plans (visibility control)
- Active/inactive status (lifecycle management)
- Unique slug for identification
- Detailed descriptions
- Timestamps (created, updated)

*Subscription Entity:*
- Tenant-level subscriptions (one per tenant)
- Subscription lifecycle states (ACTIVE, PAST_DUE, PAUSED, CANCELLED)
- Current period tracking (start/end dates)
- External provider integration (ID + provider name)
- Enterprise overrides (custom entitlements JSON)
- Cancellation tracking (timestamp)
- Tenant and plan relations
- Unique tenantId constraint

*EntitlementSnapshot Entity:*
- Cached resolved entitlements (1-hour TTL)
- Plan reference tracking
- Override tracking
- Computation timestamp
- Expiration timestamp
- Unique tenantId constraint

*UsageCounter Entity:*
- Tenant-scoped usage tracking
- Metric key classification
- Period-based counting (monthly)
- Idempotent increment (upsert pattern)
- Unique constraint on [tenantId, metricKey, periodStart]
- Timestamps (created, updated)

*Subscription State Machine:*
- Valid transitions:
  - ACTIVE → PAST_DUE (payment failed)
  - ACTIVE → PAUSED (manual suspension)
  - ACTIVE → CANCELLED (permanent cancellation)
  - PAST_DUE → ACTIVE (payment recovered)
  - PAST_DUE → CANCELLED (grace period expired)
  - PAUSED → ACTIVE (resume subscription)
  - PAUSED → CANCELLED (cancel while paused)
  - CANCELLED → [terminal state - no transitions]
- Invalid transitions rejected with BadRequestException
- Status timestamps automatically set

*PlanRepository (152 lines):*
- create() - converts Decimal, casts entitlements as Prisma.InputJsonValue
- findById() - retrieve by ID
- findBySlug() - retrieve by slug
- findMany() - paginated with isActive/isPublic filters
- update() - explicit Prisma.InputJsonValue typing
- activate() - set isActive=true
- deactivate() - set isActive=false (soft delete)
- delete() - delegates to deactivate
- countSubscriptions() - validation before deactivation

*SubscriptionRepository (168 lines):*
- create() - tenant-scoped with plan relation, casts overrides
- findByTenantId() - retrieve with plan relation
- findCurrent() - get current tenant subscription
- update() - explicit Prisma.InputJsonValue typing
- updateStatus() - status transitions with validation
- cancel() - sets CANCELLED + cancelledAt timestamp
- changePlan() - updates planId + effectiveDate
- findByPlanId() - analytics query
- countActive() - count active subscriptions
- countByStatus() - aggregation by status

*UsageRepository (146 lines):*
- increment() - upsert for idempotency on unique constraint
- getCurrent() - retrieve specific period usage
- getHistory() - time-based query
- getAllForPeriod() - all metrics for tenant
- getTotalsByMetric() - groupBy aggregation for analytics

*PlanService (190 lines):*
- create() - validates slug uniqueness + entitlements structure, emits plan.created
- findAll() - paginated retrieval
- findById() - with NotFoundException
- findBySlug() - by slug with error handling
- update() - validates entitlements if provided, emits plan.updated
- activate() - enables plan, emits plan.activated
- deactivate() - prevents if active subscriptions exist, emits plan.deactivated
- delete() - delegates to deactivate
- validateEntitlements() - structure + non-negative limit validation

*SubscriptionService (204 lines):*
- assign() - checks existing, validates plan active, emits subscription.created
- getCurrent() - retrieves current tenant subscription
- getByTenantId() - retrieves by tenant ID
- updateStatus() - validates transitions via state machine, emits subscription.status_changed
- changePlan() - validates new plan exists/active, prevents same plan, emits subscription.plan_changed
- cancel() - sets CANCELLED status, emits subscription.cancelled
- validateStatusTransition() - state machine guard logic

*EntitlementService (240 lines):*
- resolve() - checks cache (1hr TTL) → compute → cache
- check() - validates boolean/numeric entitlements
- checkQuota() - validates usage against limits
- invalidate() - clears entitlement cache
- computeEntitlements() - merges plan entitlements + overrides:
  - Listing limits (global + per-vertical)
  - Interaction limits
  - Media limits (upload size, storage)
  - Feature flags (array)
  - Vertical access (array)
  - API rate limits (requests per minute)
- getFreeTierEntitlements() - fallback when no subscription:
  - 3 listings max
  - 10 interactions
  - 10MB upload limit
  - 1GB storage
  - 30 API requests/min
- cacheEntitlements() - stores in EntitlementSnapshot with Prisma.DbNull for nulls

*UsageService (201 lines):*
- increment() - async/idempotent, checks thresholds after increment, emits usage.incremented
- getCurrent() - returns UsageSummary {metricKey, currentPeriod: {count, dates}, limit, percentage}
- getUsage() - retrieves usage for specific period
- getHistory() - retrieves historical usage
- getAllCurrent() - all metrics for current period with limits/percentages
- checkThreshold() - emits events:
  - usage.threshold.warning at 80%
  - usage.threshold.reached at 100%
- getCurrentPeriod() - calculates monthly boundaries (1st to end of month)

*PlanController (141 lines):*
1. POST /plans - create plan (converts Decimal, casts entitlements)
2. GET /plans - list with pagination (isActive, isPublic filters)
3. GET /plans/:id - get single plan
4. PATCH /plans/:id - update plan
5. PATCH /plans/:id/activate - activate plan
6. PATCH /plans/:id/deactivate - deactivate plan
7. DELETE /plans/:id - soft delete plan

*SubscriptionController (131 lines):*
1. GET /subscriptions/current - get current tenant subscription
2. POST /subscriptions/assign - assign subscription to tenant
3. PATCH /subscriptions/status - update subscription status
4. POST /subscriptions/change-plan - change plan
5. POST /subscriptions/cancel - cancel subscription
6. GET /subscriptions/entitlements - get resolved entitlements
7. GET /subscriptions/usage - get usage summary

*PlanEntitlements Structure:*
```typescript
{
  listings: {
    limit: number,              // total limit across all verticals
    verticals: {
      real_estate: number,      // per-vertical limits
      automotive: number,
      job_market: number,
      marketplace: number
    }
  },
  interactions: {
    limit: number               // total interactions allowed
  },
  media: {
    uploadSizeLimit: number,    // MB
    storageSizeLimit: number    // GB
  },
  features: string[],           // feature flags
  verticals: string[],          // enabled verticals
  api: {
    requestsPerMinute: number   // rate limit
  },
  [key: string]: unknown        // extensible
}
```

*Subscription Architecture:*
- Declarative plans (not procedural code)
- Billing provider abstraction (external IDs only, domain logic independent)
- Entitlements as gatekeepers (resolved per tenant)
- Usage tracking observational (eventual consistency, non-blocking)
- Multi-vertical support (per-vertical limits)
- Free tier fallback (default entitlements when no subscription)
- Enterprise customization (JSON overrides at subscription level)
- Event-driven architecture (9 domain events)
- Tenant isolation enforced
- Caching for performance (1-hour TTL)
- Idempotent operations (upsert for usage)
- State machine for subscription lifecycle
- Monthly usage periods with automatic boundaries
- Threshold detection (80% warning, 100% critical)
- Soft limits vs hard limits (configurable)

*Monetization Features:*
- Subscription-based revenue model
- Multi-tier pricing (monthly/yearly)
- Usage tracking for quota enforcement
- Entitlement-based access control
- Free tier for onboarding
- Enterprise custom pricing (overrides)
- Plan lifecycle management
- Subscription lifecycle management
- Billing provider ready (external ID support)
- Revenue analytics ready (usage data)

*Domain Events (9 events):*
- plan.created - new plan created
- plan.updated - plan modified
- plan.activated - plan enabled
- plan.deactivated - plan disabled
- subscription.created - subscription assigned
- subscription.status_changed - status transition
- subscription.plan_changed - plan upgrade/downgrade
- subscription.cancelled - subscription ended
- usage.incremented - usage tracked
- usage.threshold.warning - 80% threshold
- usage.threshold.reached - 100% threshold

*Compliance with Part 16-18:*
- ✅ Declarative entitlements (JSON config)
- ✅ Billing provider abstraction (domain logic independent)
- ✅ Subscription lifecycle (state machine)
- ✅ Entitlement caching (1hr TTL)
- ✅ Usage tracking (observational, non-blocking)
- ✅ Multi-vertical support (per-vertical limits)
- ✅ Free tier fallback
- ✅ Enterprise overrides
- ✅ Event-driven architecture
- ✅ Tenant isolation
- ✅ Threshold detection
- ✅ Idempotent operations
- ✅ Period management (monthly)
- ✅ Decimal precision for pricing

---

### Session 2.7b: Billing Provider Integration
**Completed:** 2026-01-20

- [x] Create BillingProvider interface
- [x] Implement StripeBillingProvider
- [x] Create PaymentIntent flow
- [x] Implement webhook handler
- [x] Create Invoice entity
- [x] Implement payment method management

**Deliverables:**

*New Files (10 files):*
- `src/infrastructure/billing/interfaces/billing-provider.interface.ts` - Provider abstraction (155 lines)
- `src/infrastructure/billing/providers/stripe-billing.provider.ts` - Stripe implementation (253 lines)
- `src/infrastructure/billing/listeners/billing-event.handler.ts` - Event-driven billing sync (92 lines)
- `src/infrastructure/billing/controllers/stripe-webhook.controller.ts` - Webhook endpoint (70 lines)
- `src/infrastructure/billing/repositories/payment-event.repository.ts` - Idempotency tracking (94 lines)
- `src/infrastructure/billing/services/stripe-webhook.service.ts` - Webhook routing (236 lines)
- `src/infrastructure/billing/repositories/invoice.repository.ts` - Invoice data access (86 lines)
- `src/infrastructure/billing/services/invoice.service.ts` - Invoice business logic (95 lines)
- `src/infrastructure/billing/billing.module.ts` - Module configuration (40 lines)
- `src/infrastructure/billing/index.ts` - Barrel exports

*Modified Files (4 files):*
- `prisma/schema.prisma` - Added InvoiceStatus/PaymentStatus enums, Invoice/PaymentMethod/PaymentEvent models
- `.env.example` - Added Stripe configuration
- `src/app.module.ts` - Registered BillingModule
- `package.json` - Added stripe@20.2.0 dependency

**Features Implemented:**

*BillingProvider Interface:*
- Provider-agnostic abstraction (supports Stripe, PayPal, Xendit, manual invoicing)
- 11 methods:
  - createCustomer(), getCustomer() - customer management
  - createSubscription(), updateSubscription(), cancelSubscription(), getSubscription() - subscription lifecycle
  - createPaymentIntent() - payment processing
  - attachPaymentMethod() - payment method management
  - getInvoices(), getInvoice() - invoice retrieval
  - verifyWebhookSignature(), parseWebhookEvent() - webhook security
- Type definitions: BillingCustomer, BillingSubscription, BillingPaymentIntent, BillingPaymentMethod, BillingInvoice

*StripeBillingProvider:*
- Full Stripe SDK integration (v20.2.0, API version 2025-12-15.clover)
- Customer creation with metadata (tenantId for webhook routing)
- Subscription creation with payment_behavior='default_incomplete'
- Payment intent creation with automatic_payment_methods
- Webhook signature verification using Stripe secret
- Mapping helpers for Stripe → domain types
- Decimal conversion (Stripe uses cents, local uses Decimal)

*Invoice Entity:*
- 16 fields: id, tenantId, externalId, externalProvider, subscriptionId, customerId, amount, currency, status, dueDate, paidAt, invoiceUrl, invoicePdf, metadata, timestamps
- InvoiceStatus enum: DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE
- Relations: tenant, subscription
- Indexes: tenantId, subscriptionId, externalId, status

*PaymentMethod Entity:*
- 14 fields: id, tenantId, externalId, externalProvider, type, last4, brand, expiryMonth, expiryYear, isDefault, metadata, timestamps
- Relations: tenant
- Indexes: tenantId, externalId, isDefault

*PaymentEvent Entity:*
- 13 fields: id, tenantId, externalId (unique for idempotency), externalProvider, eventType, resourceType, resourceId, processed, processedAt, payload, error, retryCount, timestamps
- PaymentStatus enum: PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELED
- Relations: tenant
- Indexes: tenantId, externalId (unique), processed, eventType
- Idempotency enforcement via unique externalId constraint

*Event-Driven Architecture:*
- BillingEventHandler listens to domain events:
  - subscription.created → creates Stripe customer
  - subscription.cancelled → cancels Stripe subscription
  - subscription.plan_changed → updates Stripe subscription priceId
  - usage.threshold.reached → logs for future usage-based billing
- All billing operations fail gracefully (logged, never throw)
- Billing never blocks domain operations

*Webhook Infrastructure:*
- POST /webhooks/stripe endpoint
- Signature verification (Stripe-Signature header)
- Idempotent processing (PaymentEvent.externalId unique constraint)
- Async processing (doesn't block webhook response)
- Retry logic (max 5 attempts with error tracking)
- Routes 7 event types:
  - payment_intent.succeeded → billing.payment.succeeded
  - payment_intent.payment_failed → billing.payment.failed
  - invoice.paid → updates DB, emits billing.invoice.paid + billing.subscription.payment_succeeded
  - invoice.payment_failed → emits billing.invoice.payment_failed + billing.subscription.payment_failed
  - customer.subscription.created/updated → billing.subscription.updated
  - customer.subscription.deleted → billing.subscription.deleted

*Invoice Management:*
- InvoiceRepository: create(), findByTenantId(), findByExternalId(), findById(), updateStatus(), findBySubscriptionId()
- InvoiceService: createFromProvider(), syncFromProvider(), findByTenantId(), findById(), findBySubscriptionId()
- Sync invoice data from Stripe to local database
- Emit invoice.created event

*Architecture Principles:*
- ✅ Billing as replaceable adapter (interface-based)
- ✅ Event-driven integration (listens to subscription.*, emits billing.*)
- ✅ Idempotent webhook processing (PaymentEvent deduplication)
- ✅ Security (signature verification, no PCI scope)
- ✅ Graceful degradation (billing failures don't block users)
- ✅ Tenant scoping (metadata in Stripe, tenantId in all tables)
- ✅ State synchronization (webhooks update Invoice + emit events)
- ✅ Provider metadata strategy (tenantId in Stripe customer/subscription metadata)
- ✅ "Billing collects money. Entitlements grant access." - billing never authoritative

*Domain Events (9 billing events):*
- billing.payment.succeeded
- billing.payment.failed
- billing.invoice.paid
- billing.invoice.payment_failed
- billing.subscription.updated
- billing.subscription.deleted
- billing.subscription.payment_succeeded
- billing.subscription.payment_failed
- invoice.created

*Compliance with Part 19:*
- ✅ BillingProvider abstraction (swappable providers)
- ✅ Stripe integration (full SDK support)
- ✅ PaymentIntent flow
- ✅ Webhook handler (secure, idempotent)
- ✅ Invoice entity (full lifecycle)
- ✅ Payment method management
- ✅ Event-driven side effects
- ✅ Tenant isolation
- ✅ Retry logic
- ✅ Security (signature verification)
- ✅ No PCI compliance scope (Stripe handles cards)

---

### Session 2.7c: Pricing Models Configuration
**Completed:** 2026-01-20

- [x] Create PricingModel entity (SaaS, LEAD_BASED, COMMISSION, HYBRID)
- [x] Implement SaaS flat-fee pricing logic
- [x] Implement lead-based pricing (pay-per-lead)
- [x] Implement commission-based pricing (percentage of transaction)
- [x] Create TenantPricingConfig for tenant-specific pricing
- [x] Implement pricing calculation service

**Deliverables:**

*New Files (10 files, ~2,100 lines):*
- `src/modules/pricing/types/pricing.types.ts` - Pricing model interfaces and types (139 lines)
- `src/modules/pricing/dto/pricing.dto.ts` - Request/response DTOs with validation (400 lines)
- `src/modules/pricing/repositories/pricing-config.repository.ts` - Data access layer (294 lines)
- `src/modules/pricing/strategies/saas-pricing.strategy.ts` - SaaS subscription pricing (85 lines)
- `src/modules/pricing/strategies/lead-based-pricing.strategy.ts` - Pay-per-lead pricing (108 lines)
- `src/modules/pricing/strategies/commission-pricing.strategy.ts` - Percentage-based pricing (122 lines)
- `src/modules/pricing/services/pricing-calculation.service.ts` - Orchestration service (201 lines)
- `src/modules/pricing/pricing.controller.ts` - REST API (11 endpoints, 266 lines)
- `src/modules/pricing/pricing.module.ts` - Module configuration (30 lines)
- `src/modules/pricing/index.ts` - Barrel exports

*Modified Files (2 files):*
- `prisma/schema.prisma` - Added PricingModel/ChargeType enums, PricingConfig/PricingRule/ChargeEvent models
- `src/app.module.ts` - Registered PricingModule

**Features Implemented:**

*Strategy Pattern Architecture:*
- IPricingStrategy interface: calculateCharge(), validateConfig(), getModelType()
- Composable strategies in Map<PricingModel, IPricingStrategy>
- Easy extensibility for new pricing models

*Pricing Models:*
1. **SaaS Pricing (Flat-Fee Subscription):**
   - Monthly and yearly pricing (different rates)
   - Feature list configuration
   - Applies to subscription.* events

2. **Lead-Based Pricing (Pay-Per-Lead):**
   - Configurable price per lead
   - Free quota support (X leads free, charge overages)
   - Vertical-specific pricing (different prices for real_estate vs automotive)
   - Applies to interaction.created events
   - Checks currentUsage vs freeQuota for overage detection

3. **Commission-Based Pricing (Percentage):**
   - Percentage-based charges (0-100%)
   - Minimum commission cap (floor)
   - Maximum commission cap (ceiling)
   - Optional flat fee addition (hybrid approach)
   - Applies to confirmed/transaction events
   - Detailed calculation metadata

4. **Hybrid Pricing (Combined):**
   - Combines multiple pricing models
   - Tenant selects which models to activate
   - Example: SaaS base fee + lead-based overages + commission on transactions

*Database Models:*
- **PricingConfig:** Tenant-level pricing configuration (model type, name, config JSON, vertical ID, isActive)
- **PricingRule:** Event-based rules (eventType, chargeType, amount, conditions JSON, isActive)
- **ChargeEvent:** Charge tracking (chargeType, amount, eventType, resourceType, resourceId, processed flag, invoiceId, metadata)

*Enums:*
- **PricingModel:** SAAS, LEAD_BASED, COMMISSION, LISTING_BASED, HYBRID
- **ChargeType:** SUBSCRIPTION, LEAD, INTERACTION, COMMISSION, LISTING, ADDON, OVERAGE

*PricingConfigRepository (294 lines):*
- createConfig() - creates config with JSON validation
- findConfigs() - paginated with filters (model, isActive, verticalId)
- findActiveConfigs() - gets active configs for eventType
- updateConfig() - updates config
- deleteConfig() - soft delete
- createRule() - creates pricing rule with conditions JSON
- updateRule() / deleteRule() - rule management
- createChargeEvent() - records charge with processed=false
- findChargeEvents() - paginated with filters (chargeType, processed, date range)
- markChargeEventProcessed() - sets processed=true + processedAt
- getChargeSummary() - aggregates pending/processed totals + breakdown by type

*SaasPricingStrategy (85 lines):*
- Validates monthlyFee >= 0, yearlyFee optional
- Only applies to subscription.* events
- Returns monthly or yearly fee based on metadata.period
- ChargeType: SUBSCRIPTION

*LeadBasedPricingStrategy (108 lines):*
- Validates pricePerLead + verticalPricing map
- Only applies to interaction.created events
- Checks vertical-specific pricing (verticalPricing map)
- Validates currentUsage vs freeQuota (no charge if under quota)
- ChargeType: LEAD
- Metadata includes overage status

*CommissionPricingStrategy (122 lines):*
- Validates commissionPercentage 0-100, min/max optional
- Applies to confirmed/transaction events
- Requires input.amount (transaction value)
- Calculates: amount * (percentage / 100)
- Applies minimumCommission floor
- Applies maximumCommission cap
- Adds flatFee if configured
- ChargeType: COMMISSION
- Detailed calculation metadata (baseAmount, percentage, commission, flatFee, caps applied)

*PricingCalculationService (201 lines):*
- Registers all strategies in Map
- calculateChargeForEvent():
  - Gets active configs for tenant
  - Iterates rules matching eventType
  - Checks rule conditions (verticalId, listingType, interactionType, amount range)
  - Executes strategy.calculateCharge()
  - Creates charge event if shouldCharge=true
  - Emits charge.created domain event
- createChargeEvent() - records charge + emits event
- matchesConditions() - validates rule filters
- validatePricingConfig() - delegates to strategy.validateConfig()
- getChargeSummary() - aggregates charge totals

*PricingController (11 endpoints, 266 lines):*
- POST /api/v1/pricing/configs - create pricing config
- GET /api/v1/pricing/configs - list configs (paginated, filtered)
- GET /api/v1/pricing/configs/:id - get single config with rules
- PATCH /api/v1/pricing/configs/:id - update config (validates if config changed)
- DELETE /api/v1/pricing/configs/:id - delete config
- POST /api/v1/pricing/rules - create rule (validates config ownership)
- PATCH /api/v1/pricing/rules/:id - update rule
- DELETE /api/v1/pricing/rules/:id - delete rule
- POST /api/v1/pricing/calculate - calculate charge for event (no save, just calculation)
- GET /api/v1/pricing/charges - list charge events (paginated, filtered)
- GET /api/v1/pricing/charges/summary - get charge summary (pending/processed totals + breakdown)

*Rule-Based Matching:*
- PricingRuleConditions interface:
  - verticalId?: string (filter by vertical)
  - listingType?: string (filter by property type)
  - interactionType?: string (filter by interaction type)
  - minAmount?: number (minimum transaction amount)
  - maxAmount?: number (maximum transaction amount)
  - customFilters?: Record<string, unknown> (extensible)
- matchesConditions() validates all filters against input
- Rules only apply when conditions match

*Architecture Principles:*
- ✅ Configuration-driven pricing ("Pricing is CONFIG, not code")
- ✅ Tenant-customizable (each tenant configures own PricingConfig)
- ✅ Strategy pattern (new models just add new strategy implementation)
- ✅ Composable (Hybrid model combines multiple strategies)
- ✅ Vertical-aware (verticalPricing map in LeadBasedPricingConfig)
- ✅ Event-driven (charges triggered by domain events)
- ✅ Transparent calculations (ChargeCalculationResult includes reason + metadata)
- ✅ Flexible filtering (conditions filter rule applicability)
- ✅ Free tier support (freeQuota in lead-based)
- ✅ Commission caps (min/max limits prevent extreme charges)
- ✅ Idempotent processing (ChargeEvent.processed flag)
- ✅ Analytics support (getChargeSummary with breakdown)
- ✅ Tenant isolation (all entities scoped by tenantId)
- ✅ Pagination (all list endpoints support page/pageSize)

*Compliance with Part 20:*
- ✅ Declarative pricing (JSON configs in database)
- ✅ Tenant-configurable (PricingConfig per tenant)
- ✅ SaaS flat-fee model (monthly/yearly pricing)
- ✅ Lead-based model (pay-per-lead with free quota)
- ✅ Commission model (percentage with caps)
- ✅ Hybrid model (combine multiple strategies)
- ✅ Vertical-aware pricing (different prices per vertical)
- ✅ Rule-based matching (conditions filter applicability)
- ✅ Event-driven charges (triggered by domain events)
- ✅ Free tier support (freeQuota before charging)
- ✅ Transparent calculations (reason + metadata)
- ✅ No code changes for new models (strategy pattern)
- ✅ Analytics (charge summary with breakdowns)
- ✅ Idempotent (processed flag prevents duplicates)

*Domain Events:*
- charge.created - emitted when charge event recorded

---

### Session 2.8: Notification Module
- [x] Create Notification Prisma schema
- [x] Create NotificationTemplate entity
- [x] Create NotificationService
- [x] Implement email provider integration
- [x] Create in-app notification endpoints
- [x] Implement event-driven notifications

**Deliverables:**
- `src/modules/notification/notification.module.ts` ✅
- `src/modules/notification/services/notification.service.ts` ✅
- `src/modules/notification/controllers/notification.controller.ts` ✅
- `src/modules/notification/repositories/notification.repository.ts` ✅
- `src/modules/notification/providers/smtp-email.provider.ts` ✅
- `src/modules/notification/providers/sendgrid-email.provider.ts` (placeholder) ✅
- `src/modules/notification/listeners/notification.handlers.ts` ✅
- Email provider integration (SMTP via nodemailer) ✅
- Event-driven delivery pattern (EventEmitter2) ✅
- Multi-channel support (EMAIL, IN_APP, SMS, PUSH, WhatsApp) ✅
- User preference management (opt-out model) ✅
- Template rendering (Handlebars) ✅

**Session Status:** ✅ **COMPLETED** (2025-01-20)

---

### Session 2.9: Event-Driven Architecture
- [x] Create EventBus service wrapping EventEmitter2
- [x] Define domain events (40+ events across 12 domains)
- [x] Implement event handlers (SearchIndexEventHandler)
- [x] Add event logging (EventLogService with wildcard listener)
- [x] Connect modules via events (listing service emits domain events)
- [x] Add EventLog Prisma model for audit trail
- [x] Create event sourcing foundation with replay capability
- [x] Add TenantContext correlationId and userId tracking

**Deliverables:**
- `src/infrastructure/events/event-bus.service.ts`
- `src/infrastructure/events/services/event-log.service.ts`
- `src/infrastructure/events/domain/*.events.ts` (40+ events)
- `src/infrastructure/events/handlers/search-index.handler.ts`
- `src/infrastructure/events/events.module.ts` (@Global module)
- `prisma/schema.prisma` (EventLog model)
- `src/modules/listing/listing.service.ts` (updated to emit events)

**Events Implemented:**
- Listing: created, updated, published, unpublished, expired, archived, featured (7)
- Vendor: created, approved, rejected, suspended, verified (5)
- Interaction: lead.created, booking.created, status.updated, booking.confirmed (4)
- Review: created, approved, rejected, responded (4)
- Subscription: created, planChanged, renewed, cancelled, pastDue (5)
- Billing: payment.succeeded, payment.failed, invoice.issued (3)
- Media: uploaded, processed, deleted (3)
- Tenant: created, updated, suspended, reactivated (4)
- User: registered, email_verified, password_changed, tenant_membership.added, tenant_membership.removed (5)
- Entitlement: computed, exceeded (2)
- Usage: incremented, threshold.warning, period.reset (3)
- Search: index.requested, index.completed (2)
- Notification: notification.created, delivery.completed (2)
- Feature Flags: flag.updated (1)

**Total:** 40 domain events

---

### ✅ Phase 2 Checkpoint

Before proceeding to Phase 3, verify:

- [x] All CRUD operations work (users, vendors, listings)
- [x] Vendor approval workflow complete
- [x] Listing status transitions work
- [x] State machines enforcing valid transitions
- [x] Media upload/download functional
- [x] Interactions create and message
- [x] Reviews with moderation work
- [x] Subscriptions can be assigned
- [x] Billing provider integration (test mode)
- [x] Pricing models configurable
- [x] Notifications delivered (event system)
- [x] Events propagate correctly (EventEmitter2)
- [x] All tests passing (unit + E2E: 96 total)

---

## ⚡ Phase 3: Real-Time & Verticals (6 Sessions)

### Session 3.1: WebSocket Infrastructure
**Completed:** 2026-01-21

- [x] Setup Socket.IO with Redis adapter
- [x] Create WebSocket gateway structure
- [x] Implement namespace structure (/tenant, /vendor, /notifications)
- [x] Implement room-based messaging
- [x] Implement JWT authentication for WebSocket
- [x] Create event handlers for real-time updates

**Deliverables:**

*New Files (18 files):*
- `src/infrastructure/websocket/types/websocket.types.ts` - Type definitions (AuthenticatedSocket, WsNamespace, ROOM_NAMES, ROOM_LIMITS, WsErrorCode)
- `src/infrastructure/websocket/types/index.ts` - Barrel export
- `src/infrastructure/websocket/dto/websocket.dto.ts` - DTOs with validation (JoinListingDto, SendMessageDto, TypingDto, MarkReadDto, etc.)
- `src/infrastructure/websocket/dto/index.ts` - Barrel export
- `src/infrastructure/websocket/services/ws-auth.service.ts` - JWT authentication for WebSocket connections
- `src/infrastructure/websocket/services/broadcast.service.ts` - Centralized room-based message broadcasting
- `src/infrastructure/websocket/services/websocket-event-bridge.service.ts` - Bridge between domain events and WebSocket broadcasts
- `src/infrastructure/websocket/services/index.ts` - Barrel export
- `src/infrastructure/websocket/gateways/tenant.gateway.ts` - /tenant namespace gateway
- `src/infrastructure/websocket/gateways/vendor.gateway.ts` - /vendor namespace gateway
- `src/infrastructure/websocket/gateways/notifications.gateway.ts` - /notifications namespace gateway
- `src/infrastructure/websocket/gateways/index.ts` - Barrel export
- `src/infrastructure/websocket/adapters/redis-io.adapter.ts` - Redis adapter for horizontal scaling
- `src/infrastructure/websocket/adapters/index.ts` - Barrel export
- `src/infrastructure/websocket/filters/ws-exception.filter.ts` - WebSocket error handling filter
- `src/infrastructure/websocket/filters/index.ts` - Barrel export
- `src/infrastructure/websocket/websocket.module.ts` - Module registration and DI setup
- `src/infrastructure/websocket/index.ts` - Barrel exports

*Modified Files (2 files):*
- `src/app.module.ts` - Added WebSocketModule import
- `src/main.ts` - Added RedisIoAdapter setup with `app.useWebSocketAdapter()`

**Features Implemented:**

*WebSocket Authentication (WsAuthService):*
- JWT token validation on WebSocket handshake
- Token extraction from: auth.token, query.token, Authorization header
- Socket enrichment with user data (userId, tenantId, roles, vendorId)
- Connection rejection for invalid/expired tokens

*Namespace Structure:*
- `/tenant` - Tenant-scoped real-time updates (listings, interactions)
- `/vendor` - Vendor-specific updates (leads, stats, messages)
- `/notifications` - User notification delivery

*Room-Based Messaging (BroadcastService):*
- Room naming convention: `{scope}:{entity_type}:{entity_id}`
- Room types: tenant rooms, vendor rooms, listing rooms, interaction rooms, user rooms
- Methods: broadcastToTenant(), broadcastToVendor(), broadcastToListing(), broadcastToInteraction(), sendToUser()
- Room limits: listing (1000), interaction (10), tenant (10000)

*Tenant Gateway (/tenant namespace):*
- Handlers: join:listing, leave:listing, listing:view, join:interaction, leave:interaction, ping
- Auto-joins: tenant room, user room, vendor room (if vendor), tenant listings room (if admin)
- View tracking for listings

*Vendor Gateway (/vendor namespace):*
- Handlers: join:vendor, leave:vendor, interaction:message, interaction:typing, interaction:read, vendor:get-stats, ping
- Vendor-only access (rejects non-vendor connections)
- Message persistence via InteractionMessageRepository
- Typing indicators
- Message read status updates
- Vendor stats on connect (activeListings, newLeads, totalMessages)

*Notifications Gateway (/notifications namespace):*
- Handlers: notification:read, notification:read-all, notification:get-count, ping
- User notification room auto-join
- Notification read/unread management
- Initial unread count on connect

*WebSocket Event Bridge (WebSocketEventBridgeService):*
- Domain event → WebSocket broadcast mapping
- Handles events:
  - listing.created, listing.updated, listing.published, listing.unpublished, listing.expired, listing.deleted
  - interaction.created, interaction.updated, interaction.message.created
  - notification.created
  - vendor.approved, vendor.rejected, vendor.suspended
  - review.created, review.approved
  - subscription.created, subscription.cancelled, subscription.limit_warning
  - system.maintenance

*Redis Adapter (RedisIoAdapter):*
- Socket.IO Redis adapter for horizontal scaling
- Graceful fallback to single-instance if Redis unavailable
- connectToRedis() method for initialization
- isRedisConnected() health check

*WebSocket Architecture:*
- Socket.IO v4.8.1 with @socket.io/redis-adapter v8.2.1
- NestJS WebSocket integration (@nestjs/websockets, @nestjs/platform-socket.io)
- Redis pub/sub for multi-instance support
- JWT-based authentication (same tokens as REST API)
- Event-driven broadcasting (domain events trigger WebSocket messages)
- Room-based message targeting for efficiency
- WsExceptionFilter for consistent error handling

*Compliance with Part 33 (WebSocket Strategy):*
- ✅ Socket.IO with Redis adapter
- ✅ Namespace structure (/tenant, /vendor, /notifications)
- ✅ Room-based messaging
- ✅ JWT authentication on handshake
- ✅ Event bridge for domain events
- ✅ Horizontal scaling via Redis adapter
- ✅ Connection management with auto-join rooms
- ✅ Graceful error handling

---

### Session 3.2: Vertical Registry
**Completed:** 2026-01-21

- [x] Create VerticalDefinition entity
- [x] Create TenantVertical enablement entity
- [x] Create vertical.module.ts with controllers
- [x] Implement vertical enablement endpoints
- [x] Create VerticalGuard for route protection

**Deliverables:**

*Prisma Schema Updates:*
- `prisma/schema.prisma` - Added `VerticalDefinition` model (type, name, attributeSchema, validationRules, searchMapping, displayMetadata, schemaVersion, isActive, isCore)
- `prisma/schema.prisma` - Added `TenantVertical` model (tenantId, verticalId, configOverrides, customFields, listingLimit, isEnabled)
- `prisma/schema.prisma` - Added `tenantVerticals` relation on `Tenant`
- `prisma/migrations/20260120181444_vertical_registry/` - Migration for vertical registry tables

*New Files (14 files):*
- `src/modules/vertical/types/vertical.types.ts` - Type definitions (VerticalAttributeSchema, ValidationRules, SearchMapping, etc.)
- `src/modules/vertical/types/index.ts` - Barrel export
- `src/modules/vertical/dto/vertical.dto.ts` - DTOs (CreateVerticalDefinitionDto, UpdateVerticalDefinitionDto, EnableVerticalDto, UpdateTenantVerticalDto, query DTOs, response DTOs)
- `src/modules/vertical/dto/index.ts` - Barrel export
- `src/modules/vertical/repositories/vertical-definition.repository.ts` - Platform-level vertical CRUD + usage checks
- `src/modules/vertical/repositories/tenant-vertical.repository.ts` - Tenant enablement CRUD + legacy backfill helpers
- `src/modules/vertical/repositories/index.ts` - Barrel export
- `src/modules/vertical/services/vertical.service.ts` - Platform + tenant vertical management + schema validation stubs
- `src/modules/vertical/services/index.ts` - Barrel export
- `src/modules/vertical/controllers/vertical-definition.controller.ts` - SUPER_ADMIN endpoints for definition CRUD
- `src/modules/vertical/controllers/tenant-vertical.controller.ts` - Tenant enablement endpoints (enable, disable, list, update)
Modified Files:*
- `src/app.module.ts` - Added `VerticalModule` import
- `prisma/seed.ts` - Added seeding for `real_estate` VerticalDefinition + TenantVertical enablement for demo tenant

**Features Implemented:**

*Vertical Definition Management (Platform-level, SUPER_ADMIN):*
- Create vertical definition with type, name, attributeSchema, validationRules, searchMapping
- List/filter vertical definitions (isActive, isCore)
- Get active vertical definitions
- Get vertical by ID or by type
- Update vertical definition (partial)
- Activate / deactivate vertical definition (core verticals cannot be deactivated)
- Delete vertical definition (core verticals cannot be deleted; verticals in use cannot be deleted)

*Tenant Vertical Enablement (Tenant-level, TENANT_ADMIN+):*
- Enable vertical for tenant with optional configOverrides, customFields, listingLimit
- List tenant verticals with filters
- Get enabled verticals for tenant
- Update tenant vertical configuration
- Disable vertical for tenant

*Legacy Compatibility:*
- Lazy backfill: if tenant has no TenantVertical records, creates from `Tenant.enabledVerticals[]`
- Sync: on enable/disable, updates `Tenant.enabledVerticals[]` to stay in sync with TenantVertical table

*Guards & Decorators:*
- `@RequireVertical(type)` + `VerticalGuard` - Require a specific vertical to be enabled
- `@RequireAnyVertical(...types)` + `AnyVerticalGuard` - Require any one of specified verticals

*Compliance with Part 8 (Vertical Module Contract):*
- ✅ Vertical definitions store attributeSchema, validationRules, searchMapping
- ✅ Tenant enablement with configOverrides and customFields
- ✅ Schema versioning (schemaVersion field)
- ✅ Core vertical protection (isCore flag)
- ✅ Route protection via guards
- ✅ Vertical plug-ins remain data-free (plug-in modules will register with registry, not own data)

---

### Session 3.3: Real Estate Vertical - Schema
- [x] Define real estate attribute schema
- [x] Create RealEstateListingService
- [x] Implement attribute validation
- [x] Create real estate specific filters
- [x] Create OpenSearch mapping for real estate

**Deliverables:**
- `src/verticals/real-estate/registry/attribute.schema.ts` - Full schema with 16 attributes, groups, helper functions
- `src/verticals/real-estate/registry/validation.rules.ts` - validateForDraft(), validateForPublish() with all rule types
- `src/verticals/real-estate/registry/search.mapping.ts` - OpenSearch mapping, 10 facets, filter/aggregation builders
- `src/verticals/real-estate/services/real-estate-listing.service.ts` - CRUD with validation and search helpers
- `src/verticals/real-estate/real-estate-vertical.module.ts` - OnModuleInit auto-registration
- Attributes: propertyType, listingType, tenure, builtUpSize, landSize, bedrooms, bathrooms, carParks, furnishing, floorLevel, condition, yearBuilt, facing, facilities, nearbyAmenities, rentalDeposit, minimumRentalPeriod, additionalFeatures

**Session 3.3 Completed:** ✅

---

### Session 3.4: Real Estate Vertical - Search
- [x] Create real estate search endpoint
- [x] Implement property type facets
- [x] Implement bedroom/bathroom filters
- [x] Implement geo-search for properties
- [x] Implement price range filters
- [x] Create real estate aggregations

**Deliverables:**
- `src/verticals/real-estate/controllers/real-estate-search.controller.ts` - 4 endpoints (search, suggestions, facets, nearby)
- `src/verticals/real-estate/services/real-estate-search.service.ts` - Search service with full filter support
- `src/verticals/real-estate/dto/search.dto.ts` - Typed DTOs with all filter parameters
- Facets: propertyType, listingType, bedrooms, furnishing, tenure, priceRange, builtUpSize, city, state
- Geo-search with distance calculation and sort by distance
- Comprehensive filter support: rooms, size, price, location, furnishing, condition, year built, facilities

**Session 3.4 Completed:** ✅

---

### Session 3.5: Validation Engine
**Completed:** 2026-01-21

- [x] Create AttributeSchema registry
- [x] Create ValidationService
- [x] Implement draft vs publish validation
- [x] Implement cross-field validation
- [x] Create vertical-specific validators

**Deliverables:**

*New Files (12 files):*
- `src/core/validation/types/validation.types.ts` - Complete validation types (ValidationContext, ValidationResult, ValidationRuleDefinition, AttributeFieldValidationDef, VerticalValidationConfig, etc.)
- `src/core/validation/types/index.ts` - Barrel export
- `src/core/validation/services/attribute-schema.registry.ts` - In-memory registry for vertical schemas with version management
- `src/core/validation/services/validation.service.ts` - Core validation service with phase-based validation, cross-field rules, conditional validation
- `src/core/validation/services/index.ts` - Barrel export
- `src/core/validation/decorators/validation.decorators.ts` - @ValidateForDraft(), @ValidateForPublish(), @ValidateAttributes(), AttributeValidationPipe, ValidationException
- `src/core/validation/decorators/index.ts` - Barrel export
- `src/core/validation/validators/base-vertical.validator.ts` - BaseVerticalValidator abstract class
- `src/core/validation/validators/index.ts` - Barrel export
- `src/core/validation/validation.module.ts` - Global ValidationModule
- `src/core/validation/index.ts` - Barrel export
- `src/verticals/real-estate/validators/real-estate.validator.ts` - RealEstateValidator with custom validations
- `src/verticals/real-estate/validators/index.ts` - Barrel export
- `src/modules/listing/helpers/listing-validation.helper.ts` - ListingValidationHelper for integration
- `src/modules/listing/helpers/index.ts` - Barrel export

*Modified Files (6 files):*
- `src/verticals/real-estate/real-estate-vertical.module.ts` - Added ValidationModule import, RealEstateValidator provider/export
- `src/verticals/real-estate/index.ts` - Added validators export
- `src/modules/listing/listing.module.ts` - Added ValidationModule import, ListingValidationHelper provider/export
- `src/modules/listing/listing.service.ts` - Added validation calls to createListing and publishListing
- `src/modules/listing/index.ts` - Added helpers export

**Features Implemented:**

*Validation Types:*
- `ValidationContext` - Full context for validation (verticalType, schemaVersion, currentStatus, tenantId, etc.)
- `ValidationResult` - Aggregated result with errors, warnings, info, validity
- `ValidationRuleDefinition` - Rule definitions (required, min, max, range, enum, pattern, conditional, crossField, custom)
- `VerticalValidationConfig` - Complete config with rules and cross-field rules

*AttributeSchemaRegistry:*
- In-memory registry for vertical schemas
- Version management (semantic version comparison)
- Schema registration at module init
- Getters for schema, fields, validation config

*ValidationService:*
- `validateForDraft()` - Draft-phase validation (minimal required fields)
- `validateForPublish()` - Publish-phase validation (full required fields)
- `validate()` - Full validation with phase specification
- Field type validation (number, boolean, enum, multi_enum, date, array, object)
- Field constraint validation (min, max, pattern, minLength, maxLength)
- Conditional requirement evaluation
- Cross-field rule evaluation with expression parser
- Custom validator registration

*Decorators:*
- `@ValidateForDraft()` - Mark endpoints for draft validation
- `@ValidateForPublish()` - Mark endpoints for publish validation
- `@ValidateAttributes()` - Generic validation decorator
- `AttributeValidationPipe` - Pipe for DTO validation
- `ValidationException` - Rich exception with validation details

*Vertical Validators:*
- `BaseVerticalValidator` - Abstract base class with common logic
- `RealEstateValidator` - Real estate specific validator with custom rules
  - `validateLandedProperty()` - Land size for landed properties
  - `validateRentalTerms()` - Rental deposit/period for rentals
  - `validateSizeRatio()` - Built-up vs land size ratio
  - `validateBedroomRatio()` - Bedrooms vs size ratio

*ListingService Integration:*
- Validation on `createListing()` - Draft validation for attributes
- Validation on `publishListing()` - Publish validation before status change
- `ListingValidationHelper` - Helper service for mode-aware validation

**Validation Rules Supported:**
- `required` - Field must be present and non-empty
- `requiredOnPublish` - Required only when publishing
- `min`, `max`, `range` - Numeric constraints
- `pattern` - Regex pattern matching
- `enum`, `multiEnum` - Value must be in allowed list
- `conditional` - Validation based on other field values
- `crossField` - Cross-field comparisons and expressions
- `custom` - Custom validator functions

---

### Session 3.6: Background Jobs - Full Implementation
- [x] Create search.index queue and processor
- [x] Create media.process queue for image optimization
- [x] Create notification.send queue
- [x] Create listing.expire queue for expiration
- [x] Create analytics.aggregate queue
- [x] Implement job monitoring endpoints

**Deliverables:**
- `src/infrastructure/queue/job-types/*.ts` - Job type definitions for all queues
- `src/infrastructure/queue/processors/media.processor.ts` - Sharp image processing
- `src/infrastructure/queue/processors/notification.processor.ts` - Multi-channel delivery
- `src/infrastructure/queue/processors/listing-expire.processor.ts` - Expiration management
- `src/infrastructure/queue/processors/analytics.processor.ts` - Event tracking & aggregation
- `src/infrastructure/queue/processors/cleanup.processor.ts` - System maintenance
- `src/infrastructure/queue/scheduler.service.ts` - Cron jobs (8 scheduled tasks)
- `src/infrastructure/queue/job-monitor.controller.ts` - 10 admin endpoints
- `src/infrastructure/queue/dto/job-monitor.dto.ts` - Request/Response DTOs

**Job Types Created:**
- search.index: listing.index, listing.delete, vendor.index, bulk.reindex
- media.process: image.resize, image.optimize, image.thumbnail, image.watermark
- notification.send: email.transactional, email.marketing, sms.send, push.send, in_app.create, webhook.deliver
- listing.expire: listing.check_expired, listing.expire_single, listing.expire_batch, listing.renew
- analytics.process: event.track, metrics.aggregate, metrics.rollup, report.generate
- cleanup.process: media.orphaned, sessions.expired, tokens.expired, logs.archive, soft_deletes.purge, cache.clear

**Scheduled Jobs (SchedulerService):**
- Every hour: Listing expiration check, hourly usage aggregation
- Every 15 min: Expired sessions cleanup, expired tokens cleanup
- Every 4 hours: Search index health check
- Daily 3 AM: Orphaned media cleanup
- Daily midnight: Metrics roll-up
- Weekly Sunday 4 AM: Soft-delete purge
- Monthly 1st at 2 AM: Log archive

---

### ✅ Phase 3 Checkpoint

Before proceeding to Phase 4, verify:

- [x] WebSocket connections work
- [x] Real-time events received (event bridge wired)
- [x] Real Estate vertical schema populated in DB (VerticalDefinition seeded)
- [x] Vertical registry endpoints verified (GET /api/v1/verticals/definitions, /tenant)
- [x] Vertical validation rules enforced (Session 3.5 completed)
- [x] Background jobs running for search/media/notifications/listing.expire (Session 3.6 completed)
- [x] Background jobs processed end-to-end (enqueue + poll until completed via `scripts/phase3-smoke-test.js`)
- [x] All tests passing (unit + E2E: 96 total)

---

## 🚀 Phase 4: Platform Features (6 Sessions)

### Session 4.1: Analytics & Reporting
- [x] Create ListingStats entity
- [x] Create VendorStats entity
- [x] Implement view tracking
- [x] Implement interaction analytics
- [x] Create analytics dashboard endpoints

**Deliverables:**
- `src/modules/analytics/analytics.module.ts`
- `src/modules/analytics/analytics.service.ts`
- `src/modules/analytics/analytics.controller.ts`
- `src/modules/analytics/listeners/analytics.listeners.ts`

---

### Session 4.2: Admin Dashboard APIs
**Completed:** 2026-01-21

- [x] Create tenant dashboard stats endpoint
- [x] Create vendor management dashboard
- [x] Create listing moderation endpoints
- [x] Create system health endpoints
- [x] Create bulk action endpoints

**Deliverables:**
- `src/modules/admin/admin.module.ts`
- `src/modules/admin/admin.controller.ts`
- `src/modules/admin/admin.service.ts`
- `scripts/admin-smoke-test.js` (validated admin endpoints + bulk jobs)
- Admin dashboard endpoints
- Bulk action endpoints

---

### Session 4.2b: Feature Flags & Experiments
**Completed:** 2026-01-21

- [x] Create FeatureFlag entity
- [x] Create FeatureFlagService
- [x] Implement @FeatureFlag() decorator
- [x] Create percentage rollout strategy
- [x] Create tenant-specific overrides
- [x] Implement A/B experiment framework
- [x] Create admin endpoints for flags

**Deliverables:**
- `src/core/feature-flags/feature-flag.module.ts`
- `src/core/feature-flags/feature-flag.service.ts`
- `src/core/feature-flags/experiment.service.ts`
- `src/core/feature-flags/decorators/feature-flag.decorator.ts`
- `src/core/feature-flags/guards/feature-flag.guard.ts`
- Feature flag admin endpoints
- Prisma migration: `prisma/migrations/20260121103801_feature_flags_experiments/`

---

### Session 4.3: Public API & Rate Limiting
- [x] Create public search endpoint
- [x] Create public listing detail endpoint
- [x] Create public vendor profile endpoint
- [x] Implement rate limiting with Redis
- [x] Create API versioning strategy

**Deliverables:**
- `src/modules/public/public.module.ts`
- `src/modules/public/public.controller.ts`
- `src/modules/public/public.service.ts`
- `src/modules/public/dto/public-search.dto.ts`
- `src/modules/public/dto/public-listing.dto.ts`
- `src/modules/public/dto/public-vendor.dto.ts`
- `src/modules/public/decorators/rate-limit.decorator.ts`
- `src/modules/public/guards/rate-limit.guard.ts`
- Rate limiting middleware with Redis sliding window
- API versioning at /api/v1/public/*

---

### Session 4.4: Audit Logging
**Completed:** 2026-01-21

- [x] Create AuditLog entity
- [x] Create AuditService
- [x] Create AuditInterceptor
- [x] Create audit query endpoints
- [x] Implement sensitive data masking

**Deliverables:**

*Prisma Schema Updates:*
- `prisma/schema.prisma` - Added `AuditActorType` enum (USER, SYSTEM, ADMIN, ANONYMOUS)
- `prisma/schema.prisma` - Added `AuditLog` model with 17 fields (id, tenantId, actorType, actorId, actorEmail, actionType, targetType, targetId, oldValue, newValue, metadata, ipAddress, userAgent, requestId, timestamp, createdAt, updatedAt)
- `prisma/migrations/20260121114300_audit_logs/` - Migration for audit_logs table

*New Files (12 files):*
- `src/core/audit/types/audit.types.ts` - Type definitions (AuditActionType enum with 50+ actions, AuditTargetType enum, SENSITIVE_FIELDS constant, CreateAuditLogOptions interface, etc.)
- `src/core/audit/types/index.ts` - Barrel export
- `src/core/audit/utils/mask-sensitive-data.util.ts` - Masking utilities (maskSensitiveData, getChangedFields, truncateForAudit, maskEmail, maskPhone, maskCreditCard)
- `src/core/audit/utils/index.ts` - Barrel export
- `src/core/audit/dto/audit.dto.ts` - DTOs (AuditLogQueryDto, AuditLogResponseDto, AuditLogListResponseDto, AuditActionTypesResponseDto, AuditTargetTypesResponseDto)
- `src/core/audit/dto/index.ts` - Barrel export
- `src/core/audit/interceptors/audit.interceptor.ts` - @Audit() decorator and AuditInterceptor for automatic logging
- `src/core/audit/interceptors/index.ts` - Barrel export
- `src/core/audit/audit.service.ts` - Full audit service with log(), logSync(), logCreate(), logUpdate(), logDelete(), logStatusChange(), logAuth(), logAdminAction(), query methods
- `src/core/audit/audit.controller.ts` - 6 audit query endpoints
- `src/core/audit/audit.module.ts` - Global AuditModule
- `src/core/audit/index.ts` - Barrel exports

*Modified Files (1 file):*
- `src/app.module.ts` - Added AuditModule import

**Features Implemented:**

*AuditLog Entity:*
- Append-only, immutable records (no update/delete operations)
- Actor tracking (USER, SYSTEM, ADMIN, ANONYMOUS)
- Target tracking (type + ID)
- Change tracking (oldValue, newValue as JSONB)
- Request context (ipAddress, userAgent, requestId)
- Tenant isolation via tenantId
- Indexed for efficient querying

*AuditService:*
- `log()` - Async fire-and-forget logging (non-blocking via setImmediate)
- `logSync()` - Synchronous logging with confirmation
- Convenience methods: `logCreate()`, `logUpdate()`, `logDelete()`, `logStatusChange()`
- Specialized methods: `logAuth()`, `logAdminAction()`
- Query methods: `findAll()`, `findByTarget()`, `findByActor()`, `findById()`
- Utility methods: `getActionTypes()`, `getTargetTypes()`
- Event listeners: @OnEvent('user.created'), @OnEvent('vendor.approved'), etc.

*@Audit() Decorator & AuditInterceptor:*
- Declarative audit logging on endpoints
- Automatic actor detection from JWT
- Target ID extraction from request/response
- Success/failure tracking
- Request metadata capture (IP, User-Agent)

*Sensitive Data Masking:*
- SENSITIVE_FIELDS constant (password, token, secret, apiKey, creditCard, ssn, etc.)
- Deep object masking (recursive traversal)
- Email masking (ab***@domain.com)
- Phone masking (last 4 digits visible)
- Credit card masking (last 4 digits visible)
- Truncation for large payloads

*Audit Query Endpoints (6 endpoints):*
- `GET /api/v1/audit/logs` - Query audit logs with filters (actor, action, target, date range, pagination)
- `GET /api/v1/audit/logs/:id` - Get single audit log by ID
- `GET /api/v1/audit/target/:targetType/:targetId` - Get logs for specific entity
- `GET /api/v1/audit/actor/:actorId` - Get logs for specific actor
- `GET /api/v1/audit/action-types` - Get distinct action types
- `GET /api/v1/audit/target-types` - Get distinct target types

*AuditActionType Enum (50+ action types):*
- Auth: AUTH_LOGIN, AUTH_LOGOUT, AUTH_REFRESH, AUTH_PASSWORD_CHANGE, AUTH_PASSWORD_RESET, AUTH_FAILED
- User: USER_CREATED, USER_UPDATED, USER_DELETED, USER_STATUS_CHANGE, USER_ROLE_CHANGE
- Tenant: TENANT_CREATED, TENANT_UPDATED, TENANT_SETTINGS_UPDATED, TENANT_SUSPENDED, TENANT_REACTIVATED
- Vendor: VENDOR_CREATED, VENDOR_APPROVED, VENDOR_REJECTED, VENDOR_SUSPENDED, VENDOR_REACTIVATED
- Listing: LISTING_CREATED, LISTING_UPDATED, LISTING_PUBLISHED, LISTING_UNPUBLISHED, LISTING_EXPIRED, LISTING_ARCHIVED, LISTING_FEATURED
- Media: MEDIA_UPLOADED, MEDIA_DELETED
- Interaction: INTERACTION_CREATED, INTERACTION_UPDATED, INTERACTION_STATUS_CHANGE, MESSAGE_SENT
- Review: REVIEW_CREATED, REVIEW_APPROVED, REVIEW_REJECTED, REVIEW_FLAGGED, REVIEW_RESPONDED
- Subscription: SUBSCRIPTION_CREATED, SUBSCRIPTION_UPDATED, SUBSCRIPTION_CANCELLED, SUBSCRIPTION_RENEWED, PLAN_CHANGED
- Billing: PAYMENT_SUCCEEDED, PAYMENT_FAILED, INVOICE_CREATED
- Admin: ADMIN_ACTION, BULK_ACTION, SYSTEM_CONFIG_CHANGE
- API: API_KEY_CREATED, API_KEY_REVOKED
- Feature flags: FEATURE_FLAG_UPDATED, EXPERIMENT_CREATED

*Architecture Principles:*
- ✅ Append-only (immutable records)
- ✅ Event-driven (listens to domain events)
- ✅ Async logging (non-blocking via setImmediate)
- ✅ Tenant isolation enforced
- ✅ Sensitive data masked (PII protection)
- ✅ Request correlation (requestId tracking)
- ✅ Actor context (who did what)
- ✅ Change tracking (what changed)
- ✅ Tamper-resistant (no updates/deletes)

*Compliance with Part 22 (Audit Logging):*
- ✅ Append-only records
- ✅ Actor type tracking
- ✅ Action + target + changes captured
- ✅ Request context (IP, User-Agent, requestId)
- ✅ Tenant isolation
- ✅ Sensitive data masking
- ✅ Query endpoints for audit review
- ✅ Event-driven architecture
- ✅ Non-blocking logging

---

### Session 4.5: Testing & E2E
**Completed:** 2026-01-21

- [x] Create unit tests for core services
- [x] Create E2E tests for auth flow
- [x] Create E2E tests for listing CRUD
- [x] Create E2E tests for vendor workflow
- [x] Create tenant isolation tests

**Deliverables:**

*Test Utilities (2 files):*
- `test/utils/test-helpers.ts` - Test app creation, cleanup utilities, mock request builders
- `test/utils/mock-factories.ts` - Mock factories for users, tenants, vendors, listings

*Unit Tests (2 files, 21 tests):*
- `src/core/auth/auth.service.spec.ts` - AuthService unit tests (10 tests)
- `src/core/audit/audit.service.spec.ts` - AuditService unit tests (11 tests)

*E2E Tests (4 files, 75 tests):*
- `test/e2e/auth.e2e-spec.ts` - Auth flow E2E tests (19 tests): login, logout, register, refresh, password reset, error handling
- `test/e2e/listing.e2e-spec.ts` - Listing CRUD E2E tests (18 tests): create, read, update, delete, publish/unpublish/archive, state machine
- `test/e2e/vendor.e2e-spec.ts` - Vendor workflow E2E tests (18 tests): registration, CRUD, approve/reject/suspend/reactivate, profile/settings
- `test/e2e/tenant-isolation.e2e-spec.ts` - Tenant isolation E2E tests (20 tests): data isolation, cross-tenant protection, auth isolation

**Test Summary:**
- Total: 96 tests (21 unit + 75 E2E)
- All tests passing ✅
- Critical paths covered: auth, listing, vendor, tenant isolation
- Response format helpers for standardized API responses
- Proper DTO field validation tested

---

### ✅ Phase 4 Checkpoint (Final)

Before release, verify:

- [x] All API endpoints documented
- [x] All tests passing (96 tests: 21 unit + 75 E2E)
- [x] Feature flags working with rollout
- [x] Audit logging capturing changes
- [x] Rate limiting protecting endpoints
- [ ] Performance benchmarks met
- [x] Performance benchmarks met
- [x] Security review completed
- [x] Documentation complete (API registry + Swagger + progress)

---

## 📋 Session Log

| Date | Session | Status | Notes |
|------|---------|--------|-------|
| 2026-01-14 | 1.1 | ✅ Completed | Project skeleton + dependencies installed; path aliases + .env.example added |
| 2026-01-14 | 1.2 | ✅ Completed | Prisma initialized; empty schema with uuid-ossp extension; PrismaService + scripts added |
| 2026-01-14 | 1.3 | ✅ Completed | Tenant, TenantSettings, TenantDomain entities + seed file for demo tenant |
| 2026-01-14 | 1.4 | ✅ Completed | TenantContext + middleware + base tenant repository enforcement (no HTTP endpoints) |
| 2026-01-14 | 1.5 | ✅ Completed | User entity + Auth module (JWT access/refresh) + login/refresh endpoints |
| 2026-01-14 | 1.6 | ✅ Completed | RBAC scaffolding: @Roles, @RequirePermission, RolesGuard, PermissionsGuard + role-permission mapping |
| 2026-01-14 | 1.7 | ✅ Completed | Users CRUD APIs (+ /users/me) + customer registration endpoint; docs aligned in API registry |
| 2026-01-14 | 1.8 | ✅ Completed | Swagger/OpenAPI enabled at /api/docs + controllers/DTOs annotated |
| 2026-01-21 | 4.2 | ✅ Completed | Admin dashboard APIs (/admin/*) + bulk actions smoke-tested |
| 2026-01-21 | 4.2b | ✅ Completed | Feature flags + experiments (DB, evaluation, admin endpoints, cache + events) |
| 2026-01-21 | 4.3 | ✅ Completed | Public API & Rate Limiting (search, listing, vendor endpoints + rate limit guard) |
| 2026-01-21 | 4.4 | ✅ Completed | Audit Logging (AuditLog entity, AuditService, @Audit decorator, 6 query endpoints, data masking) |
| 2026-01-21 | 4.5 | ✅ Completed | Testing & E2E (96 tests: 21 unit + 75 E2E, auth/listing/vendor/tenant-isolation coverage) |
| 2026-01-XX | 5.1 | ✅ Completed | Property Management schema migration (Occupant, Tenancy, Contract, Deposit models + enums) |
| 2026-02-21 | 5.2 | ✅ Completed | Occupant module (DTOs, repository, service, guard, controller, 13 endpoints) |

---

## 🏠 Phase 5: Property Management Foundation (Sessions 5.1-5.7)

### Session 5.1: Database Schema Migration
- [x] Add new enums (OccupantStatus, TenancyStatus, ContractStatus, etc.)
- [x] Add OCCUPANT role to UserRole enum
- [x] Create Occupant + OccupantDocument models
- [x] Create VendorDocument model (Owner KYC)
- [x] Create Tenancy + TenancyStatusHistory models
- [x] Create Contract + ContractTemplate models
- [x] Create Deposit model
- [x] Update relations on existing models
- [x] Add OCCUPANT role permissions to RBAC
- [x] Generate Prisma client (validated)
- [x] Create seed data for testing

**Deliverables:**
- Updated `prisma/schema.prisma` with 14 new enums, 8 new models
- Updated `prisma/seed.ts` with property management test data
- Updated `src/core/rbac/rbac.permissions.ts` with OCCUPANT role

**Note:** Migration pending - requires database to be running

---

### Session 5.2: Occupant Module
- [x] Create Occupant DTOs (create, update, query, document, screening)
- [x] Create OccupantRepository with CRUD operations
- [x] Create OccupantService with CRUD + document upload + screening
- [x] Create OccupantGuard for self-access control
- [x] Create OccupantController with REST endpoints
- [x] Register OccupantModule in AppModule

**Deliverables:**
- `src/modules/occupant/dto/` - 5 DTO files
- `src/modules/occupant/occupant.repository.ts` - Data access layer
- `src/modules/occupant/occupant.service.ts` - Business logic + events
- `src/modules/occupant/guards/occupant.guard.ts` - Access control
- `src/modules/occupant/occupant.controller.ts` - REST API endpoints
- `src/modules/occupant/occupant.module.ts` - Module registration

**Endpoints:**
- `GET /occupants` - List occupants (paginated)
- `GET /occupants/me` - Get own occupant profile
- `GET /occupants/:id` - Get occupant by ID
- `POST /occupants` - Create occupant profile
- `PATCH /occupants/:id` - Update occupant profile
- `PATCH /occupants/:id/status` - Update occupant status (admin)
- `POST /occupants/:id/documents` - Request document upload URL
- `POST /occupants/:id/documents/:documentId/confirm` - Confirm upload
- `GET /occupants/:id/documents` - Get occupant documents
- `DELETE /occupants/:id/documents/:documentId` - Delete document
- `POST /occupants/:id/documents/:documentId/verify` - Verify document (admin)
- `POST /occupants/:id/screen` - Run screening
- `PATCH /occupants/:id/screening` - Update screening result (admin)

---

### Session 5.3: Tenancy Module
- [x] Create Tenancy DTOs (create, update, query, transition)
- [x] Create TenancyRepository with views
- [x] Create TenancyStateMachine with all status transitions
- [x] Create TenancyService with lifecycle management
- [x] Create TenancyGuard with access control
- [x] Create TenancyController with REST endpoints  
- [x] Implement status transition validation
- [x] Add TenancyStatusHistory tracking
- [x] Register TenancyModule

**Endpoints Delivered:**
- `POST /tenancies` - Create tenancy (booking application)
- `GET /tenancies` - List tenancies with filters
- `GET /tenancies/:id` - Get tenancy by ID
- `PATCH /tenancies/:id` - Update tenancy details
- `GET /tenancies/:id/history` - Get status history
- `POST /tenancies/:id/confirm-booking` - Confirm booking (DRAFT → BOOKED)
- `POST /tenancies/:id/confirm-deposit` - Confirm deposit (BOOKED → DEPOSIT_PAID)
- `POST /tenancies/:id/submit-contract` - Submit contract (DEPOSIT_PAID → CONTRACT_PENDING)
- `POST /tenancies/:id/activate` - Activate tenancy (CONTRACT_PENDING → ACTIVE)
- `POST /tenancies/:id/request-termination` - Request termination (ACTIVE → TERMINATION_REQUESTED)
- `POST /tenancies/:id/terminate` - Complete termination (TERMINATION_REQUESTED → TERMINATED)
- `POST /tenancies/:id/extend` - Extend tenancy (ACTIVE → EXTENDED)
- `POST /tenancies/:id/cancel` - Cancel tenancy (DRAFT/BOOKED → TERMINATED)

---

### Session 5.4: Tenancy Workflow & Background Jobs
- [x] Add TenancyExpiryProcessor for expiry notifications
- [x] Create job types (check_expiring, notify_expiring, auto_terminate)
- [x] Implement scheduler for tenancy expiry checks (daily at 8 AM)
- [x] Implement auto-terminate for expired tenancies (daily at midnight)
- [x] Register processor in ProcessorsModule
- [x] Emit events for notification system integration

**Background Jobs Created:**
- `tenancy.check_expiring` - Find expiring tenancies (30, 14, 7 days)
- `tenancy.notify_expiring` - Send expiry notifications to occupant/owner
- `tenancy.auto_terminate` - Auto-terminate past lease end date

**Events Emitted:**
- `tenancy.expiry.notice` - When expiry notification sent
- `tenancy.auto.terminated` - When tenancy auto-terminated

---

### Session 5.5: Contract Core Module
- [x] Create Contract DTOs
- [x] Create ContractTemplateService (CRUD for templates)
- [x] Create ContractService (generation from template + tenancy)
- [x] Create ContractController with REST endpoints
- [x] Generate contract PDF using PDFKit
- [x] Store PDF in S3

**Deliverables:**
- `src/modules/contract/dto/` - All DTOs (create-contract, update-contract, contract-query, create-template, update-template, template-query)
- `src/modules/contract/contract-template.service.ts` - Template CRUD + variable substitution
- `src/modules/contract/contract.service.ts` - Contract CRUD + PDF generation + S3 upload
- `src/modules/contract/contract.controller.ts` - REST endpoints for contracts and templates
- `src/modules/contract/contract.module.ts` - Module registration
- Dependencies: `pdfkit`, `@types/pdfkit`

**Notes:**
- PDF generation uses PDFKit (lighter than Puppeteer)
- Template variables use `{{variableName}}` syntax
- 25+ standard template variables defined
- Contract status transitions validated
- Contract PDF stored in S3 with presigned download URLs

---

### Session 5.6: Contract E-Signature Integration
- [x] Create SignatureService adapter interface
- [x] Implement requestSignatures, handleWebhook, getSignatureStatus
- [x] Add controller endpoints for signature flow
- [x] Auto-transition Tenancy to ACTIVE when both parties sign

**Deliverables:**
- `src/modules/contract/providers/signature-provider.interface.ts` - E-signature provider interface with full types
- `src/modules/contract/providers/mock-signature.provider.ts` - Mock implementation for MVP/testing
- `src/modules/contract/signature.service.ts` - Signature workflow orchestration
- `src/modules/contract/dto/signature.dto.ts` - Request/Response DTOs
- 6 new endpoints added to contract controller

**Notes:**
- Provider interface supports DocuSign/SignNow when ready
- Mock provider simulates full sign flow for testing
- Auto-activates tenancy when both parties sign
- Webhook handling for provider callbacks
- Manual signature recording for external signing

---

### Session 5.7: Deposit Module
- [x] Create Deposit DTOs
- [x] Create DepositService (create, collect, refund)
- [x] Create DepositController with REST endpoints
- [x] Implement deduction workflows
- [x] Add deposit reporting

**Completed:** 2026-02-21

**Files Created:**
- `src/modules/deposit/dto/create-deposit.dto.ts` - CreateDepositDto, CreateDepositsFromTenancyDto
- `src/modules/deposit/dto/update-deposit.dto.ts` - CollectDepositDto, DeductionItemDto, ProcessRefundDto, AddDeductionDto, ForfeitDepositDto
- `src/modules/deposit/dto/deposit-query.dto.ts` - DepositQueryDto
- `src/modules/deposit/dto/index.ts` - Barrel exports
- `src/modules/deposit/deposit.service.ts` - DepositService with all business logic
- `src/modules/deposit/deposit.controller.ts` - REST API controller
- `src/modules/deposit/deposit.module.ts` - Module registration
- `src/modules/deposit/index.ts` - Barrel exports

**Features:**
- Create single deposits or from tenancy amounts
- Mark deposits as collected with payment tracking
- Add deductions from claims
- Calculate refund amounts
- Process full/partial refunds
- Forfeit deposits
- Deposit summary per tenancy
- Events: deposit.created, deposit.collected, deposit.refunded

---

### Session 5.8: Phase 5 Testing & Integration
- [x] E2E tests for occupant registration flow
- [x] E2E tests for complete tenancy lifecycle
- [x] E2E tests for contract generation and signing
- [x] E2E tests for deposit collection and refund
- [x] Unit tests for TenancyStateMachine
- [x] Unit tests for ContractTemplateService
- [x] Unit tests for DepositService
- [x] Fix TenancyStateMachine duplicate event key bug
- [x] Verify seed data coverage
- [x] Update API-REGISTRY.md

**Completed:** 2026-02-21

**Files Created:**
- `src/modules/tenancy/tenancy.state-machine.spec.ts` - 41 tests: transitions, canTransition, getAvailableEvents, getTargetState, full lifecycle
- `src/modules/contract/contract-template.service.spec.ts` - 32 tests: substituteVariables, extractVariables, validateVariables, CRUD
- `src/modules/deposit/deposit.service.spec.ts` - 27 tests: markCollected, addDeduction, calculateRefund, processRefund, forfeit, summary
- `test/e2e/occupant.e2e-spec.ts` - Occupant CRUD, status updates, auth validation
- `test/e2e/tenancy-lifecycle.e2e-spec.ts` - Full lifecycle DRAFT→TERMINATED, cancel flow, validation
- `test/e2e/contract.e2e-spec.ts` - Template CRUD, contract creation, status flow, validation
- `test/e2e/deposit.e2e-spec.ts` - Create, collect, deductions, refund calc, refund process, forfeit, summary

**Bug Fixes:**
- Fixed TenancyStateMachine: `cancel` and `activate` events registered twice overwriting previous entry in Map. Combined into `from[]` arrays.

**Test Summary:**
- Unit tests: 121 passing (5 suites) — up from 21 tests (2 suites)
- E2E tests: 4 new E2E spec files (occupant, tenancy-lifecycle, contract, deposit)
- Seed data: Already comprehensive from prior sessions (occupant, tenancy, contract, deposits, templates)

---

## 🎯 Current Focus

**Status:** Phase 8 Complete (Growth Features — 8/8 sessions done, checkpoint passed)

**Summary:**
- Base platform: 36 sessions completed (160+ endpoints)
- Property Management extension: Phase 5 complete (8/8 sessions)
- Billing & Payout: Phase 6 complete (8/8 sessions)
- Operations: Phase 7 complete (6/6 sessions + checkpoint)
- Growth Features: Phase 8 complete (8/8 sessions, checkpoint passed)
- Unit tests: 660 passing (21 suites)
- Total endpoints: 310
- Next: Session 8.7 (Phase 8 Checkpoint)

**Remaining Sessions (Phase 8):**
- Phase 8: Growth Features (8 sessions) - 8/8 done ✅

---

## 🏗️ Phase 8: Growth Features (8 Sessions)

### Session 8.4: Affiliate Module ✅
- [x] Add Affiliate, AffiliateReferral, AffiliatePayout models to Prisma
- [x] Add AffiliateType enum (INDIVIDUAL, COMPANY)
- [x] Add AffiliateStatus enum (ACTIVE, INACTIVE, SUSPENDED)
- [x] Add ReferralType enum (OWNER_REGISTRATION, TENANT_BOOKING, AGENT_SIGNUP)
- [x] Add ReferralStatus enum (PENDING, CONFIRMED, PAID, CANCELLED)
- [x] Add AffiliatePayoutStatus enum (PENDING, PROCESSING, COMPLETED, FAILED)
- [x] Run migration (20260222162001_add_affiliate_module)
- [x] Add affiliates relation to Tenant and User models
- [x] Create AffiliateModule in src/modules/affiliate/
- [x] Create DTOs: CreateAffiliateDto, UpdateAffiliateDto, TrackReferralDto, AffiliateQueryDto, ReferralQueryDto, ProcessPayoutDto
- [x] Create AffiliateService with:
  - createAffiliate (generate unique code)
  - getAffiliate, getAffiliateByCode, listAffiliates
  - updateAffiliate, deactivateAffiliate
  - trackReferral (manual referral with configurable commission)
  - confirmReferral (PENDING → CONFIRMED, updates unpaid earnings)
  - listReferrals (paginated, filterable)
  - calculateEarnings (summary with breakdown by type)
  - processPayout (create payout, mark referrals PAID, reset unpaid)
  - completePayout (PROCESSING → COMPLETED)
  - listPayouts
  - handleVendorApproved (auto-track OWNER_REGISTRATION)
  - handleTenancyActivated (auto-track TENANT_BOOKING)
- [x] Create AffiliateController with 13 endpoints:
  - POST /affiliates (register)
  - GET /affiliates (list)
  - GET /affiliates/code/:code (lookup by code)
  - GET /affiliates/:id (get details)
  - PATCH /affiliates/:id (update)
  - POST /affiliates/:id/deactivate
  - POST /affiliates/:id/referrals (track referral)
  - GET /affiliates/:id/referrals (list referrals)
  - POST /affiliates/:id/referrals/:refId/confirm
  - GET /affiliates/:id/earnings (summary)
  - POST /affiliates/:id/payout (process payout)
  - GET /affiliates/:id/payouts (list payouts)
  - POST /affiliates/payouts/:id/complete
- [x] Add affiliate:read permission to AGENT role
- [x] Register AffiliateModule in AppModule
- [x] 44 unit tests (affiliate.service.spec.ts)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/affiliate/affiliate.service.ts` — AffiliateService with full lifecycle + event handlers
- `src/modules/affiliate/affiliate.controller.ts` — 13 REST endpoints
- `src/modules/affiliate/affiliate.module.ts` — NestJS module
- `src/modules/affiliate/dto/` — 6 DTOs with validation
- `src/modules/affiliate/affiliate.service.spec.ts` — 44 unit tests
- `src/modules/affiliate/index.ts` — Barrel exports
- `prisma/migrations/20260222162001_add_affiliate_module/` — Database migration

**Test Results:**
- Unit tests: 614 passing (20 suites) — up from 570 (19 suites)
- New: 44 tests in affiliate.service.spec.ts
- Total endpoints: 326 (was 313 + 13 new)

---

### Session 8.3: Agent Commission ✅
- [x] Add AgentCommission model to Prisma
- [x] Add CommissionType enum (BOOKING, RENEWAL)
- [x] Add CommissionStatus enum (PENDING, APPROVED, PAID, CANCELLED)
- [x] Run migration (20260222153715_add_agent_commission)
- [x] Add agentCommissions relation to Tenancy model
- [x] Add commissions relation to Agent model
- [x] Create CommissionModule in src/modules/commission/
- [x] Create DTOs: CalculateCommissionDto, CommissionQueryDto, ApproveCommissionDto, MarkPaidDto
- [x] Create CommissionService with:
  - calculateCommission (create with configurable rate)
  - getCommission, listCommissions, listAgentCommissions
  - approveCommission (PENDING → APPROVED)
  - markPaid (APPROVED → PAID, updates agent stats)
  - cancelCommission (not-PAID → CANCELLED)
  - getAgentCommissionSummary
  - handleTenancyActivated (auto-create BOOKING commission)
  - handleContractRenewed (auto-create RENEWAL commission)
- [x] Create CommissionController with 8 endpoints:
  - POST /commissions (calculate & create)
  - GET /commissions (list all)
  - GET /commissions/:id (get details)
  - POST /commissions/:id/approve
  - POST /commissions/:id/pay
  - POST /commissions/:id/cancel
  - GET /agents/:id/commissions (agent's commissions)
  - GET /agents/:id/commissions/summary
- [x] Add commission:read permission to AGENT role
- [x] Register CommissionModule in AppModule
- [x] 30 unit tests (commission.service.spec.ts)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/commission/commission.service.ts` — CommissionService with full lifecycle + event handlers
- `src/modules/commission/commission.controller.ts` — 8 REST endpoints
- `src/modules/commission/commission.module.ts` — NestJS module
- `src/modules/commission/dto/` — 4 DTOs with validation
- `src/modules/commission/commission.service.spec.ts` — 30 unit tests
- `src/modules/commission/index.ts` — Barrel exports
- `prisma/migrations/20260222153715_add_agent_commission/` — Database migration

**Test Results:**
- Unit tests: 570 passing (19 suites) — up from 540 (18 suites)
- New: 30 tests in commission.service.spec.ts
- Total endpoints: 313 (was 305 + 8 new)

---

### Session 8.2: Agent Module ✅
- [x] Add Agent, AgentListing models to Prisma
- [x] Add AGENT to Role enum
- [x] Add AgentStatus enum (ACTIVE, INACTIVE, SUSPENDED)
- [x] Run migration (20260222151919_add_agent_module)
- [x] Create AgentModule in src/modules/agent/
- [x] Create DTOs: RegisterAgentDto, UpdateAgentDto, AssignListingDto, AgentQueryDto
- [x] Create AgentService with registerAgent, getAgent, listAgents, updateAgentProfile, assignToListing, unassignFromListing, getAgentListings, suspendAgent, reactivateAgent, generateReferralCode, regenerateReferralCode
- [x] Create AgentController with 10 endpoints:
  - POST /agents (register)
  - GET /agents (list)
  - GET /agents/:id (get)
  - PATCH /agents/:id (update)
  - POST /agents/:id/assign-listing
  - DELETE /agents/:id/listings/:listingId (unassign)
  - GET /agents/:id/listings
  - POST /agents/:id/suspend
  - POST /agents/:id/reactivate
  - POST /agents/:id/regenerate-referral
- [x] Add AGENT permissions to RBAC
- [x] Register AgentModule in AppModule
- [x] 31 unit tests (agent.service.spec.ts)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/agent/agent.service.ts` — AgentService with full CRUD + listing assignment + referral codes
- `src/modules/agent/agent.controller.ts` — 10 REST endpoints
- `src/modules/agent/agent.module.ts` — NestJS module
- `src/modules/agent/dto/` — 4 DTOs with validation
- `src/modules/agent/agent.service.spec.ts` — 31 unit tests
- `src/modules/agent/index.ts` — Barrel exports
- `prisma/migrations/20260222151919_add_agent_module/` — Database migration

**Test Results:**
- Unit tests: 540 passing (18 suites) — up from 509 (17 suites)
- New: 31 tests in agent.service.spec.ts
- Total endpoints: 305 (was 295 + 10 new)

---

### Session 8.1: Company Module ✅
- [x] Add Company, CompanyAdmin models to Prisma
- [x] Add COMPANY_ADMIN to Role enum
- [x] Add CompanyType, CompanyStatus, CompanyAdminRole enums
- [x] Run migration (20260222145923_add_company_module)
- [x] Create CompanyModule in src/modules/company/
- [x] Create DTOs: RegisterCompanyDto, UpdateCompanyDto, AddCompanyAdminDto, CompanyQueryDto
- [x] Create CompanyService with registerCompany, getCompany, listCompanies, updateCompany, verifyCompany, suspendCompany, addAdmin, getAdmins, removeAdmin
- [x] Create CompanyController with 9 endpoints:
  - POST /companies/register
  - GET /companies
  - GET /companies/:id
  - PATCH /companies/:id
  - POST /companies/:id/verify
  - POST /companies/:id/suspend
  - POST /companies/:id/admins
  - GET /companies/:id/admins
  - DELETE /companies/:id/admins/:userId
- [x] Add COMPANY_ADMIN permissions to RBAC
- [x] Register CompanyModule in AppModule
- [x] 28 unit tests (company.service.spec.ts)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/company/company.service.ts` — CompanyService with full CRUD + verification + admin management
- `src/modules/company/company.controller.ts` — 9 REST endpoints
- `src/modules/company/company.module.ts` — NestJS module
- `src/modules/company/dto/` — DTOs with validation
- `src/modules/company/company.service.spec.ts` — 28 unit tests

**Test Results:**
- Unit tests: 509 passing (17 suites) — up from 481 (16 suites)
- New: 28 tests in company.service.spec.ts
- Total endpoints: 295 (was 286 + 9 new)

---

## 🏗️ Phase 7: Operations (6 Sessions)

### Session 7.1: Maintenance Core ✅
- [x] Add Maintenance, MaintenanceAttachment, MaintenanceUpdate Prisma models
- [x] Run migration (20260221143350_add_maintenance_models)
- [x] Add maintenance relation to Tenancy model
- [x] Create MaintenanceModule in src/modules/maintenance/
- [x] Create DTOs: CreateMaintenanceDto, UpdateMaintenanceDto, MaintenanceQueryDto, AddAttachmentDto, AddUpdateDto
- [x] Create MaintenanceService with createTicket, updateTicket, getTicket, listTickets, addAttachment, addUpdate, listUpdates
- [x] Create MaintenanceController with 6 endpoints (POST, GET, GET/:id, PATCH/:id, POST/:id/attachments, POST/:id/comments)
- [x] Register MaintenanceModule in AppModule
- [x] S3 presigned URL integration for attachment uploads
- [x] Role-based access: occupants see own tickets only, internal notes hidden from customers
- [x] Ticket number generation: MNT-YYYYMMDD-XXXX
- [x] Categories: PLUMBING, ELECTRICAL, APPLIANCE, STRUCTURAL, OTHER
- [x] Event emission: maintenance.created, maintenance.updated, maintenance.attachment.added, maintenance.comment.added
- [x] 28 unit tests covering all service methods
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/maintenance/maintenance.service.ts` — MaintenanceService with full CRUD + attachments + comments
- `src/modules/maintenance/maintenance.controller.ts` — 6 REST endpoints
- `src/modules/maintenance/maintenance.module.ts` — NestJS module
- `src/modules/maintenance/dto/` — 5 DTO files with validation
- `src/modules/maintenance/maintenance.service.spec.ts` — 28 unit tests
- `src/modules/maintenance/index.ts` — Barrel exports
- `prisma/migrations/20260221143350_add_maintenance_models/` — Database migration

**Test Results:**
- Unit tests: 349 passing (13 suites) — up from 321 tests (12 suites)
- New: 28 tests in maintenance.service.spec.ts (createTicket: 5, updateTicket: 5, getTicket: 4, listTickets: 5, addAttachment: 3, addUpdate: 4, listUpdates: 2)

### Session 7.2: Maintenance Workflow ✅
- [x] Create MaintenanceStateMachine extending StateMachine base class
- [x] Define transitions: OPEN → VERIFIED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → CLOSED
- [x] Define claim flow: IN_PROGRESS/PENDING_APPROVAL → CLAIM_SUBMITTED → CLAIM_APPROVED/REJECTED
- [x] Define cancel: OPEN/VERIFIED/ASSIGNED → CANCELLED
- [x] Define reopen: CLOSED → OPEN
- [x] Add Prisma migration (contractorName, contractorPhone, startedAt, closedAt fields)
- [x] Create workflow DTOs: VerifyMaintenanceDto, AssignMaintenanceDto, ResolveMaintenanceDto, CloseMaintenanceDto, CancelMaintenanceDto
- [x] Add 6 workflow service methods: verifyTicket, assignTicket, startWork, resolveTicket, closeTicket, cancelTicket
- [x] Add getAvailableActions helper method
- [x] Add 6 workflow controller endpoints: POST verify, assign, start, resolve, close, cancel
- [x] External contractor support: contractorName + contractorPhone on assignment
- [x] Estimated vs actual cost tracking on resolve
- [x] System-generated timeline updates for all status changes
- [x] Event emission: maintenance.status.changed for all transitions
- [x] 24 new state machine tests (transitions, guards, available events)
- [x] 16 new workflow service tests (verify, assign, start, resolve, close, cancel, getAvailableActions)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/maintenance/maintenance.state-machine.ts` — MaintenanceStateMachine with 10 transitions, guards, states
- `src/modules/maintenance/maintenance.state-machine.spec.ts` — 24 state machine unit tests
- `src/modules/maintenance/dto/maintenance-workflow.dto.ts` — 5 workflow DTOs
- `prisma/migrations/20260221145100_add_maintenance_workflow_fields/` — Database migration
- Updated: maintenance.service.ts (6 workflow methods + helpers), maintenance.controller.ts (6 endpoints), maintenance.service.spec.ts (+16 tests)

**Test Results:**
- Unit tests: 393 passing (14 suites) — up from 349 tests (13 suites)
- New: 24 tests in maintenance.state-machine.spec.ts + 16 tests in maintenance.service.spec.ts

### Session 7.3: Inspection Core ✅
- [x] Add Inspection and InspectionItem Prisma models
- [x] Add inspections relation to Tenancy model
- [x] Run migration (20260221153532_add_inspection_models)
- [x] Create InspectionModule (src/modules/inspection/)
- [x] Create DTOs: CreateInspectionDto, UpdateChecklistDto, CompleteInspectionDto, InspectionQueryDto
- [x] Create InspectionService with scheduleInspection, getInspection, listInspections, updateChecklist, completeInspection, generateReport, getReportDownloadUrl
- [x] Create InspectionController with 6 endpoints
- [x] PDF report generation using PDFKit (grouped checklist, ratings, property details)
- [x] S3 upload for report storage
- [x] Event emission: inspection.created, inspection.completed, inspection.report.generated
- [x] 26 unit tests covering all service methods
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/inspection/inspection.service.ts` — InspectionService with 7 methods + PDF generation
- `src/modules/inspection/inspection.controller.ts` — 6 REST endpoints
- `src/modules/inspection/inspection.module.ts` — InspectionModule
- `src/modules/inspection/inspection.service.spec.ts` — 26 unit tests
- `src/modules/inspection/dto/` — 4 DTO files + barrel export
- `prisma/migrations/20260221153532_add_inspection_models/` — Database migration

**Endpoints (6 new):**
- POST /inspections — Schedule a new inspection
- GET /inspections — List inspections with filtering/pagination
- GET /inspections/:id — Get inspection details
- PATCH /inspections/:id/checklist — Update checklist items
- POST /inspections/:id/complete — Complete inspection with rating
- GET /inspections/:id/report — Generate/retrieve inspection report

**Test Results:**
- Unit tests: 419 passing (15 suites) — up from 393 tests (14 suites)
- New: 26 tests in inspection.service.spec.ts

### Session 7.4: Video Inspection ✅
- [x] Create video inspection DTOs: RequestVideoDto, SubmitVideoDto, ReviewVideoDto
- [x] Add requestVideo service method (SCHEDULED/VIDEO_REQUESTED → VIDEO_REQUESTED)
- [x] Add submitVideo service method with S3 presigned upload URL (VIDEO_REQUESTED/VIDEO_SUBMITTED → VIDEO_SUBMITTED)
- [x] Add reviewVideo service method (APPROVED → ONSITE_PENDING, REQUEST_REDO → VIDEO_REQUESTED)
- [x] Add getVideoDownloadUrl service method with S3 presigned download URL
- [x] Add 4 controller endpoints: POST request-video, POST submit-video, POST review-video, GET video
- [x] Video flow: Owner requests → Occupant uploads via presigned URL → Owner reviews → Approve or request redo
- [x] Large file support: 2-hour presigned upload URL expiry for video files
- [x] Event emission: inspection.video.requested, inspection.video.submitted, inspection.video.reviewed
- [x] 15 new unit tests (requestVideo: 4, submitVideo: 4, reviewVideo: 4, getVideoDownloadUrl: 3)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/inspection/dto/video-inspection.dto.ts` — 3 video workflow DTOs
- Updated: `src/modules/inspection/inspection.service.ts` — 4 new methods + 3 event classes
- Updated: `src/modules/inspection/inspection.controller.ts` — 4 new endpoints
- Updated: `src/modules/inspection/inspection.service.spec.ts` — 15 new tests (41 total)

**Endpoints (4 new, 278 total):**
- POST /inspections/:id/request-video — Request video from occupant
- POST /inspections/:id/submit-video — Get presigned upload URL for video
- POST /inspections/:id/review-video — Review submitted video (approve/redo)
- GET /inspections/:id/video — Get presigned download URL for video

**Test Results:**
- Unit tests: 434 passing (15 suites) — up from 419 tests (15 suites)
- New: 15 tests in inspection.service.spec.ts (requestVideo: 4, submitVideo: 4, reviewVideo: 4, getVideoDownloadUrl: 3)

### Session 7.5: Claim Management ✅
- [x] Add Claim, ClaimEvidence Prisma models with ClaimType/ClaimStatus enums
- [x] Add claims relation to Tenancy model, claim relation to Maintenance model
- [x] Run migration (20260222071303_add_claim_models)
- [x] Create ClaimModule (src/modules/claim/)
- [x] Create DTOs: CreateClaimDto, UploadEvidenceDto, ReviewClaimDto, DisputeClaimDto, ClaimQueryDto
- [x] Create ClaimService with submitClaim, getClaim, listClaims, uploadEvidence, reviewClaim, disputeClaim
- [x] Create ClaimController with 6 endpoints
- [x] Auto-generated claim number format: CLM-YYYYMMDD-XXXX
- [x] S3 presigned URL for evidence upload (1-hour expiry)
- [x] Event emission: claim.submitted, claim.reviewed, claim.disputed, claim.evidence.added
- [x] 29 new unit tests (submitClaim: 5, getClaim: 2, listClaims: 4, uploadEvidence: 4, reviewClaim: 8, disputeClaim: 6)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `prisma/schema.prisma` — 2 new models (Claim, ClaimEvidence)
- `src/modules/claim/` — Full module (service, controller, DTOs, tests)
- 6 REST endpoints under `/claims`
- Claim number format: CLM-{YYYYMMDD}-{SEQUENCE}
- Claim types: DAMAGE, CLEANING, MISSING_ITEM, UTILITY, OTHER
- Status flow: SUBMITTED → UNDER_REVIEW → APPROVED/PARTIALLY_APPROVED/REJECTED → SETTLED or DISPUTED
- Settlement methods: DEPOSIT_DEDUCTION, BILLING_DEDUCTION, DIRECT_PAYMENT
- Events: claim.submitted, claim.reviewed, claim.disputed, claim.evidence.added

**Endpoints (6 new, 284 total):**
- POST /claims — Submit a new claim
- GET /claims — List claims (paginated, filtered)
- GET /claims/:id — Get claim details
- POST /claims/:id/evidence — Upload claim evidence (presigned URL)
- POST /claims/:id/review — Review claim (approve/partial/reject)
- POST /claims/:id/dispute — Dispute claim decision

**Test Results:**
- Unit tests: 463 passing (16 suites) — up from 434 tests (15 suites)
- New: 29 tests in claim.service.spec.ts (submitClaim: 5, getClaim: 2, listClaims: 4, uploadEvidence: 4, reviewClaim: 8, disputeClaim: 6)

### Session 7.6: Deposit Deductions ✅
- [x] Add linkClaimToDeposit method — validates deposit (COLLECTED/HELD), claim (APPROVED/PARTIALLY_APPROVED), same tenancy, no duplicates
- [x] Add calculateDeductions method — aggregates approved claims and deposits per tenancy, returns shortfall analysis
- [x] Add finalizeRefund method — applies approved claim deductions to deposit, marks claims SETTLED, determines final status
- [x] Create FinalizeDepositDto (refundRef?, notes?)
- [x] Create DepositFinalizedEvent (depositId, tenancyId, tenantId, type, originalAmount, totalDeductions, refundedAmount, claimsApplied)
- [x] Add POST /deposits/:id/finalize endpoint (SUPER_ADMIN, TENANT_ADMIN)
- [x] Add GET /deposits/tenancy/:tenancyId/deductions endpoint (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN, VENDOR_STAFF)
- [x] Route ordering: deductions endpoint placed before :id routes to avoid param conflicts
- [x] 18 new unit tests (linkClaimToDeposit: 7, calculateDeductions: 3, finalizeRefund: 8)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/deposit/dto/finalize-deposit.dto.ts` — FinalizeDepositDto
- Updated: `src/modules/deposit/deposit.service.ts` — 3 new methods + DepositFinalizedEvent
- Updated: `src/modules/deposit/deposit.controller.ts` — 2 new endpoints (finalize, deductions)
- Updated: `src/modules/deposit/deposit.service.spec.ts` — 18 new tests (42 total)

**Endpoints (2 new, 286 total):**
- POST /deposits/:id/finalize — Finalize deposit with claim deductions and refund
- GET /deposits/tenancy/:tenancyId/deductions — Calculate deduction summary for tenancy

**Test Results:**
- Unit tests: 481 passing (16 suites) — up from 463 tests (16 suites)
- New: 18 tests in deposit.service.spec.ts (linkClaimToDeposit: 7, calculateDeductions: 3, finalizeRefund: 8)

---

## 🏗️ Phase 6: Rent & Maintenance (8 Sessions)

### Session 6.1: Billing Engine ✅
- [x] Add RentBilling, RentBillingLineItem, RentBillingReminder Prisma models
- [x] Add RentBillingLineItemType, RentBillingReminderType enums
- [x] Add billings relation to Tenancy model
- [x] Run migration (add_rent_billing_models)
- [x] Create RentBillingModule (src/modules/billing/)
- [x] Create DTOs: GenerateBillDto, AddLineItemDto, ApplyLateFeeDto, BillingQueryDto
- [x] Create RentBillingService with generateBill, calculateLateFee, addLineItem, applyLateFee, getBill, listBills, markAsSent, markAsOverdue, writeOff, generateBillPdf
- [x] Create RentBillingController with 9 endpoints
- [x] PDF generation using PDFKit (billing statement with line items, totals)
- [x] Wire RentBillingModule into AppModule
- [x] Unit tests: 28 tests passing (billing.service.spec.ts)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `prisma/schema.prisma` — 3 new models (RentBilling, RentBillingLineItem, RentBillingReminder)
- `src/modules/billing/` — Full module (service, controller, DTOs, tests)
- 9 REST endpoints under `/rent-billings`
- Bill number format: BILL-{YYYYMM}-{SEQUENCE}
- Line item types: RENT, UTILITY, LATE_FEE, CLAIM_DEDUCTION, OTHER
- Status flow: DRAFT → GENERATED → SENT → PAID/OVERDUE → WRITTEN_OFF
- Events: billing.generated, billing.overdue

**Test Results:**
- Unit tests: 149 passing (6 suites) — up from 121 tests (5 suites)
- New: billing.service.spec.ts (28 tests)

### Session 6.2: Billing Automation ✅
- [x] Create BillingProcessor (BullMQ processor for billing.process queue)
- [x] Job handlers: generate-batch, generate-single, detect-overdue, apply-late-fees
- [x] Add billing cron jobs to SchedulerService (6AM, 9AM, 10AM daily)
- [x] Per-tenancy billing day configuration (billingDay 1-28, paymentDueDay, lateFeePercent)
- [x] Billing configuration endpoints (GET/PATCH config/:tenancyId, GET automation/status)
- [x] Wire BillingNotificationHandler for billing.generated events (EMAIL + IN_APP)
- [x] Add BILL_GENERATED, BILL_OVERDUE to NotificationType enum (migration applied)
- [x] Add BillingTemplateVariables to notification types
- [x] Register BillingProcessor in ProcessorsModule
- [x] Unit tests: billing.processor.spec.ts (17 tests) + billing config tests (12 tests)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/infrastructure/queue/processors/billing.processor.ts` — BulkMQ processor with 4 job handlers
- `src/infrastructure/queue/job-types/billing-process.jobs.ts` — Job type definitions
- `src/modules/billing/dto/billing-config.dto.ts` — UpdateBillingConfigDto
- 3 new REST endpoints (229 total)
- Cron schedules: bill generation (6AM), overdue detection (9AM), late fee application (10AM)
- Notification: billing.generated → EMAIL + IN_APP to occupant
- Events: BillingBatchCompletedEvent, BillingOverdueDetectedEvent

**Test Results:**
- Unit tests: 178 passing (7 suites) — up from 149 tests (6 suites)
- New: billing.processor.spec.ts (17 tests), billing config tests in service spec (12 tests)

### Session 6.3: Payment Processing ✅
- [x] Add RentPayment model to Prisma (with migration: add_rent_payment_model)
- [x] Create RentPaymentModule in src/modules/payment/
- [x] Integrate with existing Stripe infrastructure (StripeBillingProvider)
- [x] Add FPX support for Malaysia (16 Malaysian banks via Stripe FPX)
- [x] Create PaymentService: createPaymentIntent, recordManualPayment, handlePaymentSuccess, handlePaymentFailure, getPayment, listPayments, generateReceipt, getFpxBanks
- [x] Create PaymentController: 6 endpoints under /rent-payments
- [x] Auto-update Billing status (PARTIALLY_PAID / PAID) when payment received
- [x] Webhook event routing: StripeWebhookService → RentPaymentWebhookListener → Service
- [x] Notification handlers: rent.payment.completed, rent.payment.failed → EMAIL + IN_APP
- [x] RentPaymentTemplateVariables added to notification types
- [x] Unit tests: payment.service.spec.ts (29 tests)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `prisma/schema.prisma` — RentPayment model with indexes
- `src/modules/payment/` — Full module (service, controller, DTOs, listeners, tests)
- 6 REST endpoints under `/rent-payments`
- Payment number format: PAY-{YYYYMM}-{SEQUENCE}
- Receipt number format: RCP-{YYYYMM}-{SEQUENCE}
- Payment methods: CARD, FPX, BANK_TRANSFER, CASH, OTHER
- FPX: 16 Malaysian bank codes
- Receipt PDF generation using PDFKit
- Events: rent.payment.completed, rent.payment.failed, billing.status.changed
- Webhook routing: paymentType='rent' metadata → rent payment handler

**Test Results:**
- Unit tests: 207 passing (8 suites) — up from 178 tests (7 suites)
- New: payment.service.spec.ts (29 tests)

### Session 6.4: Payment Reconciliation ✅
- [x] Create ReconciliationService in src/modules/payment/reconciliation/
- [x] matchPaymentToBill: auto-match by exact amount or closest date, manual match by billingId
- [x] handlePartialPayment: update billing paidAmount/balanceDue/status in transaction
- [x] handleOverpayment: detect excess, apply credit to next outstanding billing
- [x] handleAdvancePayment: distribute lump-sum across multiple outstanding billings (oldest first)
- [x] reassignPayment: move completed payment from one billing to another (reverse + apply)
- [x] reconcileBilling: recalculate billing paidAmount from COMPLETED payments
- [x] reconcileTenancy: batch-reconcile all billings for a tenancy
- [x] getStatementOfAccount: full statement with opening balance, entries, running balance, summary
- [x] Statement of Account endpoint: GET /tenancies/:id/statement (with fromDate/toDate filtering)
- [x] 7 new REST endpoints under /rent-payments (advance, reassign, reconcile/billing, reconcile/tenancy, overpayment, match)
- [x] DTOs: StatementQueryDto, ReassignPaymentDto, AdvancePaymentDto
- [x] Events: rent.payment.reassigned, reconciliation.billing.reconciled, reconciliation.overpayment.applied, reconciliation.overpayment.unresolved
- [x] TenancyModule imports RentPaymentModule for statement endpoint
- [x] Unit tests: reconciliation.service.spec.ts (33 tests)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/payment/reconciliation/` — ReconciliationService + tests + barrel export
- `src/modules/payment/dto/reconciliation.dto.ts` — StatementQueryDto, ReassignPaymentDto, AdvancePaymentDto
- 7 new REST endpoints: POST advance, POST reassign, POST reconcile/billing/:id, POST reconcile/tenancy/:id, POST overpayment/:id, POST match/:id, GET /tenancies/:id/statement
- Statement of Account: opening balance, sorted entries (BILLING/PAYMENT/LATE_FEE/CREDIT), running balance, summary (totalBilled, totalPaid, totalOutstanding, totalOverdue)
- Edge cases handled: partial payment, overpayment (credit to next bill), advance payment (oldest-first distribution), wrong bill (reassignment), auto-matching (amount + date heuristics)

**Test Results:**
- Unit tests: 240 passing (9 suites) — up from 207 tests (8 suites)
- New: reconciliation.service.spec.ts (33 tests)

### Session 6.5: Payment Reminder System ✅
- [x] Enhanced RentBillingReminder model: added tenantId, status, escalatedAt, escalatedTo, createdAt, indexes
- [x] Added PAYMENT_REMINDER and LEGAL_NOTICE to NotificationType enum
- [x] Applied migration: add_billing_reminder_enhancements
- [x] Created ReminderService (src/modules/billing/reminder/)
  - sendReminder(billingId, sequence) — manual or auto-sequence
  - scheduleReminders(tenantId) — batch scan, send due reminders
  - escalateToLegal(billingId) — force sequence 4 legal notice
  - listReminders(billingId) — ordered reminder history
- [x] 4-tier schedule: -3 days (EMAIL), 0 days (EMAIL), +7 days (EMAIL), +14 days (LEGAL_NOTICE)
- [x] Event-driven: billing.reminder.sent, billing.reminder.escalated, billing.reminders.process
- [x] Added 3 new endpoints:
  - POST /rent-billings/:id/remind (manual reminder)
  - GET /rent-billings/:id/reminders (reminder history)
  - POST /rent-billings/:id/escalate (legal escalation)
- [x] SendReminderDto with optional sequence (1-4)
- [x] Cron job: daily at 7 AM (schedulePaymentReminders)
- [x] Job type: rent-billing.process-reminders in BillingProcessor (event delegation)
- [x] Registered ReminderService in BillingModule
- [x] Unit tests: 29 tests in reminder.service.spec.ts
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/billing/reminder/` — ReminderService + tests + barrel export
- `src/modules/billing/dto/reminder.dto.ts` — SendReminderDto
- 3 new REST endpoints (remind, reminders, escalate)
- Prisma migration: enhanced RentBillingReminder model
- Scheduler cron at 7 AM for automated reminder processing
- BillingProcessor handler for rent-billing.process-reminders job

**Test Results:**
- Unit tests: 269 passing (10 suites) — up from 240 tests (9 suites)
- New: reminder.service.spec.ts (29 tests)

### Session 6.6: Owner Payout Core ✅
- [x] Read PROPERTY-MANAGEMENT-EXTENSION.md Section 3.10 (Payout specs)
- [x] Added OwnerPayout model to Prisma (UUID, tenantId, ownerId, payoutNumber, period, amounts, bank details, processing fields, indexes)
- [x] Added PayoutLineItem model (cascade delete, type: RENTAL/PLATFORM_FEE/MAINTENANCE/CLAIM_DEDUCTION/OTHER)
- [x] Added Vendor.payouts and Tenant.ownerPayouts relations
- [x] Applied migration: add_owner_payout_module (17th migration)
- [x] Created PayoutModule (src/modules/payout/)
- [x] Created DTOs: CalculatePayoutDto, PayoutQueryDto
- [x] Created PayoutService:
  - calculatePayout(ownerId, periodStart, periodEnd, platformFeePercent?) — gross rental from COMPLETED payments, deduct platform fee, overlap prevention
  - getPayout(payoutId) — single payout with line items
  - listPayouts(options) — paginated list with filters (ownerId, status, period)
  - generatePayoutNumber() — PAY-OUT-{YYYYMM}-{SEQUENCE}
- [x] Created PayoutController with 3 endpoints:
  - POST /payouts/calculate (SUPER_ADMIN, TENANT_ADMIN)
  - GET /payouts (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
  - GET /payouts/:id (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN)
- [x] Payout calculation: sum all COMPLETED RentPayments for owner's tenancies in period
- [x] Platform fee: configurable percentage (default 10%)
- [x] Line items: RENTAL (per payment), PLATFORM_FEE (per tenancy, negative)
- [x] Event emitted: payout.calculated
- [x] Registered PayoutModule in AppModule
- [x] Unit tests: 17 tests in payout.service.spec.ts
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/payout/` — PayoutService, PayoutController, PayoutModule, DTOs, barrel export
- `src/modules/payout/payout.service.spec.ts` — 17 unit tests
- 3 new REST endpoints (calculate, list, get)
- Prisma migration: OwnerPayout + PayoutLineItem models

**Test Results:**
- Unit tests: 286 passing (11 suites) — up from 269 tests (10 suites)
- New: payout.service.spec.ts (17 tests)
### Session 6.7: Owner Payout Processing ✅
- [x] PayoutProcessor — approvePayout: validates CALCULATED status, transitions to APPROVED, records approver
- [x] PayoutProcessor — processBatch: processes APPROVED→PROCESSING→COMPLETED, handles failures→FAILED, generates bankReference
- [x] PayoutProcessor — generateBankFile: CSV with headers (Payout Number, Beneficiary Name, Bank Name, Account Number, Account Holder Name, Amount MYR, Reference, Currency), total summary row, comma escaping
- [x] PayoutScheduler — Monthly payout run cron at `0 8 15 * *` (15th of each month at 8 AM), enqueues per-tenant jobs via BILLING_PROCESS queue
- [x] Payout Statement PDF — Full PDFKit A4 document with header, payout details, bank details, line items table, summary (gross, fees, deductions, net)
- [x] DTOs: ApprovePayoutDto, ProcessBatchDto, BankFileQueryDto
- [x] Controller endpoints:
  - POST /payouts/:id/approve (SUPER_ADMIN, TENANT_ADMIN)
  - POST /payouts/process-batch (SUPER_ADMIN, TENANT_ADMIN)
  - GET /payouts/bank-file (SUPER_ADMIN, TENANT_ADMIN) — CSV download
  - GET /payouts/:id/statement (SUPER_ADMIN, TENANT_ADMIN, VENDOR_ADMIN) — PDF download
- [x] Events: payout.approved, payout.completed, payout.failed
- [x] Unit tests: 14 new tests (approvePayout: 4, processBatch: 4, generateBankFile: 4, generatePayoutStatementPdf: 2)
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/payout/payout.service.ts` — 4 new methods (approvePayout, processBatch, generateBankFile, generatePayoutStatementPdf)
- `src/modules/payout/payout.controller.ts` — 4 new endpoints (approve, process-batch, bank-file, statement)
- `src/modules/payout/dto/process-payout.dto.ts` — ApprovePayoutDto, ProcessBatchDto, BankFileQueryDto
- `src/infrastructure/queue/scheduler.service.ts` — scheduleMonthlyPayoutRun cron
- `src/modules/payout/payout.service.spec.ts` — 14 new tests (31 total)

**Test Results:**
- Unit tests: 300 passing (11 suites) — up from 286 tests
- New: 14 tests in payout.service.spec.ts (approvePayout, processBatch, generateBankFile, generatePayoutStatementPdf)

### Session 6.8: Phase 6 Testing & Reports ✅
- [x] Financial Reports Module (src/modules/report/)
  - ReportService with 3 report methods: getRevenueReport, getCollectionReport, getOutstandingReport
  - ReportController with 3 GET endpoints
  - ReportModule registered in AppModule
  - ReportPeriod enum (DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM)
- [x] DTOs: RevenueReportQueryDto, CollectionReportQueryDto, OutstandingReportQueryDto
- [x] Controller endpoints:
  - GET /reports/revenue (SUPER_ADMIN, TENANT_ADMIN) — Platform revenue with period grouping & owner breakdown
  - GET /reports/collections (SUPER_ADMIN, TENANT_ADMIN) — Rent collection rates with payment method breakdown
  - GET /reports/outstanding (SUPER_ADMIN, TENANT_ADMIN) — Outstanding bills with aging buckets (current, 1-30, 31-60, 61-90, 90+)
- [x] Decimal precision for all financial calculations (Math.round * 100 / 100)
- [x] Unit tests: 21 new tests (revenue: 6, collections: 6, outstanding: 6, period formatting: 3)
- [x] E2E tests: 4 new test suites
  - billing-cycle.e2e-spec.ts — Full cycle: generate → add line items → send → pay → verify PAID → download PDF
  - payment-processing.e2e-spec.ts — Manual payment, payment intent, receipt PDF, reconciliation, FPX banks
  - reminder-escalation.e2e-spec.ts — Reminder sequences 1-3, escalate to legal, mark overdue, apply late fee, write-off
  - payout-calculation.e2e-spec.ts — Calculate payout, approve, process batch, bank file CSV, statement PDF, Decimal precision
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/report/report.service.ts` — ReportService with revenue, collections, outstanding reports
- `src/modules/report/report.controller.ts` — 3 GET endpoints (revenue, collections, outstanding)
- `src/modules/report/report.module.ts` — NestJS module
- `src/modules/report/dto/report-query.dto.ts` — 3 query DTOs + ReportPeriod enum
- `src/modules/report/report.service.spec.ts` — 21 unit tests
- `test/e2e/billing-cycle.e2e-spec.ts` — 8 E2E tests
- `test/e2e/payment-processing.e2e-spec.ts` — 8 E2E tests
- `test/e2e/reminder-escalation.e2e-spec.ts` — 8 E2E tests
- `test/e2e/payout-calculation.e2e-spec.ts` — 8 E2E tests

**Test Results:**
- Unit tests: 321 passing (12 suites) — up from 300 tests
- New: 21 tests in report.service.spec.ts (revenue, collections, outstanding, period formatting)
- E2E suites: 4 new (billing-cycle, payment-processing, reminder-escalation, payout-calculation)

---

### Session 8.5: Legal Module Core ✅

**Date:** 2026-02-23
**Status:** ✅ Complete

**Implementation:**
- [x] Added 3 Prisma models: LegalCase, PanelLawyer, LegalDocument
- [x] Used existing LegalCaseStatus enum (NOTICE_SENT, RESPONSE_PENDING, MEDIATION, COURT_FILED, HEARING_SCHEDULED, JUDGMENT, ENFORCING, CLOSED)
- [x] Added relations: Tenancy.legalCases, Tenant.panelLawyers
- [x] Migration: `20260222173332_add_legal_module` (tables: legal_cases, panel_lawyers, legal_documents)
- [x] Created 7 DTOs: CreateLegalCaseDto, UpdateLegalCaseDto, AssignLawyerDto, GenerateNoticeDto, LegalCaseQueryDto, CreatePanelLawyerDto/UpdatePanelLawyerDto, ResolveCaseDto
- [x] Created LegalService with 13 methods + 1 event handler:
  - createCase (from overdue billing or manual)
  - getCase, listCases
  - updateCase
  - assignLawyer
  - generateNotice (4 templates: FIRST_REMINDER, SECOND_REMINDER, LEGAL_NOTICE, TERMINATION_NOTICE)
  - updateCaseStatus (validated state machine transitions)
  - resolveCase (with settlement tracking)
  - getCaseDocuments
  - createPanelLawyer, getPanelLawyer, listPanelLawyers, updatePanelLawyer
  - @OnEvent('billing.escalated.legal') auto-creates case
- [x] Created LegalController with 13 REST endpoints (9 case + 4 lawyer)
- [x] Created LegalModule and registered in AppModule
- [x] Unit tests: 43 tests across 14 describe blocks
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `prisma/migrations/20260222173332_add_legal_module/migration.sql`
- `src/modules/legal/dto/create-legal-case.dto.ts`
- `src/modules/legal/dto/update-legal-case.dto.ts`
- `src/modules/legal/dto/assign-lawyer.dto.ts`
- `src/modules/legal/dto/generate-notice.dto.ts`
- `src/modules/legal/dto/legal-case-query.dto.ts`
- `src/modules/legal/dto/panel-lawyer.dto.ts`
- `src/modules/legal/dto/resolve-case.dto.ts`
- `src/modules/legal/dto/index.ts`
- `src/modules/legal/legal.service.ts`
- `src/modules/legal/legal.controller.ts`
- `src/modules/legal/legal.module.ts`
- `src/modules/legal/legal.service.spec.ts`
- `src/modules/legal/index.ts`

**Test Results:**
- Unit tests: 657 passing (21 suites) — up from 614 tests
- New: 43 tests in legal.service.spec.ts

---

### Session 8.6: Legal Integration & Finalization ✅

**Date:** 2026-02-23
**Status:** ✅ Complete

**Implementation:**
- [x] Created PanelLawyerService — Extracted CRUD + assignToCase from LegalService
- [x] Created NoticeGeneratorService — Extracted notice templates + generateNotice from LegalService
- [x] Created UploadLegalDocumentDto with LegalDocumentType enum (12 types)
- [x] Added POST /legal-cases/:id/documents endpoint (14th legal endpoint)
- [x] Fixed critical Reminder → Legal event integration:
  - Changed event name: `billing.reminder.escalated` → `billing.escalated.legal`
  - Added `tenancyId` and `amountOwed` to payload (was missing)
  - Fixed typo: `overdaysDays` → `overdueDays`
- [x] Refactored LegalService to delegate to PanelLawyerService and NoticeGeneratorService
- [x] Updated LegalModule providers and exports
- [x] Added 3 new unit tests for uploadDocument (total: 46 legal tests)
- [x] Updated 2 reminder test assertions for new event name
- [x] Created E2E test suite: 17 tests covering complete legal flow
- [x] Build clean (0 TypeScript errors)

**Deliverables:**
- `src/modules/legal/panel-lawyer.service.ts` — PanelLawyerService (CRUD + assignToCase)
- `src/modules/legal/notice-generator.service.ts` — NoticeGeneratorService (templates + generation)
- `src/modules/legal/dto/upload-legal-document.dto.ts` — UploadLegalDocumentDto + LegalDocumentType enum
- `src/modules/legal/legal.service.ts` — Refactored (delegates to new services, added uploadDocument)
- `src/modules/legal/legal.controller.ts` — Added POST /legal-cases/:id/documents
- `src/modules/legal/legal.module.ts` — Updated providers/exports
- `src/modules/legal/legal.service.spec.ts` — Updated + 3 new tests
- `src/modules/billing/reminder/reminder.service.ts` — Fixed event name + payload
- `src/modules/billing/reminder/reminder.service.spec.ts` — Updated assertions
- `test/e2e/legal-flow.e2e-spec.ts` — 17 E2E tests

**Test Results:**
- Unit tests: 660 passing (21 suites) — up from 657 tests
- New: 3 tests in legal.service.spec.ts (uploadDocument)
- E2E: 17 tests (panel lawyer CRUD, case lifecycle, documents, status transitions, resolution)

---

### Phase 8 Checkpoint ✅

**Date:** 2026-02-23
**Status:** ✅ All checks passed

**Verification Results:**
1. ✅ Companies can register and manage agents (9 endpoints)
2. ✅ Agents can be assigned to listings (10 endpoints)
3. ✅ Commissions calculate and track (8 endpoints)
4. ✅ Affiliate referrals track and pay (13 endpoints)
5. ✅ Legal cases create from escalation (event integration verified)
6. ✅ Legal notices generate correctly (NoticeGeneratorService verified)
7. ✅ All E2E tests pass — 178 tests, 13 suites, 0 failures
8. ✅ API documentation complete (310 endpoints)

**Bug Fixes Applied During Checkpoint:**
- **Source: tenancy.repository.ts** — Fixed wrong Vendor field names (`businessName`→`name`, `contactEmail`→`email`) in TenancyView interface and tenancySelect
- **Source: tenancy.repository.ts** — Fixed Deposit field name (`collectedDate`→`collectedAt`)
- **Source: contract.controller.ts** — Fixed route ordering: moved webhook + template static routes before parameterized `@Get(':id')` to prevent route shadowing
- **Source: billing.service.ts** — Expanded `addLineItem` editable statuses to include SENT and OVERDUE (required for `applyLateFee`)
- **Unit: billing.service.spec.ts** — Updated test to check PAID status rejection (was OVERDUE, now allowed)
- **E2E: payout-calculation** — Removed non-existent bank fields from Vendor, fixed `id`→`payoutId`, fixed list response format, added UUID `approvedBy`, fixed bank file query, reordered tests
- **E2E: billing-cycle** — Fixed status `DRAFT`→`GENERATED`, line item type `CHARGE`→`OTHER`, fixed list response format
- **E2E: reminder-escalation** — Added `lateFeePercent: 10` to tenancy, added `.send({})` for POST body
- **E2E: payment-processing** — Fixed list response format, reconcile field names `paidAmount`→`reconciledPaidAmount`, `ONLINE_BANKING`→`FPX`, graceful Stripe handling
- **E2E: occupant** — Two-step status: `PENDING→SCREENING→APPROVED`
- **E2E: tenancy-lifecycle** — Added `managementType: 'TENANT_MANAGED'` to listing

**Final Test Summary:**
- Build: Clean (0 TypeScript errors)
- Unit tests: 660 passing (21 suites)
- E2E tests: 178 passing (13 suites) — run with `--runInBand`