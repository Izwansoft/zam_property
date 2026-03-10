/**
 * Test Data Factories
 *
 * Deterministic factory helpers for mock DTOs.
 * Keep fixtures small, realistic, and versioned.
 *
 * @see docs/ai-prompt/part-18.md §18.9
 */

import type { Listing, ListingFilters, ListingStatus } from '@/modules/listing/types';
import type { AttributeDefinition, AttributeSchema, AttributeGroup } from '@/verticals/types';
import {
  TenancyStatus,
  TenancyType,
  type Tenancy,
  type TenancyPropertySummary,
} from '@/modules/tenancy/types';
import {
  ContractStatus,
  ContractType,
  SignerStatus,
  SignerRole,
  type Contract,
  type ContractDetail,
  type ContractSigner,
  type ContractEvent,
  type ContractTermsSummary,
} from '@/modules/contract/types';
import {
  DepositType,
  DepositStatus,
  type Deposit,
  type DepositSummary,
  type DepositSummaryItem,
} from '@/modules/deposit/types';
import {
  BillingStatus,
  BillingLineItemType,
  PaymentStatus,
  PaymentMethod,
  type Billing,
  type BillingLineItem,
} from '@/modules/billing/types';
import type { PaymentStatusResponse } from '@/modules/payment/types';
import {
  PayoutStatus,
  PayoutLineItemType,
  type Payout,
  type PayoutLineItem,
} from '@/modules/payout/types';

// ---------------------------------------------------------------------------
// Counter for unique IDs
// ---------------------------------------------------------------------------

let _idCounter = 0;
export function resetIdCounter() {
  _idCounter = 0;
}
export function nextTestId(prefix = 'test'): string {
  return `${prefix}-${++_idCounter}`;
}

// ---------------------------------------------------------------------------
// Listing Factory
// ---------------------------------------------------------------------------

export function createListing(overrides: Partial<Listing> = {}): Listing {
  const id = overrides.id ?? nextTestId('listing');
  return {
    id,
    partnerId: 'tenant-001',
    vendorId: 'vendor-001',
    verticalType: 'REAL_ESTATE',
    schemaVersion: '1.0.0',
    title: `Test Listing ${id}`,
    description: 'A test listing for unit tests',
    slug: `test-listing-${id}`,
    price: 350000,
    currency: 'MYR',
    priceType: 'FIXED',
    location: {
      address: '123 Jalan Test',
      city: 'Kuala Lumpur',
      state: 'Selangor',
      country: 'MY',
    },
    attributes: { propertyType: 'CONDOMINIUM', bedrooms: 3, bathrooms: 2 },
    status: 'DRAFT' as ListingStatus,
    publishedAt: null,
    expiresAt: null,
    isFeatured: false,
    primaryImage: null,
    viewCount: 0,
    inquiryCount: 0,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

export function createListingList(count: number, overrides: Partial<Listing> = {}): Listing[] {
  return Array.from({ length: count }, () => createListing(overrides));
}

// ---------------------------------------------------------------------------
// Attribute Schema Factory
// ---------------------------------------------------------------------------

export function createAttributeDefinition(
  overrides: Partial<AttributeDefinition> = {}
): AttributeDefinition {
  return {
    key: overrides.key ?? 'testAttr',
    label: overrides.label ?? 'Test Attribute',
    type: overrides.type ?? 'string',
    required: overrides.required ?? false,
    requiredForPublish: overrides.requiredForPublish ?? false,
    constraints: overrides.constraints ?? {},
    ui: overrides.ui ?? { group: 'basic', order: 0 },
    ...overrides,
  };
}

export function createAttributeGroup(
  overrides: Partial<AttributeGroup> = {}
): AttributeGroup {
  return {
    key: 'basic',
    label: 'Basic Info',
    order: 0,
    ...overrides,
  };
}

export function createAttributeSchema(
  attributes: AttributeDefinition[] = [],
  groups: AttributeGroup[] = []
): AttributeSchema {
  return {
    version: '1.0.0',
    attributes: attributes.length > 0 ? attributes : [createAttributeDefinition()],
    groups: groups.length > 0 ? groups : [createAttributeGroup()],
  };
}

// ---------------------------------------------------------------------------
// Tenancy Factory
// ---------------------------------------------------------------------------

export function createTenancy(overrides: Partial<Tenancy> = {}): Tenancy {
  const id = overrides.id ?? nextTestId('tenancy');
  return {
    id,
    partnerId: 'tenant-001',
    tenantId: 'tenant-001',
    propertyId: 'property-001',
    ownerId: 'owner-001',
    type: TenancyType.RESIDENTIAL,
    status: TenancyStatus.ACTIVE,
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2027-01-01T00:00:00.000Z',
    monthlyRent: 2500,
    currency: 'MYR',
    securityDeposit: 5000,
    utilityDeposit: 500,
    property: {
      id: 'property-001',
      title: 'Sunny Condo Unit A-12-3',
      address: '123 Jalan Ampang',
      city: 'Kuala Lumpur',
      state: 'Selangor',
      thumbnailUrl: '/images/placeholder.jpg',
      propertyType: 'Condominium',
      bedrooms: 3,
      bathrooms: 2,
    },
    unit: {
      id: 'unit-001',
      unitNumber: 'A-12-3',
      floor: 12,
      block: 'A',
    },
    owner: {
      id: 'owner-001',
      name: 'Ahmad Abdullah',
      email: 'ahmad@example.com',
      phone: '+60123456789',
    },
    createdAt: '2025-12-15T10:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createTenancyList(count: number, overrides: Partial<Tenancy> = {}): Tenancy[] {
  return Array.from({ length: count }, (_, i) =>
    createTenancy({ ...overrides, id: nextTestId('tenancy') })
  );
}

// ---------------------------------------------------------------------------
// Contract Factory
// ---------------------------------------------------------------------------

export function createContractSigner(overrides: Partial<ContractSigner> = {}): ContractSigner {
  const id = overrides.id ?? nextTestId('signer');
  return {
    id,
    contractId: 'contract-001',
    userId: 'user-001',
    role: SignerRole.TENANT,
    status: SignerStatus.PENDING,
    name: 'Test Tenant',
    email: 'tenant@example.com',
    order: 1,
    ...overrides,
  };
}

export function createContractEvent(overrides: Partial<ContractEvent> = {}): ContractEvent {
  const id = overrides.id ?? nextTestId('event');
  return {
    id,
    contractId: 'contract-001',
    eventType: 'CREATED',
    actorName: 'System',
    description: 'Contract was created',
    timestamp: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

export function createContractTerms(overrides: Partial<ContractTermsSummary> = {}): ContractTermsSummary {
  return {
    tenancyPeriod: {
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      durationMonths: 12,
    },
    financials: {
      monthlyRent: 2500,
      securityDeposit: 5000,
      utilityDeposit: 500,
      stampDuty: 240,
      currency: 'MYR',
    },
    noticePeriodDays: 30,
    renewalTerms: 'Renewable for another 12 months by mutual agreement.',
    specialClauses: ['No pets allowed', 'No subletting'],
    ...overrides,
  };
}

export function createContract(overrides: Partial<Contract> = {}): Contract {
  const id = overrides.id ?? nextTestId('contract');
  return {
    id,
    partnerId: 'tenant-001',
    tenancyId: 'tenancy-001',
    type: ContractType.TENANCY_AGREEMENT,
    status: ContractStatus.PENDING_SIGNATURES,
    version: 1,
    title: 'Tenancy Agreement — Sunny Condo A-12-3',
    description: 'Standard tenancy agreement for 12-month lease',
    documentUrl: '/documents/contract-001.pdf',
    pdfUrl: '/documents/contract-001.pdf',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

export function createContractDetail(overrides: Partial<ContractDetail> = {}): ContractDetail {
  const base = createContract(overrides);
  return {
    ...base,
    signers: overrides.signers ?? [
      createContractSigner({
        contractId: base.id,
        userId: 'owner-001',
        role: SignerRole.OWNER,
        name: 'Ahmad Abdullah',
        email: 'ahmad@example.com',
        status: SignerStatus.SIGNED,
        signedAt: '2026-01-02T14:00:00.000Z',
        order: 1,
      }),
      createContractSigner({
        contractId: base.id,
        userId: 'tenant-001',
        role: SignerRole.TENANT,
        name: 'Sarah Tan',
        email: 'sarah@example.com',
        status: SignerStatus.PENDING,
        order: 2,
      }),
    ],
    terms: overrides.terms ?? createContractTerms(),
    events: overrides.events ?? [
      createContractEvent({ contractId: base.id, eventType: 'CREATED', description: 'Contract was created' }),
      createContractEvent({ contractId: base.id, eventType: 'SENT', description: 'Contract sent to all parties' }),
      createContractEvent({
        contractId: base.id,
        eventType: 'SIGNED',
        actorName: 'Ahmad Abdullah',
        actorRole: SignerRole.OWNER,
        description: 'Ahmad Abdullah signed the contract',
      }),
    ],
    tenancy: overrides.tenancy ?? {
      id: 'tenancy-001',
      propertyTitle: 'Sunny Condo Unit A-12-3',
      propertyAddress: '123 Jalan Ampang, Kuala Lumpur',
      tenantName: 'Sarah Tan',
      ownerName: 'Ahmad Abdullah',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Deposit Factory
// ---------------------------------------------------------------------------

export function createDeposit(overrides: Partial<Deposit> = {}): Deposit {
  const id = overrides.id ?? nextTestId('deposit');
  return {
    id,
    tenancyId: 'tenancy-001',
    partnerId: 'tenant-001',
    ownerId: 'owner-001',
    type: DepositType.SECURITY,
    amount: 5000,
    currency: 'MYR',
    status: DepositStatus.COLLECTED,
    collectedAt: '2026-01-05T10:00:00.000Z',
    deductionClaims: [],
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-05T10:00:00.000Z',
    ...overrides,
  };
}

export function createDepositSummary(overrides: Partial<DepositSummary> = {}): DepositSummary {
  return {
    tenancyId: 'tenancy-001',
    totalDeposits: 5500,
    totalCollected: 5500,
    totalRefunded: 0,
    totalDeductions: 0,
    totalPending: 0,
    deposits: [
      {
        id: 'deposit-sec-001',
        type: DepositType.SECURITY,
        amount: 5000,
        status: DepositStatus.COLLECTED,
        refundableAmount: 5000,
      },
      {
        id: 'deposit-util-001',
        type: DepositType.UTILITY,
        amount: 500,
        status: DepositStatus.COLLECTED,
        refundableAmount: 500,
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Billing Factory
// ---------------------------------------------------------------------------

export function createBillingLineItem(overrides: Partial<BillingLineItem> = {}): BillingLineItem {
  const id = overrides.id ?? nextTestId('line-item');
  return {
    id,
    billingId: 'billing-001',
    description: 'Monthly Rent',
    type: BillingLineItemType.RENT,
    amount: 2500,
    createdAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

export function createBilling(overrides: Partial<Billing> = {}): Billing {
  const id = overrides.id ?? nextTestId('billing');
  return {
    id,
    tenancyId: 'tenancy-001',
    billNumber: `BILL-${id.toUpperCase()}`,
    billingPeriod: '2026-01',
    status: BillingStatus.SENT,
    rentAmount: 2500,
    lateFee: 0,
    adjustments: 0,
    totalAmount: 2500,
    paidAmount: 0,
    balanceDue: 2500,
    issueDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-01-15T00:00:00.000Z',
    paidDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lineItems: [
      createBillingLineItem({ billingId: id }),
    ],
    ...overrides,
  };
}

export function createBillingList(count: number, overrides: Partial<Billing> = {}): Billing[] {
  return Array.from({ length: count }, () => createBilling(overrides));
}

// ---------------------------------------------------------------------------
// Payment Factory
// ---------------------------------------------------------------------------

export function createPayment(overrides: Partial<PaymentStatusResponse> = {}): PaymentStatusResponse {
  const id = overrides.id ?? nextTestId('payment');
  return {
    id,
    billingId: 'billing-001',
    paymentNumber: `PAY-${id.toUpperCase()}`,
    amount: 2500,
    currency: 'MYR',
    status: PaymentStatus.COMPLETED,
    method: PaymentMethod.CARD,
    reference: 'REF-123456',
    receiptNumber: `RCP-${id.toUpperCase()}`,
    receiptUrl: null,
    paymentDate: '2026-01-10T14:30:00.000Z',
    processedAt: '2026-01-10T14:30:05.000Z',
    failureReason: null,
    createdAt: '2026-01-10T14:29:00.000Z',
    updatedAt: '2026-01-10T14:30:05.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Payout Factory
// ---------------------------------------------------------------------------

export function createPayoutLineItem(overrides: Partial<PayoutLineItem> = {}): PayoutLineItem {
  const id = overrides.id ?? nextTestId('payout-item');
  return {
    id,
    payoutId: 'payout-001',
    tenancyId: 'tenancy-001',
    type: PayoutLineItemType.RENTAL,
    description: 'Rental Income — Unit A-12-3',
    amount: 2500,
    createdAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

export function createPayout(overrides: Partial<Payout> = {}): Payout {
  const id = overrides.id ?? nextTestId('payout');
  return {
    id,
    partnerId: 'tenant-001',
    ownerId: 'owner-001',
    ownerName: 'Ahmad Abdullah',
    payoutNumber: `PO-${id.toUpperCase()}`,
    periodStart: '2026-01-01T00:00:00.000Z',
    periodEnd: '2026-01-31T23:59:59.000Z',
    status: PayoutStatus.COMPLETED,
    grossRental: 5000,
    platformFee: 250,
    maintenanceCost: 200,
    otherDeductions: 0,
    netPayout: 4550,
    bankName: 'Maybank',
    bankAccount: '164012345678',
    bankAccountName: 'Ahmad Abdullah',
    approvedBy: 'admin-001',
    approvedAt: '2026-01-28T10:00:00.000Z',
    processedAt: '2026-01-30T14:00:00.000Z',
    bankReference: 'MBB-REF-001',
    lineItems: [
      createPayoutLineItem({ payoutId: id, type: PayoutLineItemType.RENTAL, amount: 2500, description: 'Rental Income — Unit A-12-3' }),
      createPayoutLineItem({ payoutId: id, type: PayoutLineItemType.RENTAL, amount: 2500, description: 'Rental Income — Unit B-5-1' }),
      createPayoutLineItem({ payoutId: id, type: PayoutLineItemType.PLATFORM_FEE, amount: -250, description: 'Platform Service Fee (5%)' }),
      createPayoutLineItem({ payoutId: id, type: PayoutLineItemType.MAINTENANCE, amount: -200, description: 'Plumbing repair — Unit A-12-3' }),
    ],
    lineItemCount: 4,
    tenancyCount: 2,
    createdAt: '2026-01-25T10:00:00.000Z',
    updatedAt: '2026-01-30T14:00:00.000Z',
    ...overrides,
  };
}
