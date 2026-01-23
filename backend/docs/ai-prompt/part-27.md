# PART 27 — DATABASE SCHEMA & PRISMA MODEL DEFINITIONS (LOCKED)

This part defines the **authoritative database schema** for all core platform entities.
All implementations must conform to these models exactly.

All rules from PART 0–26 apply.

---

## 27.1 SCHEMA PHILOSOPHY

Rules:
- PostgreSQL is the single source of truth
- Prisma is the ORM layer
- All tables are tenant-aware (where applicable)
- Soft deletes only (no hard deletes)
- Timestamps on all entities
- UUIDs for primary keys

---

## 27.2 CORE ENUMS

```prisma
enum TenantStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum VendorStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum ListingStatus {
  DRAFT
  PUBLISHED
  EXPIRED
  ARCHIVED
}

enum InteractionType {
  LEAD
  ENQUIRY
  BOOKING
}

enum InteractionStatus {
  NEW
  CONTACTED
  CONFIRMED
  CLOSED
  INVALID
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  PAUSED
  CANCELLED
}

enum MediaType {
  IMAGE
  VIDEO
  DOCUMENT
}

enum MediaVisibility {
  PUBLIC
  PRIVATE
}

enum AuditActorType {
  USER
  SYSTEM
  ADMIN
}
```

---

## 27.3 TENANT MODEL

```prisma
model Tenant {
  id              String        @id @default(uuid())
  name            String
  slug            String        @unique
  status          TenantStatus  @default(ACTIVE)
  
  // Configuration
  enabledVerticals String[]     @default([])
  settings        Json?
  branding        Json?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  
  // Relations
  vendors         Vendor[]
  listings        Listing[]
  users           UserTenant[]
  subscription    Subscription?
  auditLogs       AuditLog[]
  
  @@index([status])
  @@index([slug])
}
```

---

## 27.4 USER MODEL

```prisma
model User {
  id              String        @id @default(uuid())
  email           String        @unique
  passwordHash    String?
  
  // Profile
  firstName       String
  lastName        String
  phone           String?
  avatarUrl       String?
  
  // Status
  status          UserStatus    @default(ACTIVE)
  emailVerified   Boolean       @default(false)
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  lastLoginAt     DateTime?
  
  // Relations
  tenants         UserTenant[]
  sessions        Session[]
  
  @@index([email])
  @@index([status])
}

model UserTenant {
  id              String        @id @default(uuid())
  userId          String
  tenantId        String
  
  // Role within tenant
  roles           String[]      @default(["member"])
  
  // Optional vendor association
  vendorId        String?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  user            User          @relation(fields: [userId], references: [id])
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  vendor          Vendor?       @relation(fields: [vendorId], references: [id])
  
  @@unique([userId, tenantId])
  @@index([tenantId])
  @@index([vendorId])
}

model Session {
  id              String        @id @default(uuid())
  userId          String
  
  token           String        @unique
  expiresAt       DateTime
  
  // Metadata
  userAgent       String?
  ipAddress       String?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  
  // Relations
  user            User          @relation(fields: [userId], references: [id])
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

---

## 27.5 VENDOR MODEL

```prisma
model Vendor {
  id              String        @id @default(uuid())
  tenantId        String
  
  // Profile
  name            String
  slug            String
  description     String?
  
  // Contact
  email           String?
  phone           String?
  website         String?
  
  // Address
  address         Json?
  
  // Status & Verification
  status          VendorStatus  @default(PENDING)
  verifiedAt      DateTime?
  verificationData Json?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  
  // Relations
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  listings        Listing[]
  users           UserTenant[]
  interactions    Interaction[]
  reviews         Review[]
  
  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([status])
}
```

---

## 27.6 LISTING MODEL (CORE)

```prisma
model Listing {
  id              String        @id @default(uuid())
  tenantId        String
  vendorId        String
  
  // Vertical (immutable after creation)
  verticalType    String
  schemaVersion   String        @default("1.0")
  
  // Core Fields
  title           String
  description     String?
  slug            String
  
  // Pricing
  price           Decimal?      @db.Decimal(15, 2)
  currency        String        @default("MYR")
  priceType       String?       // sale, rent, negotiable
  
  // Location
  location        Json?         // { address, city, state, country, postalCode, lat, lng }
  
  // Attributes (vertical-specific, opaque to core)
  attributes      Json          @default("{}")
  
  // Status
  status          ListingStatus @default(DRAFT)
  publishedAt     DateTime?
  expiresAt       DateTime?
  
  // Visibility
  isFeatured      Boolean       @default(false)
  featuredUntil   DateTime?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?
  
  // Relations
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  vendor          Vendor        @relation(fields: [vendorId], references: [id])
  media           Media[]
  interactions    Interaction[]
  reviews         Review[]
  
  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([vendorId])
  @@index([verticalType])
  @@index([status])
  @@index([publishedAt])
}
```

---

## 27.7 MEDIA MODEL

```prisma
model Media {
  id              String          @id @default(uuid())
  tenantId        String
  
  // Ownership (polymorphic)
  ownerType       String          // listing, vendor, user
  ownerId         String
  
  // File Info
  filename        String
  mimeType        String
  size            Int             // bytes
  mediaType       MediaType
  
  // Storage
  storageKey      String          @unique
  cdnUrl          String?
  
  // Processing
  thumbnailKey    String?
  thumbnailUrl    String?
  processingStatus String         @default("pending")
  metadata        Json?           // width, height, duration, etc.
  
  // Visibility & Order
  visibility      MediaVisibility @default(PUBLIC)
  sortOrder       Int             @default(0)
  isPrimary       Boolean         @default(false)
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  deletedAt       DateTime?
  
  // Relations (optional direct relation for listings)
  listing         Listing?        @relation(fields: [listingId], references: [id])
  listingId       String?
  
  @@index([tenantId])
  @@index([ownerType, ownerId])
  @@index([storageKey])
}
```

---

## 27.8 INTERACTION MODEL (LEADS/ENQUIRIES/BOOKINGS)

```prisma
model Interaction {
  id              String            @id @default(uuid())
  tenantId        String
  vendorId        String
  listingId       String
  
  // Type
  verticalType    String
  interactionType InteractionType
  
  // Contact (minimal PII)
  contactName     String
  contactEmail    String
  contactPhone    String?
  
  // Content
  message         String?
  
  // Booking specific (optional)
  bookingData     Json?             // dates, quantities, etc.
  
  // Status
  status          InteractionStatus @default(NEW)
  
  // Source
  source          String            @default("web") // web, mobile, api
  referrer        String?
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  contactedAt     DateTime?
  closedAt        DateTime?
  
  // Relations
  tenant          Tenant            @relation(fields: [tenantId], references: [id])
  vendor          Vendor            @relation(fields: [vendorId], references: [id])
  listing         Listing           @relation(fields: [listingId], references: [id])
  
  @@index([tenantId])
  @@index([vendorId])
  @@index([listingId])
  @@index([status])
  @@index([createdAt])
}
```

---

## 27.9 REVIEW MODEL

```prisma
model Review {
  id              String        @id @default(uuid())
  tenantId        String
  
  // Target (vendor or listing)
  targetType      String        // vendor, listing
  targetId        String
  verticalType    String
  
  // Reviewer (anonymized reference)
  reviewerRef     String        // hashed or anonymized
  
  // Content
  rating          Int           // 1-5
  title           String?
  content         String?
  
  // Status
  status          ReviewStatus  @default(PENDING)
  moderatedAt     DateTime?
  moderatedBy     String?
  moderationNote  String?
  
  // Vendor Response
  responseText    String?
  respondedAt     DateTime?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  vendor          Vendor?       @relation(fields: [vendorId], references: [id])
  vendorId        String?
  listing         Listing?      @relation(fields: [listingId], references: [id])
  listingId       String?
  
  @@index([tenantId])
  @@index([targetType, targetId])
  @@index([status])
  @@index([rating])
}
```

---

## 27.10 SUBSCRIPTION & PLAN MODELS

```prisma
model Plan {
  id              String        @id @default(uuid())
  
  // Identity
  name            String
  slug            String        @unique
  description     String?
  
  // Pricing
  priceMonthly    Decimal?      @db.Decimal(10, 2)
  priceYearly     Decimal?      @db.Decimal(10, 2)
  currency        String        @default("MYR")
  
  // Entitlements (declarative)
  entitlements    Json          // { listings: { limit: 50 }, verticals: ["real_estate"], features: [...] }
  
  // Status
  isActive        Boolean       @default(true)
  isPublic        Boolean       @default(true)
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  subscriptions   Subscription[]
  
  @@index([slug])
  @@index([isActive])
}

model Subscription {
  id              String             @id @default(uuid())
  tenantId        String             @unique
  planId          String
  
  // Status
  status          SubscriptionStatus @default(ACTIVE)
  
  // Billing Period
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  
  // External Provider
  externalId      String?            // Stripe subscription ID, etc.
  externalProvider String?           // stripe, manual, etc.
  
  // Overrides (enterprise)
  overrides       Json?
  
  // Timestamps
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  cancelledAt     DateTime?
  
  // Relations
  tenant          Tenant             @relation(fields: [tenantId], references: [id])
  plan            Plan               @relation(fields: [planId], references: [id])
  
  @@index([tenantId])
  @@index([status])
}
```

---

## 27.11 ENTITLEMENT & USAGE MODELS

```prisma
model EntitlementSnapshot {
  id              String        @id @default(uuid())
  tenantId        String
  
  // Resolved entitlements (cached)
  entitlements    Json          // { "listing.create": true, "listing.create.limit": 50, ... }
  
  // Source
  planId          String?
  overrides       Json?
  
  // Timestamps
  computedAt      DateTime      @default(now())
  expiresAt       DateTime
  
  @@unique([tenantId])
  @@index([tenantId])
  @@index([expiresAt])
}

model UsageCounter {
  id              String        @id @default(uuid())
  tenantId        String
  
  // Metric
  metricKey       String        // listing.create.real_estate, interaction.create, etc.
  
  // Period
  periodStart     DateTime
  periodEnd       DateTime
  
  // Count
  count           Int           @default(0)
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([tenantId, metricKey, periodStart])
  @@index([tenantId])
  @@index([metricKey])
  @@index([periodStart])
}
```

---

## 27.12 NOTIFICATION MODEL

```prisma
model Notification {
  id              String        @id @default(uuid())
  tenantId        String?       // null for platform-level
  userId          String
  
  // Content
  type            String        // lead_received, listing_approved, etc.
  title           String
  body            String?
  data            Json?         // contextual payload
  
  // Delivery
  channels        String[]      @default(["in_app"])
  
  // Status
  readAt          DateTime?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  
  @@index([userId])
  @@index([tenantId])
  @@index([readAt])
  @@index([createdAt])
}
```

---

## 27.13 AUDIT LOG MODEL

```prisma
model AuditLog {
  id              String          @id @default(uuid())
  tenantId        String?         // null for platform-level
  
  // Actor
  actorType       AuditActorType
  actorId         String?
  
  // Action
  action          String          // tenant.created, listing.published, etc.
  
  // Target
  targetType      String          // tenant, vendor, listing, etc.
  targetId        String
  
  // Details
  metadata        Json?           // before/after, changes
  
  // Request Context
  requestId       String?
  ipAddress       String?
  userAgent       String?
  
  // Timestamp
  createdAt       DateTime        @default(now())
  
  // Relations
  tenant          Tenant?         @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
  @@index([actorType, actorId])
  @@index([targetType, targetId])
  @@index([action])
  @@index([createdAt])
}
```

---

## 27.14 FEATURE FLAG MODEL

```prisma
model FeatureFlag {
  id              String        @id @default(uuid())
  
  // Identity
  key             String        @unique
  name            String
  description     String?
  
  // Scope
  scope           String        @default("global") // global, tenant, vertical
  
  // Value
  enabled         Boolean       @default(false)
  percentage      Int?          // for gradual rollout (0-100)
  
  // Targeting
  tenantIds       String[]      @default([])
  verticalTypes   String[]      @default([])
  
  // Metadata
  owner           String?
  expiresAt       DateTime?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([key])
  @@index([scope])
}
```

---

## 27.15 VERTICAL REGISTRY MODEL

```prisma
model VerticalDefinition {
  id              String        @id @default(uuid())
  
  // Identity
  verticalType    String        @unique
  displayName     String
  description     String?
  
  // Icon/UI hints
  iconUrl         String?
  uiHints         Json?
  
  // Status
  isActive        Boolean       @default(true)
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  schemas         VerticalAttributeSchema[]
  searchMappings  VerticalSearchMapping[]
  
  @@index([verticalType])
  @@index([isActive])
}

model VerticalAttributeSchema {
  id              String        @id @default(uuid())
  verticalType    String
  schemaVersion   String
  
  // Schema definition
  attributes      Json          // array of attribute definitions
  
  // Validation rules
  requiredForDraft    String[]  @default([])
  requiredForPublish  String[]  @default([])
  
  // Status
  isActive        Boolean       @default(true)
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  vertical        VerticalDefinition @relation(fields: [verticalType], references: [verticalType])
  
  @@unique([verticalType, schemaVersion])
  @@index([verticalType])
  @@index([isActive])
}

model VerticalSearchMapping {
  id              String        @id @default(uuid())
  verticalType    String
  
  // Mapping definition
  filterableFields   Json       // [{ key, type, label }]
  sortableFields     Json       // [{ key, label }]
  facetFields        Json?      // for aggregations
  
  // Status
  isActive        Boolean       @default(true)
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Relations
  vertical        VerticalDefinition @relation(fields: [verticalType], references: [verticalType])
  
  @@unique([verticalType])
  @@index([verticalType])
}
```

---

## 27.16 INDEX CONVENTIONS

Rules:
- Always index `tenantId` for tenant-scoped tables
- Always index `status` fields
- Always index foreign keys
- Composite indexes for common query patterns
- No unnecessary indexes (performance cost)

---

## 27.17 MIGRATION RULES

Rules:
- All schema changes require migrations
- Migrations are versioned and sequential
- Backwards-compatible changes preferred
- Breaking changes require data migration plan
- Never modify existing migrations

---

## 27.18 FORBIDDEN PRACTICES

You must not:
- Create tables without tenant awareness (where applicable)
- Use auto-increment IDs (use UUIDs)
- Hard delete records (soft delete only)
- Skip timestamps
- Create circular dependencies
- Store large blobs in database

END OF PART 27.
