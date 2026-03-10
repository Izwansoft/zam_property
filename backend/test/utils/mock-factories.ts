/**
 * Mock Factories
 * Session 4.5 - Testing & E2E
 *
 * Factory functions for creating mock data in tests.
 */

import { Role, UserStatus, VendorStatus, ListingStatus, AuditActorType } from '@prisma/client';

/**
 * User mock factory
 */
export function createMockUser(
  overrides: Partial<{
    id: string;
    partnerId: string;
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    role: Role;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? 'user-123',
    partnerId: overrides.partnerId ?? 'partner-123',
    email: overrides.email ?? 'test@example.com',
    passwordHash: overrides.passwordHash ?? '$2b$10$hashedpassword',
    fullName: overrides.fullName ?? 'Test User',
    phone: overrides.phone ?? '+60123456789',
    role: overrides.role ?? Role.CUSTOMER,
    status: overrides.status ?? UserStatus.ACTIVE,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Partner mock factory
 */
export function createMockTenant(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? 'partner-123',
    name: overrides.name ?? 'Test Partner',
    slug: overrides.slug ?? 'test-partner',
    subdomain: overrides.subdomain ?? 'test',
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Vendor mock factory
 */
export function createMockVendor(
  overrides: Partial<{
    id: string;
    partnerId: string;
    name: string;
    slug: string;
    email: string;
    phone: string;
    status: VendorStatus;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? 'vendor-123',
    partnerId: overrides.partnerId ?? 'partner-123',
    name: overrides.name ?? 'Test Vendor',
    slug: overrides.slug ?? 'test-vendor',
    email: overrides.email ?? 'vendor@example.com',
    phone: overrides.phone ?? '+60123456789',
    status: overrides.status ?? VendorStatus.PENDING,
    ownerId: overrides.ownerId ?? 'user-123',
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * Listing mock factory
 */
export function createMockListing(
  overrides: Partial<{
    id: string;
    partnerId: string;
    vendorId: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    verticalType: string;
    status: ListingStatus;
    location: object;
    attributes: object;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? 'listing-123',
    partnerId: overrides.partnerId ?? 'partner-123',
    vendorId: overrides.vendorId ?? 'vendor-123',
    title: overrides.title ?? 'Test Listing',
    slug: overrides.slug ?? 'test-listing',
    description: overrides.description ?? 'Test description',
    price: overrides.price ?? 100000,
    currency: overrides.currency ?? 'MYR',
    verticalType: overrides.verticalType ?? 'real_estate',
    status: overrides.status ?? ListingStatus.DRAFT,
    location: overrides.location ?? {
      address: '123 Test Street',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan',
      country: 'Malaysia',
      postalCode: '50000',
    },
    attributes: overrides.attributes ?? {
      propertyType: 'CONDOMINIUM',
      listingType: 'SALE',
      bedrooms: 3,
      bathrooms: 2,
    },
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

/**
 * JWT Payload mock factory
 */
export function createMockJwtPayload(
  overrides: Partial<{
    sub: string;
    partnerId: string;
    role: Role;
    tokenType: 'access' | 'refresh';
  }> = {},
) {
  return {
    sub: overrides.sub ?? 'user-123',
    partnerId: overrides.partnerId ?? 'partner-123',
    role: overrides.role ?? Role.CUSTOMER,
    tokenType: overrides.tokenType ?? 'access',
  };
}

/**
 * Audit log mock factory
 */
export function createMockAuditLog(
  overrides: Partial<{
    id: string;
    partnerId: string;
    actorType: AuditActorType;
    actorId: string;
    actorEmail: string;
    actionType: string;
    targetType: string;
    targetId: string;
    oldValue: object;
    newValue: object;
    metadata: object;
    ipAddress: string;
    userAgent: string;
    requestId: string;
    timestamp: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? 'audit-123',
    partnerId: overrides.partnerId ?? 'partner-123',
    actorType: overrides.actorType ?? AuditActorType.USER,
    actorId: overrides.actorId ?? 'user-123',
    actorEmail: overrides.actorEmail ?? 'te***@example.com',
    actionType: overrides.actionType ?? 'USER_CREATED',
    targetType: overrides.targetType ?? 'user',
    targetId: overrides.targetId ?? 'user-456',
    oldValue: overrides.oldValue ?? null,
    newValue: overrides.newValue ?? { email: 'new@example.com' },
    metadata: overrides.metadata ?? {},
    ipAddress: overrides.ipAddress ?? '192.168.1.xxx',
    userAgent: overrides.userAgent ?? 'Mozilla/5.0',
    requestId: overrides.requestId ?? 'req-123',
    timestamp: overrides.timestamp ?? new Date(),
  };
}

/**
 * Request context mock factory
 */
export function createMockRequest(
  overrides: Partial<{
    PartnerContext: {
      partnerId: string;
      partnerSlug: string;
      correlationId: string;
      userId?: string;
    };
    user: {
      id: string;
      partnerId: string;
      role: Role;
    };
    headers: Record<string, string>;
    ip: string;
  }> = {},
) {
  return {
    PartnerContext: overrides.PartnerContext ?? {
      partnerId: 'partner-123',
      partnerSlug: 'test-partner',
      correlationId: 'corr-123',
    },
    user: overrides.user ?? {
      id: 'user-123',
      partnerId: 'partner-123',
      role: Role.CUSTOMER,
    },
    headers: overrides.headers ?? {
      'X-Partner-ID': 'partner-123',
      'x-request-id': 'req-123',
    },
    ip: overrides.ip ?? '192.168.1.1',
    get: (header: string) => overrides.headers?.[header.toLowerCase()] ?? '',
  };
}
