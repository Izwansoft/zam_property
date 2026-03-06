# Property Management Extension - Implementation Plan

> **Document Version:** 1.0  
> **Created:** 2026-02-20  
> **Source:** Client User Journey Document (userjourney.lamaniaga.pdf)  
> **Scope:** Extend existing Listing Marketplace into full Property Management System

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Priority Matrix](#2-priority-matrix)
3. [Database Schema Design](#3-database-schema-design)
4. [Implementation Phases](#4-implementation-phases)
5. [Backend Sessions](#5-backend-sessions)
6. [Frontend Sessions](#6-frontend-sessions)
7. [Integration Points](#7-integration-points)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. Executive Summary

### Current State
- **System Type:** Multi-tenant Listing Marketplace
- **Completed:** 82 sessions (36 backend + 46 frontend)
- **Coverage:** Property search, listings, inquiries, viewing scheduler, vendor management

### Target State
- **System Type:** Property Management + Marketplace (Hybrid)
- **New Modules:** 14 additional modules
- **Estimated Effort:** 24 backend sessions + 28 frontend sessions = **52 sessions**

### Two Business Models

The system supports two distinct business models in one platform:

#### Model 1: Listing Marketplace (Self-Managed)
- Property agents/homeowners list their properties
- Vendors manage everything themselves (self-service)
- Normal marketplace flow - find buyers/renters
- **Status:** ✅ Implemented (Sessions 1-4)

#### Model 2: Property Management Service (Tenant-Managed)
- System Tenant (your client) offers property management as a service
- Vendors can **hire** the System Tenant to manage their property
- System Tenant handles: finding renters, rent collection, agreements, deposits, maintenance
- **Status:** 🏗️ Building (Sessions 5+)

#### ManagementType Field

Each `Listing` has a `managementType` field:

| Value | Description | Who Controls | Features |
|-------|-------------|--------------|----------|
| `SELF_MANAGED` | Default - vendor handles everything | Vendor | Marketplace only |
| `PENDING_MANAGEMENT` | Vendor requested PM service | Pending approval | Marketplace only |
| `TENANT_MANAGED` | System Tenant provides PM service | System Tenant staff | Full PM features |

When `managementType = TENANT_MANAGED`, the following features are unlocked:
- Assign Occupants to the property
- Create Tenancy agreements
- Collect rent monthly
- Handle security deposits
- Manage maintenance requests

#### ManagementType Transition Rules

| Current State | Can Change To | Who Can Change | Conditions |
|---------------|---------------|----------------|------------|
| `SELF_MANAGED` | `PENDING_MANAGEMENT` | **Vendor** | Vendor submits request |
| `PENDING_MANAGEMENT` | `TENANT_MANAGED` | TENANT_ADMIN | Admin approves request |
| `PENDING_MANAGEMENT` | `SELF_MANAGED` | TENANT_ADMIN or Vendor | Request rejected/cancelled |
| `TENANT_MANAGED` | `SELF_MANAGED` | TENANT_ADMIN | No active tenancies |

#### Property Management Onboarding Flow

```
┌─────────────┐     Request PM      ┌────────────────────┐
│ SELF_MANAGED │ ──────────────────► │ PENDING_MANAGEMENT │
│   (Vendor)   │     (Vendor)        │    (Awaiting)      │
└─────────────┘                      └─────────┬──────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │ Approve            │ Reject             │
                          ▼                    ▼                    │
                   ┌──────────────┐     ┌─────────────┐             │
                   │TENANT_MANAGED│     │ SELF_MANAGED│◄────────────┘
                   │  (Active PM) │     │  (Reverted) │   Exit PM
                   └──────────────┘     └─────────────┘  (No tenancies)
```

**Onboarding Steps:**
1. Vendor clicks "Request Property Management" on their listing
2. Listing changes to `PENDING_MANAGEMENT`
3. Tenant Admin receives notification to review
4. Admin reviews listing details, contacts vendor if needed
5. Admin approves → changes to `TENANT_MANAGED`
6. PM features unlocked for that listing

**Exit PM Service:**
1. Tenant Admin initiates exit (or vendor requests)
2. System checks for active tenancies
3. If no active tenancies → changes to `SELF_MANAGED`
4. If active tenancies exist → must wait until all terminated

### Key Terminology Clarification

| Term | Context | Meaning |
|------|---------|---------|
| **Tenant** | SaaS | System tenant - your client's organization (multi-tenancy) |
| **Vendor** | Business | Property owner/agent who lists properties |
| **Occupant** | Property | Renter/lessee who lives in the property |
| **Owner** | Property | Property owner (may be same as Vendor) |
| **Booking** | Process | Rental reservation/tenancy initiation |

> ⚠️ **Important:** We use "Occupant" instead of "Tenant" for renters to avoid confusion with SaaS "Tenant".

---

## 2. Priority Matrix

### Priority Ranking (Based on User Journey Dependencies)

```
P0 (Critical - Blocks Everything)
├── Occupant Module (new user role + dashboard)
├── Tenancy Module (booking → active → terminated lifecycle)
└── Contract Module (legal foundation for all transactions)

P1 (High - Core Revenue)
├── Billing Module (rental income generation)
├── Payment Module (collect rent from occupants)
├── Deposit Module (security deposit lifecycle)
└── Owner Payout Module (distribute funds to owners)

P2 (Medium - Operations)
├── Maintenance Module (tenant requests)
├── Inspection Module (property condition)
└── Claim Module (damage disputes)

P3 (Low - Growth Features)
├── Company Module (agency hierarchy)
├── Agent Module (agent management)
├── Affiliate Module (referral system)
└── Legal Module (escalation & eviction)
```

### Dependency Graph

```
                    ┌─────────────────┐
                    │  OCCUPANT (P0)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ TENANCY  │   │ CONTRACT │   │  DEPOSIT │
       │   (P0)   │   │   (P0)   │   │   (P1)   │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ BILLING  │   │  CLAIM   │   │  PAYOUT  │
       │   (P1)   │   │   (P2)   │   │   (P1)   │
       └────┬─────┘   └──────────┘   └──────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
┌─────────┐  ┌───────────┐
│ PAYMENT │  │ REMINDER  │
│  (P1)   │  │   (P1)    │
└─────────┘  └─────┬─────┘
                   │
                   ▼
             ┌───────────┐
             │   LEGAL   │
             │   (P3)    │
             └───────────┘
```

---

## 3. Database Schema Design

### 3.1 Core Enums

```prisma
// ============================================
// ENUMS - Add to existing schema.prisma
// ============================================

enum OccupantStatus {
  PENDING          // Applied, awaiting approval
  SCREENING        // Background check in progress
  APPROVED         // Passed screening
  REJECTED         // Failed screening
  ACTIVE           // Currently occupying
  NOTICE_GIVEN     // Termination notice submitted
  VACATED          // Moved out
}

enum TenancyStatus {
  DRAFT            // Application started
  BOOKED           // Booking confirmed, awaiting deposit
  DEPOSIT_PAID     // Deposit received
  CONTRACT_PENDING // Awaiting signature
  ACTIVE           // Living in property
  MAINTENANCE_HOLD // Blocked due to unresolved issues
  INSPECTION_PENDING
  TERMINATION_REQUESTED
  TERMINATED
  EXTENDED         // Contract renewed
}

enum ContractStatus {
  DRAFT
  PENDING_SIGNATURE
  PARTIALLY_SIGNED  // One party signed
  ACTIVE
  EXPIRED
  TERMINATED
  RENEWED
}

enum BillingStatus {
  DRAFT
  GENERATED
  SENT
  PARTIALLY_PAID
  PAID
  OVERDUE
  WRITTEN_OFF
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  DISPUTED
}

enum DepositStatus {
  PENDING
  COLLECTED
  HELD
  PARTIALLY_REFUNDED
  FULLY_REFUNDED
  FORFEITED
}

enum MaintenanceStatus {
  OPEN
  VERIFIED
  ASSIGNED
  IN_PROGRESS
  PENDING_APPROVAL
  CLAIM_SUBMITTED
  CLAIM_APPROVED
  CLAIM_REJECTED
  CLOSED
  CANCELLED
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum InspectionType {
  MOVE_IN
  PERIODIC
  MOVE_OUT
  EMERGENCY
}

enum InspectionStatus {
  SCHEDULED
  VIDEO_REQUESTED
  VIDEO_SUBMITTED
  ONSITE_PENDING
  COMPLETED
  REPORT_GENERATED
}

enum ClaimType {
  DAMAGE
  CLEANING
  MISSING_ITEM
  UTILITY
  OTHER
}

enum ClaimStatus {
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  PARTIALLY_APPROVED
  REJECTED
  SETTLED
  DISPUTED
}

enum PayoutStatus {
  PENDING
  CALCULATED
  APPROVED
  PROCESSING
  COMPLETED
  FAILED
}

enum LegalCaseStatus {
  NOTICE_SENT
  RESPONSE_PENDING
  MEDIATION
  COURT_FILED
  HEARING_SCHEDULED
  JUDGMENT
  ENFORCING
  CLOSED
}
```

### 3.2 Occupant Module

```prisma
// ============================================
// OCCUPANT MODULE
// ============================================

model Occupant {
  id              String          @id @default(cuid())
  
  // Link to existing User
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  
  // Tenant context (SaaS multi-tenancy)
  tenantId        String
  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  
  // Profile
  status          OccupantStatus  @default(PENDING)
  employmentType  String?         // EMPLOYED, SELF_EMPLOYED, STUDENT, RETIRED
  monthlyIncome   Decimal?        @db.Decimal(12,2)
  employer        String?
  
  // Verification
  icNumber        String?         // Malaysian IC
  passportNumber  String?
  icVerified      Boolean         @default(false)
  incomeVerified  Boolean         @default(false)
  
  // Emergency Contact
  emergencyName   String?
  emergencyPhone  String?
  emergencyRelation String?
  
  // Screening
  screeningScore  Int?
  screeningNotes  String?
  screenedAt      DateTime?
  screenedBy      String?
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relations
  tenancies       Tenancy[]
  documents       OccupantDocument[]
  
  @@unique([userId, tenantId])
  @@index([tenantId, status])
}

model OccupantDocument {
  id            String    @id @default(cuid())
  occupantId    String
  occupant      Occupant  @relation(fields: [occupantId], references: [id])
  
  type          String    // IC_FRONT, IC_BACK, PAYSLIP, BANK_STATEMENT, EMPLOYMENT_LETTER
  fileName      String
  fileUrl       String
  fileSize      Int
  mimeType      String
  
  verified      Boolean   @default(false)
  verifiedAt    DateTime?
  verifiedBy    String?
  
  createdAt     DateTime  @default(now())
  
  @@index([occupantId, type])
}

model VendorDocument {
  id            String    @id @default(cuid())
  vendorId      String
  vendor        Vendor    @relation(fields: [vendorId], references: [id])
  
  type          String    // IC_FRONT, IC_BACK, BUSINESS_LICENSE, SSM, BANK_STATEMENT
  fileName      String
  fileUrl       String
  fileSize      Int
  mimeType      String
  
  verified      Boolean   @default(false)
  verifiedAt    DateTime?
  verifiedBy    String?
  
  createdAt     DateTime  @default(now())
  
  @@index([vendorId, type])
}
```

### 3.3 Tenancy Module

```prisma
// ============================================
// TENANCY MODULE
// ============================================

model Tenancy {
  id              String          @id @default(cuid())
  
  // Context
  tenantId        String
  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  
  // Property & Parties
  listingId       String
  listing         Listing         @relation(fields: [listingId], references: [id])
  
  ownerId         String          // Vendor who owns the property
  owner           Vendor          @relation("TenancyOwner", fields: [ownerId], references: [id])
  
  occupantId      String
  occupant        Occupant        @relation(fields: [occupantId], references: [id])
  
  // Status
  status          TenancyStatus   @default(DRAFT)
  
  // Dates
  applicationDate DateTime        @default(now())
  moveInDate      DateTime?
  moveOutDate     DateTime?
  leaseStartDate  DateTime?
  leaseEndDate    DateTime?
  actualEndDate   DateTime?
  
  // Financial Terms
  monthlyRent     Decimal         @db.Decimal(12,2)
  securityDeposit Decimal         @db.Decimal(12,2)
  utilityDeposit  Decimal?        @db.Decimal(12,2)
  keyDeposit      Decimal?        @db.Decimal(12,2)
  
  // Billing
  billingDay      Int             @default(1)  // Day of month to generate bill
  paymentDueDay   Int             @default(7)  // Days after billing to pay
  lateFeePercent  Decimal?        @db.Decimal(5,2)
  
  // Metadata
  notes           String?
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relations
  contract        Contract?
  deposits        Deposit[]
  billings        Billing[]
  maintenances    Maintenance[]
  inspections     Inspection[]
  claims          Claim[]
  
  // History
  statusHistory   TenancyStatusHistory[]
  
  @@index([tenantId, status])
  @@index([ownerId])
  @@index([occupantId])
  @@index([listingId])
}

model TenancyStatusHistory {
  id          String        @id @default(cuid())
  tenancyId   String
  tenancy     Tenancy       @relation(fields: [tenancyId], references: [id])
  
  fromStatus  TenancyStatus?
  toStatus    TenancyStatus
  reason      String?
  changedBy   String
  changedAt   DateTime      @default(now())
  
  @@index([tenancyId])
}
```

### 3.4 Contract Module

```prisma
// ============================================
// CONTRACT MODULE
// ============================================

model Contract {
  id              String          @id @default(cuid())
  
  tenancyId       String          @unique
  tenancy         Tenancy         @relation(fields: [tenancyId], references: [id])
  
  // Contract Details
  contractNumber  String          @unique
  templateId      String?         // ContractTemplate reference
  
  status          ContractStatus  @default(DRAFT)
  
  // Dates
  startDate       DateTime
  endDate         DateTime
  signedDate      DateTime?
  
  // Parties
  ownerSignedAt   DateTime?
  ownerSignedBy   String?
  ownerSignatureUrl String?
  
  occupantSignedAt DateTime?
  occupantSignedBy String?
  occupantSignatureUrl String?
  
  // Document
  documentUrl     String?         // Generated PDF
  documentHash    String?         // SHA256 for integrity
  
  // Terms (JSON for flexibility)
  terms           Json            // { rentAmount, deposit, utilities, pets, ... }
  
  // Renewal
  renewedFromId   String?
  renewedFrom     Contract?       @relation("ContractRenewal", fields: [renewedFromId], references: [id])
  renewedTo       Contract?       @relation("ContractRenewal")
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([status])
}

model ContractTemplate {
  id            String    @id @default(cuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  
  name          String
  description   String?
  content       String    @db.Text  // HTML or Markdown template
  variables     Json      // Available merge fields
  
  isDefault     Boolean   @default(false)
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([tenantId, isActive])
}
```

### 3.5 Billing & Payment Module

```prisma
// ============================================
// BILLING MODULE
// ============================================

model Billing {
  id              String          @id @default(cuid())
  
  tenancyId       String
  tenancy         Tenancy         @relation(fields: [tenancyId], references: [id])
  
  // Bill Details
  billNumber      String          @unique
  billingPeriod   DateTime        // Month being billed (e.g., 2026-03-01)
  
  status          BillingStatus   @default(DRAFT)
  
  // Amounts
  rentAmount      Decimal         @db.Decimal(12,2)
  lateFee         Decimal         @default(0) @db.Decimal(12,2)
  adjustments     Decimal         @default(0) @db.Decimal(12,2)  // +/- for claims
  totalAmount     Decimal         @db.Decimal(12,2)
  paidAmount      Decimal         @default(0) @db.Decimal(12,2)
  balanceDue      Decimal         @db.Decimal(12,2)
  
  // Dates
  issueDate       DateTime
  dueDate         DateTime
  paidDate        DateTime?
  
  // Line Items
  lineItems       BillingLineItem[]
  
  // Payments
  payments        Payment[]
  
  // Reminders
  reminders       BillingReminder[]
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([tenancyId, billingPeriod])
  @@index([status, dueDate])
}

model BillingLineItem {
  id          String    @id @default(cuid())
  billingId   String
  billing     Billing   @relation(fields: [billingId], references: [id])
  
  description String
  type        String    // RENT, UTILITY, LATE_FEE, CLAIM_DEDUCTION, OTHER
  amount      Decimal   @db.Decimal(12,2)
  
  // Reference to claim if applicable
  claimId     String?
  
  @@index([billingId])
}

model BillingReminder {
  id          String    @id @default(cuid())
  billingId   String
  billing     Billing   @relation(fields: [billingId], references: [id])
  
  sequence    Int       // 1st, 2nd, 3rd reminder
  type        String    // EMAIL, SMS, LETTER, LEGAL_NOTICE
  sentAt      DateTime
  sentTo      String
  
  response    String?
  respondedAt DateTime?
  
  @@index([billingId])
}

model Payment {
  id            String          @id @default(cuid())
  
  billingId     String
  billing       Billing         @relation(fields: [billingId], references: [id])
  
  // Payment Details
  paymentNumber String          @unique
  amount        Decimal         @db.Decimal(12,2)
  
  status        PaymentStatus   @default(PENDING)
  
  // Method
  method        String          // BANK_TRANSFER, FPX, CARD, CASH
  reference     String?         // Bank ref / Transaction ID
  
  // Gateway
  gatewayId     String?         // Stripe/FPX payment ID
  gatewayData   Json?
  
  // Dates
  paymentDate   DateTime?
  processedAt   DateTime?
  
  // Receipt
  receiptNumber String?
  receiptUrl    String?
  
  // Timestamps
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  @@index([billingId])
  @@index([status])
}
```

### 3.6 Deposit Module

```prisma
// ============================================
// DEPOSIT MODULE
// ============================================

model Deposit {
  id            String          @id @default(cuid())
  
  tenancyId     String
  tenancy       Tenancy         @relation(fields: [tenancyId], references: [id])
  
  // Deposit Details
  type          String          // SECURITY, UTILITY, KEY
  amount        Decimal         @db.Decimal(12,2)
  
  status        DepositStatus   @default(PENDING)
  
  // Collection
  collectedAt   DateTime?
  collectedVia  String?         // Payment method
  paymentRef    String?
  
  // Refund
  refundableAmount  Decimal?    @db.Decimal(12,2)
  deductions        Decimal?    @db.Decimal(12,2)
  refundedAmount    Decimal?    @db.Decimal(12,2)
  refundedAt        DateTime?
  refundRef         String?
  
  // Linked claims for deductions
  deductionClaims   Json?       // Array of { claimId, amount }
  
  // Timestamps
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  @@index([tenancyId, type])
  @@index([status])
}
```

### 3.7 Maintenance Module

```prisma
// ============================================
// MAINTENANCE MODULE
// ============================================

model Maintenance {
  id              String              @id @default(cuid())
  
  tenancyId       String
  tenancy         Tenancy             @relation(fields: [tenancyId], references: [id])
  
  // Request Details
  ticketNumber    String              @unique
  title           String
  description     String              @db.Text
  category        String              // PLUMBING, ELECTRICAL, APPLIANCE, STRUCTURAL, OTHER
  location        String?             // Room/area in property
  
  status          MaintenanceStatus   @default(OPEN)
  priority        MaintenancePriority @default(MEDIUM)
  
  // Reporter
  reportedBy      String              // User ID
  reportedAt      DateTime            @default(now())
  
  // Verification
  verifiedBy      String?
  verifiedAt      DateTime?
  verificationNotes String?
  
  // Assignment
  assignedTo      String?             // Could be vendor staff or external contractor
  assignedAt      DateTime?
  
  // Resolution
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?
  
  // Cost
  estimatedCost   Decimal?            @db.Decimal(12,2)
  actualCost      Decimal?            @db.Decimal(12,2)
  paidBy          String?             // OWNER, OCCUPANT, SHARED
  
  // Media
  attachments     MaintenanceAttachment[]
  
  // Comments/Updates
  updates         MaintenanceUpdate[]
  
  // Linked claim (if occupant paid and wants reimbursement)
  claim           Claim?
  
  // Timestamps
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@index([tenancyId, status])
  @@index([status, priority])
}

model MaintenanceAttachment {
  id              String      @id @default(cuid())
  maintenanceId   String
  maintenance     Maintenance @relation(fields: [maintenanceId], references: [id])
  
  type            String      // IMAGE, VIDEO, DOCUMENT
  fileName        String
  fileUrl         String
  fileSize        Int
  mimeType        String
  
  uploadedBy      String
  uploadedAt      DateTime    @default(now())
  
  @@index([maintenanceId])
}

model MaintenanceUpdate {
  id              String      @id @default(cuid())
  maintenanceId   String
  maintenance     Maintenance @relation(fields: [maintenanceId], references: [id])
  
  message         String
  isInternal      Boolean     @default(false)  // Hidden from occupant
  
  createdBy       String
  createdAt       DateTime    @default(now())
  
  @@index([maintenanceId])
}
```

### 3.8 Inspection Module

```prisma
// ============================================
// INSPECTION MODULE
// ============================================

model Inspection {
  id              String            @id @default(cuid())
  
  tenancyId       String
  tenancy         Tenancy           @relation(fields: [tenancyId], references: [id])
  
  // Inspection Details
  type            InspectionType
  status          InspectionStatus  @default(SCHEDULED)
  
  // Scheduling
  scheduledDate   DateTime?
  scheduledTime   String?           // "10:00-12:00"
  
  // Video Inspection
  videoRequested  Boolean           @default(false)
  videoRequestedAt DateTime?
  videoUrl        String?
  videoSubmittedAt DateTime?
  
  // Onsite Inspection
  onsiteRequired  Boolean           @default(false)
  onsiteDate      DateTime?
  onsiteInspector String?
  
  // Checklist
  checklist       InspectionItem[]
  
  // Report
  reportUrl       String?
  overallRating   Int?              // 1-5
  notes           String?           @db.Text
  
  // Completion
  completedAt     DateTime?
  completedBy     String?
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([tenancyId, type])
  @@index([status])
}

model InspectionItem {
  id            String      @id @default(cuid())
  inspectionId  String
  inspection    Inspection  @relation(fields: [inspectionId], references: [id])
  
  category      String      // BEDROOM, BATHROOM, KITCHEN, LIVING, EXTERIOR
  item          String      // Wall condition, Floor condition, etc.
  
  condition     String?     // EXCELLENT, GOOD, FAIR, POOR, DAMAGED
  notes         String?
  photoUrls     Json?       // Array of image URLs
  
  @@index([inspectionId])
}
```

### 3.9 Claim Module

```prisma
// ============================================
// CLAIM MODULE
// ============================================

model Claim {
  id              String        @id @default(cuid())
  
  tenancyId       String
  tenancy         Tenancy       @relation(fields: [tenancyId], references: [id])
  
  // Optional link to maintenance
  maintenanceId   String?       @unique
  maintenance     Maintenance?  @relation(fields: [maintenanceId], references: [id])
  
  // Claim Details
  claimNumber     String        @unique
  type            ClaimType
  status          ClaimStatus   @default(SUBMITTED)
  
  title           String
  description     String        @db.Text
  
  // Amounts
  claimedAmount   Decimal       @db.Decimal(12,2)
  approvedAmount  Decimal?      @db.Decimal(12,2)
  
  // Evidence
  evidence        ClaimEvidence[]
  
  // Submitted by
  submittedBy     String        // OWNER or OCCUPANT
  submittedAt     DateTime      @default(now())
  
  // Review
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?
  
  // Settlement
  settledAt       DateTime?
  settlementMethod String?      // DEPOSIT_DEDUCTION, BILLING_DEDUCTION, DIRECT_PAYMENT
  
  // Dispute
  isDisputed      Boolean       @default(false)
  disputeReason   String?
  disputedAt      DateTime?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([tenancyId, status])
  @@index([type])
}

model ClaimEvidence {
  id          String    @id @default(cuid())
  claimId     String
  claim       Claim     @relation(fields: [claimId], references: [id])
  
  type        String    // PHOTO, VIDEO, RECEIPT, QUOTE
  fileName    String
  fileUrl     String
  description String?
  
  uploadedAt  DateTime  @default(now())
  
  @@index([claimId])
}
```

### 3.10 Owner Payout Module

```prisma
// ============================================
// OWNER PAYOUT MODULE
// ============================================

model OwnerPayout {
  id              String          @id @default(cuid())
  
  // Owner (Vendor)
  ownerId         String
  owner           Vendor          @relation(fields: [ownerId], references: [id])
  
  // Payout Details
  payoutNumber    String          @unique
  periodStart     DateTime
  periodEnd       DateTime
  
  status          PayoutStatus    @default(PENDING)
  
  // Amounts
  grossRental     Decimal         @db.Decimal(12,2)
  platformFee     Decimal         @db.Decimal(12,2)
  maintenanceCost Decimal         @default(0) @db.Decimal(12,2)
  otherDeductions Decimal         @default(0) @db.Decimal(12,2)
  netPayout       Decimal         @db.Decimal(12,2)
  
  // Line Items
  lineItems       PayoutLineItem[]
  
  // Bank Details
  bankName        String?
  bankAccount     String?
  bankAccountName String?
  
  // Processing
  approvedBy      String?
  approvedAt      DateTime?
  
  processedAt     DateTime?
  bankReference   String?
  bankFile        String?         // Bulk payment file URL
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([ownerId, periodStart])
  @@index([status])
}

model PayoutLineItem {
  id          String      @id @default(cuid())
  payoutId    String
  payout      OwnerPayout @relation(fields: [payoutId], references: [id])
  
  tenancyId   String
  billingId   String?
  
  type        String      // RENTAL, PLATFORM_FEE, MAINTENANCE, CLAIM_DEDUCTION
  description String
  amount      Decimal     @db.Decimal(12,2)
  
  @@index([payoutId])
}
```

### 3.11 Legal Module

```prisma
// ============================================
// LEGAL MODULE
// ============================================

model LegalCase {
  id              String            @id @default(cuid())
  
  tenancyId       String
  tenancy         Tenancy           @relation(fields: [tenancyId], references: [id])
  
  // Case Details
  caseNumber      String            @unique
  status          LegalCaseStatus   @default(NOTICE_SENT)
  
  reason          String            // NON_PAYMENT, BREACH, DAMAGE, OTHER
  description     String            @db.Text
  
  amountOwed      Decimal           @db.Decimal(12,2)
  
  // Lawyer
  lawyerId        String?
  lawyer          PanelLawyer?      @relation(fields: [lawyerId], references: [id])
  
  // Timeline
  noticeDate      DateTime?
  noticeDeadline  DateTime?
  courtDate       DateTime?
  judgmentDate    DateTime?
  
  // Documents
  documents       LegalDocument[]
  
  // Resolution
  resolvedAt      DateTime?
  resolution      String?
  settlementAmount Decimal?         @db.Decimal(12,2)
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([tenancyId])
  @@index([status])
}

model PanelLawyer {
  id            String    @id @default(cuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  
  name          String
  firm          String?
  email         String
  phone         String
  specialization String[]
  
  isActive      Boolean   @default(true)
  
  cases         LegalCase[]
  
  @@index([tenantId, isActive])
}

model LegalDocument {
  id          String      @id @default(cuid())
  caseId      String
  case        LegalCase   @relation(fields: [caseId], references: [id])
  
  type        String      // NOTICE, RESPONSE, COURT_FILING, JUDGMENT
  fileName    String
  fileUrl     String
  
  createdAt   DateTime    @default(now())
  
  @@index([caseId])
}
```

### 3.12 Company & Agent Module

```prisma
// ============================================
// COMPANY & AGENT MODULE
// ============================================

model Company {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  // Company Details
  name            String
  registrationNo  String
  type            String    // PROPERTY_COMPANY, MANAGEMENT_COMPANY, AGENCY
  
  // Contact
  email           String
  phone           String
  address         String?
  
  // Documents
  businessLicense String?
  ssmDocument     String?   // SSM Malaysia
  
  // Subscription
  packageId       String?
  subscriptionId  String?
  
  // Status
  status          String    @default("PENDING")  // PENDING, ACTIVE, SUSPENDED
  verifiedAt      DateTime?
  
  // Relations
  admins          CompanyAdmin[]
  agents          Agent[]
  properties      Listing[]
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([tenantId, status])
}

model CompanyAdmin {
  id          String    @id @default(cuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  role        String    // ADMIN, PIC
  isOwner     Boolean   @default(false)
  
  createdAt   DateTime  @default(now())
  
  @@unique([companyId, userId])
}

model Agent {
  id            String    @id @default(cuid())
  companyId     String
  company       Company   @relation(fields: [companyId], references: [id])
  
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  // REN Number (Malaysia)
  renNumber     String?
  renExpiry     DateTime?
  
  // Performance
  totalListings Int       @default(0)
  totalDeals    Int       @default(0)
  totalRevenue  Decimal   @default(0) @db.Decimal(12,2)
  
  // Referral
  referralCode  String?   @unique
  referredBy    String?
  
  // Status
  status        String    @default("ACTIVE")
  
  // Assigned Listings
  listings      Listing[]
  
  // Commission
  commissions   AgentCommission[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([companyId, userId])
  @@index([companyId, status])
  @@index([referralCode])
}

model AgentCommission {
  id          String    @id @default(cuid())
  agentId     String
  agent       Agent     @relation(fields: [agentId], references: [id])
  
  tenancyId   String
  type        String    // BOOKING, RENEWAL
  
  dealValue   Decimal   @db.Decimal(12,2)
  rate        Decimal   @db.Decimal(5,2)
  amount      Decimal   @db.Decimal(12,2)
  
  status      String    @default("PENDING")  // PENDING, APPROVED, PAID
  paidAt      DateTime?
  
  createdAt   DateTime  @default(now())
  
  @@index([agentId, status])
}
```

### 3.13 Affiliate Module

```prisma
// ============================================
// AFFILIATE MODULE
// ============================================

model Affiliate {
  id            String    @id @default(cuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  code          String    @unique
  type          String    // INDIVIDUAL, COMPANY
  
  // Bank for payouts
  bankName      String?
  bankAccount   String?
  bankAccountName String?
  
  // Stats
  totalReferrals Int      @default(0)
  totalEarnings Decimal   @default(0) @db.Decimal(12,2)
  unpaidEarnings Decimal  @default(0) @db.Decimal(12,2)
  
  // Status
  status        String    @default("ACTIVE")
  
  // Relations
  referrals     AffiliateReferral[]
  payouts       AffiliatePayout[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([tenantId, userId])
  @@index([code])
}

model AffiliateReferral {
  id            String    @id @default(cuid())
  affiliateId   String
  affiliate     Affiliate @relation(fields: [affiliateId], references: [id])
  
  // What was referred
  referralType  String    // OWNER_REGISTRATION, TENANT_BOOKING, AGENT_SIGNUP
  referredId    String    // ID of the referred entity
  
  // Commission
  commissionRate Decimal  @db.Decimal(5,2)
  commissionAmount Decimal @db.Decimal(12,2)
  
  status        String    @default("PENDING")  // PENDING, CONFIRMED, PAID
  
  confirmedAt   DateTime?
  paidAt        DateTime?
  
  createdAt     DateTime  @default(now())
  
  @@index([affiliateId, status])
}

model AffiliatePayout {
  id            String    @id @default(cuid())
  affiliateId   String
  affiliate     Affiliate @relation(fields: [affiliateId], references: [id])
  
  amount        Decimal   @db.Decimal(12,2)
  status        String    @default("PENDING")
  
  processedAt   DateTime?
  reference     String?
  
  createdAt     DateTime  @default(now())
  
  @@index([affiliateId])
}
```

---

## 4. Implementation Phases

### Phase 5: Foundation (P0) — Sessions 1-8

| Session | Module | Description |
|---------|--------|-------------|
| 5.1 | Database | Add all new Prisma models, enums, relations |
| 5.2 | Occupant | Occupant CRUD, profile, document upload |
| 5.3 | Tenancy Core | Tenancy CRUD, status machine |
| 5.4 | Tenancy Workflow | Booking → Deposit → Active flow |
| 5.5 | Contract Core | Contract CRUD, template system |
| 5.6 | Contract Signing | E-signature integration (DocuSign/SignNow) |
| 5.7 | Deposit Core | Deposit collection & tracking |
| 5.8 | Testing & Integration | E2E tests, API documentation |

### Phase 6: Billing & Payments (P1) — Sessions 9-16

| Session | Module | Description |
|---------|--------|-------------|
| 6.1 | Billing Engine | Monthly bill generation, line items |
| 6.2 | Billing Automation | Cron job for monthly billing |
| 6.3 | Payment Processing | FPX/Stripe integration for rent |
| 6.4 | Payment Reconciliation | Auto-match payments to bills |
| 6.5 | Reminder System | Email/SMS reminders, escalation |
| 6.6 | Owner Payout Core | Payout calculation engine |
| 6.7 | Owner Payout Processing | Bank file generation, bulk transfer |
| 6.8 | Testing & Reports | Financial reports, E2E tests |

### Phase 7: Operations (P2) — Sessions 17-22

| Session | Module | Description |
|---------|--------|-------------|
| 7.1 | Maintenance Core | Ticket CRUD, status workflow |
| 7.2 | Maintenance Assignment | Assign to staff/contractor |
| 7.3 | Inspection Core | Checklist, scheduling |
| 7.4 | Video Inspection | Video upload & review |
| 7.5 | Claim Management | Submit, review, approve claims |
| 7.6 | Deposit Deductions | Link claims to deposit refund |

### Phase 8: Growth Features (P3) — Sessions 23-28

| Session | Module | Description |
|---------|--------|-------------|
| 8.1 | Company Module | Company registration, verification |
| 8.2 | Agent Module | Agent CRUD, assignment |
| 8.3 | Agent Commission | Commission tracking & payout |
| 8.4 | Affiliate Core | Referral codes, tracking |
| 8.5 | Legal Module | Notice generation, case tracking |
| 8.6 | Legal Integration | Panel lawyer, court management |

---

## 5. Backend Sessions Detail

### Session 5.1: Database Schema Migration

**Deliverables:**
- [ ] Create new Prisma enums (all status enums)
- [ ] Create Occupant model + OccupantDocument
- [ ] Create Tenancy model + TenancyStatusHistory
- [ ] Create Contract model + ContractTemplate
- [ ] Create Deposit model
- [ ] Generate migration
- [ ] Seed development data

**Files:**
```
prisma/
├── schema.prisma (extend with new models)
└── migrations/
    └── 20260220_property_management/
```

### Session 5.2: Occupant Module

**Deliverables:**
- [ ] `OccupantService` - CRUD, screening, documents
- [ ] `OccupantController` - REST endpoints
- [ ] `OccupantDto` - Validation DTOs
- [ ] Document upload to S3
- [ ] Screening workflow

**Endpoints:**
```
POST   /occupants                  Create occupant profile
GET    /occupants                  List occupants (for owner)
GET    /occupants/:id              Get occupant detail
PATCH  /occupants/:id              Update occupant
POST   /occupants/:id/documents    Upload document
POST   /occupants/:id/verify       Verify occupant (admin)
POST   /occupants/:id/screen       Run screening
```

### Session 5.3-5.4: Tenancy Module

**Deliverables:**
- [ ] `TenancyService` - Core CRUD
- [ ] `TenancyStateMachine` - Status transitions
- [ ] `TenancyController` - REST endpoints
- [ ] Status history tracking
- [ ] Booking → Active workflow

**Endpoints:**
```
POST   /tenancies                  Create tenancy (booking)
GET    /tenancies                  List tenancies
GET    /tenancies/:id              Get tenancy detail
PATCH  /tenancies/:id              Update tenancy
POST   /tenancies/:id/deposit      Mark deposit paid
POST   /tenancies/:id/activate     Activate tenancy
POST   /tenancies/:id/terminate    Request termination
GET    /tenancies/:id/history      Get status history
```

### Session 5.5-5.6: Contract Module

**Deliverables:**
- [ ] `ContractService` - Generation, signing
- [ ] `ContractTemplateService` - Template management
- [ ] E-signature integration (DocuSign API)
- [ ] PDF generation (Puppeteer/PDFKit)
- [ ] Contract renewal logic

**Endpoints:**
```
POST   /contracts                  Generate contract
GET    /contracts/:id              Get contract
POST   /contracts/:id/sign         Request signatures
POST   /contracts/:id/owner-sign   Owner signs
POST   /contracts/:id/occupant-sign Occupant signs
GET    /contracts/:id/download     Download PDF

GET    /contract-templates         List templates
POST   /contract-templates         Create template
PATCH  /contract-templates/:id     Update template
```

### Session 6.1-6.2: Billing Engine

**Deliverables:**
- [ ] `BillingService` - Bill generation
- [ ] `BillingScheduler` - Monthly cron job
- [ ] Line item calculation
- [ ] Late fee calculation
- [ ] Bill PDF generation

**Endpoints:**
```
POST   /billings/generate          Manual bill generation
GET    /billings                   List bills
GET    /billings/:id               Get bill detail
GET    /billings/:id/download      Download PDF
POST   /billings/:id/send          Send bill to occupant
```

### Session 6.3-6.4: Payment Processing

**Deliverables:**
- [ ] `PaymentService` - Process payments
- [ ] FPX integration (Malaysia)
- [ ] Stripe integration (international)
- [ ] Payment reconciliation
- [ ] Receipt generation

**Endpoints:**
```
POST   /payments                   Create payment intent
POST   /payments/webhook           Payment gateway webhook
GET    /payments/:id               Get payment detail
GET    /payments/:id/receipt       Download receipt
```

### Session 6.5: Reminder System

**Deliverables:**
- [ ] `ReminderService` - Send reminders
- [ ] `ReminderScheduler` - Automated reminders
- [ ] Email templates
- [ ] SMS templates
- [ ] Escalation logic

**Endpoints:**
```
POST   /billings/:id/remind        Send manual reminder
GET    /billings/:id/reminders     Get reminder history
```

### Session 6.6-6.7: Owner Payout

**Deliverables:**
- [ ] `PayoutService` - Calculate payouts
- [ ] `PayoutScheduler` - Monthly payout run
- [ ] Bank file generation (CSV/MT940)
- [ ] Payout approval workflow

**Endpoints:**
```
POST   /payouts/calculate          Calculate payouts
GET    /payouts                    List payouts
GET    /payouts/:id                Get payout detail  
POST   /payouts/:id/approve        Approve payout
POST   /payouts/process            Process approved payouts
GET    /payouts/bank-file          Download bank file
```

### Session 7.1-7.2: Maintenance Module

**Deliverables:**
- [ ] `MaintenanceService` - Ticket CRUD
- [ ] Status workflow
- [ ] Assignment logic
- [ ] File attachments
- [ ] Comment system

**Endpoints:**
```
POST   /maintenance                Create ticket
GET    /maintenance                List tickets
GET    /maintenance/:id            Get ticket
PATCH  /maintenance/:id            Update ticket
POST   /maintenance/:id/assign     Assign to staff
POST   /maintenance/:id/resolve    Mark resolved
POST   /maintenance/:id/attachments Upload files
POST   /maintenance/:id/comments   Add comment
```

### Session 7.3-7.4: Inspection Module

**Deliverables:**
- [ ] `InspectionService` - CRUD, checklist
- [ ] Scheduling
- [ ] Video upload handling
- [ ] Report generation

**Endpoints:**
```
POST   /inspections                Schedule inspection
GET    /inspections                List inspections
GET    /inspections/:id            Get inspection
POST   /inspections/:id/video      Upload video
POST   /inspections/:id/checklist  Update checklist
POST   /inspections/:id/complete   Complete inspection
GET    /inspections/:id/report     Download report
```

### Session 7.5-7.6: Claim Module

**Deliverables:**
- [ ] `ClaimService` - Claim CRUD
- [ ] Evidence handling
- [ ] Review workflow
- [ ] Deposit deduction logic

**Endpoints:**
```
POST   /claims                     Submit claim
GET    /claims                     List claims
GET    /claims/:id                 Get claim
POST   /claims/:id/evidence        Upload evidence
POST   /claims/:id/review          Review claim
POST   /claims/:id/dispute         Dispute claim
```

---

## 6. Frontend Sessions Detail

### Phase 5: Foundation UI — Sessions 1-12

| Session | Focus | Components |
|---------|-------|------------|
| 5.1 | Occupant Dashboard | New `/dashboard/occupant` portal |
| 5.2 | Occupant Onboarding | Profile form, document upload |
| 5.3 | Tenancy List | My tenancies, status badges |
| 5.4 | Tenancy Detail | Timeline, documents, actions |
| 5.5 | Tenancy Booking | Booking wizard (property → deposit → confirm) |
| 5.6 | Contract View | Contract detail, PDF preview |
| 5.7 | Contract Signing | E-signature embedded iframe |
| 5.8 | Deposit Tracking | Deposit status, history |
| 5.9 | Owner Tenancy List | Owner view of all tenancies |
| 5.10 | Owner Tenancy Actions | Approve/reject, handover |
| 5.11 | Navigation Updates | Add occupant portal, routes |
| 5.12 | Testing | Component tests |

### Phase 6: Billing & Payment UI — Sessions 13-20

| Session | Focus | Components |
|---------|-------|------------|
| 6.1 | Bill List | Occupant bills, status filter |
| 6.2 | Bill Detail | Line items, payment history |
| 6.3 | Pay Bill | Payment form, gateway redirect |
| 6.4 | Payment Receipt | Receipt view, download |
| 6.5 | Owner Billing Dashboard | All bills by property |
| 6.6 | Owner Payout List | Payout history, statements |
| 6.7 | Owner Payout Detail | Line items, bank info |
| 6.8 | Testing | E2E payment flow tests |

### Phase 7: Operations UI — Sessions 21-26

| Session | Focus | Components |
|---------|-------|------------|
| 7.1 | Maintenance Request | Submit form, photo upload |
| 7.2 | Maintenance Tracking | Status timeline, updates |
| 7.3 | Owner Maintenance | Inbox, assignment, resolution |
| 7.4 | Inspection Scheduling | Calendar, time slots |
| 7.5 | Video Inspection | Upload, playback |
| 7.6 | Claim Management | Submit, track, dispute |

### Phase 8: Growth UI — Sessions 27-34

| Session | Focus | Components |
|---------|-------|------------|
| 8.1 | Company Registration | Multi-step wizard |
| 8.2 | Company Dashboard | Stats, team, properties |
| 8.3 | Agent Management | CRUD, assignment |
| 8.4 | Agent Dashboard | Performance, commission |
| 8.5 | Affiliate Dashboard | Referral code, earnings |
| 8.6 | Legal Case View | Timeline, documents |

---

## 7. Integration Points

### 7.1 Existing System Touchpoints

| New Feature | Integrates With | Integration Type |
|-------------|-----------------|------------------|
| Occupant | User | New role `OCCUPANT` |
| Tenancy | Listing | FK relationship |
| Tenancy | Vendor (Owner) | FK relationship |
| Billing | Notification | Send bill reminders |
| Payment | Stripe (existing) | Reuse payment infra |
| Maintenance | Media | Reuse S3 uploads |
| Contract | Media | Store PDFs |
| Company | Vendor | Company owns vendors |

### 7.2 New User Role

Add to existing `UserRole` enum:
```prisma
enum UserRole {
  SUPER_ADMIN
  TENANT_ADMIN
  VENDOR_ADMIN
  VENDOR_STAFF
  CUSTOMER
  OCCUPANT      // NEW
  AGENT         // NEW  
  COMPANY_ADMIN // NEW
  GUEST
}
```

### 7.3 Navigation Updates

```typescript
// config/navigation.ts - Add new portal

export const occupantNav: Navigation = {
  name: "My Tenancy",
  logoPath: "/logo.svg",
  navGroups: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard/occupant", icon: LayoutDashboardIcon },
        { title: "My Tenancy", url: "/dashboard/occupant/tenancy", icon: HomeIcon },
        { title: "Bills & Payments", url: "/dashboard/occupant/bills", icon: CreditCardIcon },
      ]
    },
    {
      label: "Services",
      items: [
        { title: "Maintenance", url: "/dashboard/occupant/maintenance", icon: WrenchIcon },
        { title: "Inspections", url: "/dashboard/occupant/inspections", icon: ClipboardCheckIcon },
        { title: "Documents", url: "/dashboard/occupant/documents", icon: FileTextIcon },
      ]
    },
    {
      label: "Account",
      items: [
        { title: "Profile", url: "/dashboard/occupant/profile", icon: UserIcon },
        { title: "Settings", url: "/dashboard/occupant/settings", icon: SettingsIcon },
      ]
    }
  ]
};
```

---

## 8. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| E-signature integration | Complex, legal compliance | Use established provider (DocuSign/Adobe Sign) |
| Payment reconciliation | Financial accuracy critical | Webhook verification, manual reconciliation fallback |
| Multi-tenant isolation | Data leakage | Reuse existing tenant isolation patterns |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | Timeline extension | Strict scope per session, MVP first |
| Performance | Large data volumes | Pagination, caching, background jobs |
| Legal compliance | Varies by country | Make templates configurable |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| UI complexity | User confusion | Reuse existing shadcn components |
| Testing coverage | Quality issues | Follow existing test patterns |

---

## 9. Estimated Timeline

| Phase | Sessions | Duration (2 per week) |
|-------|----------|----------------------|
| Phase 5: Foundation (BE) | 8 | 4 weeks |
| Phase 5: Foundation (FE) | 12 | 6 weeks |
| Phase 6: Billing (BE) | 8 | 4 weeks |
| Phase 6: Billing (FE) | 8 | 4 weeks |
| Phase 7: Operations (BE) | 6 | 3 weeks |
| Phase 7: Operations (FE) | 6 | 3 weeks |
| Phase 8: Growth (BE) | 6 | 3 weeks |
| Phase 8: Growth (FE) | 8 | 4 weeks |
| **Total** | **52** | **~26 weeks** |

### Parallel Development Option

If backend and frontend can be developed in parallel with mocks:
- **Critical Path:** ~14 weeks (Phase 5 + 6 backend, then Phase 7-8)
- **With Parallelization:** ~18 weeks total

---

## 10. Next Steps

1. **Review & Approve:** Client reviews this plan
2. **Database Migration:** Start with Session 5.1
3. **API-First:** Backend endpoints with Swagger docs
4. **Frontend Mocks:** MSW handlers for parallel frontend dev
5. **Incremental Delivery:** Demo after each phase

---

## Appendix A: Quick Reference - Status Flows

### Tenancy Status Flow
```
DRAFT → BOOKED → DEPOSIT_PAID → CONTRACT_PENDING → ACTIVE
                                                    ↓
                    TERMINATED ← TERMINATION_REQUESTED
                         ↑
                    INSPECTION_PENDING
                         ↑
                    MAINTENANCE_HOLD (optional)
                         
ACTIVE → EXTENDED (renewal)
```

### Maintenance Status Flow
```
OPEN → VERIFIED → ASSIGNED → IN_PROGRESS → CLOSED
                      ↓
              PENDING_APPROVAL → CLAIM_SUBMITTED → CLAIM_APPROVED/REJECTED → CLOSED
```

### Billing Status Flow
```
DRAFT → GENERATED → SENT → PAID
                     ↓
                  PARTIALLY_PAID → PAID
                     ↓
                  OVERDUE → WRITTEN_OFF (legal)
```

---

*Document generated by AI Agent - Review with stakeholders before implementation*
