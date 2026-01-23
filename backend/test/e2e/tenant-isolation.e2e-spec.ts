/**
 * Tenant Isolation E2E Tests
 * Session 4.5 - Testing & E2E
 *
 * Tests to verify multi-tenant data isolation.
 * This is CRITICAL for security - data should never leak between tenants.
 *
 * Note: API returns standardized response format: { data: {...}, meta: {...} }
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus, VendorStatus, ListingStatus, TenantStatus } from '@prisma/client';

import { AppModule } from '@/app.module';
import { PrismaService } from '@infrastructure/database';

/**
 * Helper to extract data from standardized API response
 */
function getResponseData(body: unknown): Record<string, unknown> {
  if (typeof body === 'object' && body !== null && 'data' in body) {
    return (body as { data: Record<string, unknown> }).data;
  }
  return body as Record<string, unknown>;
}

/**
 * Helper to extract items from paginated response
 * API may return: { items: [], pagination: {} } or { data: [], meta: {} }
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function getResponseItems(body: unknown): any[] {
  if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;
    if ('items' in obj) {
      return obj.items as any[];
    }
    if ('data' in obj) {
      const data = obj.data as Record<string, unknown>;
      if (Array.isArray(data)) {
        return data;
      }
      if (typeof data === 'object' && data !== null && 'items' in data) {
        return data.items as any[];
      }
      if (typeof data === 'object' && data !== null && 'data' in data) {
        return data.data as any[];
      }
    }
  }
  if (Array.isArray(body)) {
    return body;
  }
  return [];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

describe('Tenant Isolation E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tenant A
  let tenantAId: string;
  let _tenantAUserId: string;
  let tenantAUserEmail: string;
  let tenantAVendorId: string;
  let tenantAListingId: string;
  let tenantAAccessToken: string;

  // Tenant B
  let tenantBId: string;
  let tenantBUserId: string;
  let tenantBUserEmail: string;
  let tenantBVendorId: string;
  let tenantBListingId: string;
  let tenantBAccessToken: string;

  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.setGlobalPrefix('api/v1');

    await app.init();

    prisma = app.get(PrismaService);

    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const timestamp = Date.now();

    // ===== Create Tenant A =====
    const tenantA = await prisma.tenant.create({
      data: {
        name: 'Tenant A',
        slug: `tenant-a-${timestamp}`,
        enabledVerticals: ['real_estate'],
        settings: {
          create: {},
        },
      },
    });
    tenantAId = tenantA.id;

    const vendorA = await prisma.vendor.create({
      data: {
        tenantId: tenantAId,
        name: 'Vendor A',
        slug: `vendor-a-${timestamp}`,
        email: 'vendora@example.com',
        phone: '+60123456001',
        status: VendorStatus.APPROVED,
        profile: {
          create: {},
        },
        settings: {
          create: {},
        },
      },
    });
    tenantAVendorId = vendorA.id;

    tenantAUserEmail = `user-a-${timestamp}@example.com`;
    const userA = await prisma.user.create({
      data: {
        tenantId: tenantAId,
        email: tenantAUserEmail,
        passwordHash: hashedPassword,
        fullName: 'User A',
        role: Role.VENDOR_ADMIN,
        status: UserStatus.ACTIVE,
        vendorId: tenantAVendorId,
      },
    });
    _tenantAUserId = userA.id;

    const listingA = await prisma.listing.create({
      data: {
        tenantId: tenantAId,
        vendorId: tenantAVendorId,
        title: 'Tenant A Listing',
        slug: `tenant-a-listing-${timestamp}`,
        description: 'A listing belonging to Tenant A',
        price: 100000,
        currency: 'MYR',
        verticalType: 'real_estate',
        status: ListingStatus.PUBLISHED,
        location: {
          address: '123 Tenant A Street',
          city: 'Kuala Lumpur',
          state: 'Wilayah Persekutuan',
          country: 'Malaysia',
        },
        attributes: {
          propertyType: 'CONDOMINIUM',
          listingType: 'SALE',
        },
      },
    });
    tenantAListingId = listingA.id;

    // ===== Create Tenant B =====
    const tenantB = await prisma.tenant.create({
      data: {
        name: 'Tenant B',
        slug: `tenant-b-${timestamp}`,
        enabledVerticals: ['real_estate'],
        settings: {
          create: {},
        },
      },
    });
    tenantBId = tenantB.id;

    const vendorB = await prisma.vendor.create({
      data: {
        tenantId: tenantBId,
        name: 'Vendor B',
        slug: `vendor-b-${timestamp}`,
        email: 'vendorb@example.com',
        phone: '+60123456002',
        status: VendorStatus.APPROVED,
        profile: {
          create: {},
        },
        settings: {
          create: {},
        },
      },
    });
    tenantBVendorId = vendorB.id;

    tenantBUserEmail = `user-b-${timestamp}@example.com`;
    const userB = await prisma.user.create({
      data: {
        tenantId: tenantBId,
        email: tenantBUserEmail,
        passwordHash: hashedPassword,
        fullName: 'User B',
        role: Role.VENDOR_ADMIN,
        status: UserStatus.ACTIVE,
        vendorId: tenantBVendorId,
      },
    });
    tenantBUserId = userB.id;

    const listingB = await prisma.listing.create({
      data: {
        tenantId: tenantBId,
        vendorId: tenantBVendorId,
        title: 'Tenant B Listing',
        slug: `tenant-b-listing-${timestamp}`,
        description: 'A listing belonging to Tenant B',
        price: 200000,
        currency: 'MYR',
        verticalType: 'real_estate',
        status: ListingStatus.PUBLISHED,
        location: {
          address: '456 Tenant B Street',
          city: 'Kuala Lumpur',
          state: 'Wilayah Persekutuan',
          country: 'Malaysia',
        },
        attributes: {
          propertyType: 'CONDOMINIUM',
          listingType: 'SALE',
        },
      },
    });
    tenantBListingId = listingB.id;

    // ===== Get Access Tokens =====
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Tenant-ID', tenantAId)
      .send({
        email: tenantAUserEmail,
        password: testPassword,
      });
    const loginAData = getResponseData(loginA.body);
    tenantAAccessToken = loginAData.accessToken as string;

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Tenant-ID', tenantBId)
      .send({
        email: tenantBUserEmail,
        password: testPassword,
      });
    const loginBData = getResponseData(loginB.body);
    tenantBAccessToken = loginBData.accessToken as string;
  });

  afterAll(async () => {
    // Cleanup Tenant A
    try {
      await prisma.listing.deleteMany({ where: { tenantId: tenantAId } });
      await prisma.vendorSettings.deleteMany({ where: { vendor: { tenantId: tenantAId } } });
      await prisma.vendorProfile.deleteMany({ where: { vendor: { tenantId: tenantAId } } });
      await prisma.user.deleteMany({ where: { tenantId: tenantAId } });
      await prisma.vendor.deleteMany({ where: { tenantId: tenantAId } });
      await prisma.tenantSettings.deleteMany({ where: { tenantId: tenantAId } });
      await prisma.tenant.delete({ where: { id: tenantAId } });
    } catch {
      // Ignore cleanup errors
    }

    // Cleanup Tenant B
    try {
      await prisma.listing.deleteMany({ where: { tenantId: tenantBId } });
      await prisma.vendorSettings.deleteMany({ where: { vendor: { tenantId: tenantBId } } });
      await prisma.vendorProfile.deleteMany({ where: { vendor: { tenantId: tenantBId } } });
      await prisma.user.deleteMany({ where: { tenantId: tenantBId } });
      await prisma.vendor.deleteMany({ where: { tenantId: tenantBId } });
      await prisma.tenantSettings.deleteMany({ where: { tenantId: tenantBId } });
      await prisma.tenant.delete({ where: { id: tenantBId } });
    } catch {
      // Ignore cleanup errors
    }

    await app.close();
  });

  describe('Authentication Isolation', () => {
    it('should NOT allow User A to login with Tenant B context', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', tenantBId)
        .send({
          email: tenantAUserEmail,
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });

    it('should NOT allow User B to login with Tenant A context', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', tenantAId)
        .send({
          email: tenantBUserEmail,
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });

    it('should NOT allow Tenant A token to be used with Tenant B header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Tenant-ID', tenantBId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      // Token's tenantId won't match header tenantId - either 401 (unauthorized) or 404 (user not found in tenant)
      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Listing Isolation', () => {
    it('should NOT return Tenant B listings when querying as Tenant A', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      expect(response.status).toBe(200);
      const listings = getResponseItems(response.body);

      // Verify no Tenant B listing in results
      expect(listings.some((l: { id?: string }) => l.id === tenantBListingId)).toBe(false);
    });

    it('should NOT return Tenant A listings when querying as Tenant B', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Tenant-ID', tenantBId)
        .set('Authorization', `Bearer ${tenantBAccessToken}`);

      expect(response.status).toBe(200);
      const listings = getResponseItems(response.body);

      // Verify no Tenant A listing in results
      expect(listings.some((l: { id?: string }) => l.id === tenantAListingId)).toBe(false);
    });

    it('should NOT allow Tenant A to access Tenant B listing by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${tenantBListingId}`)
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      expect(response.status).toBe(404);
    });

    it('should NOT allow Tenant B to access Tenant A listing by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${tenantAListingId}`)
        .set('X-Tenant-ID', tenantBId)
        .set('Authorization', `Bearer ${tenantBAccessToken}`);

      expect(response.status).toBe(404);
    });

    it('should NOT allow Tenant A to update Tenant B listing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/listings/${tenantBListingId}`)
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`)
        .send({
          title: 'Hacked by Tenant A',
        });

      expect(response.status).toBe(404);
    });

    it('should NOT allow Tenant A to delete Tenant B listing', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/listings/${tenantBListingId}`)
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Vendor Isolation', () => {
    it('should NOT return Tenant B vendors when querying as Tenant A', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vendors')
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      expect(response.status).toBe(200);
      const vendors = getResponseItems(response.body);

      // Verify no Tenant B vendor in results
      expect(vendors.some((v: { id?: string }) => v.id === tenantBVendorId)).toBe(false);
    });

    it('should NOT allow Tenant A to access Tenant B vendor by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vendors/${tenantBVendorId}`)
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      expect(response.status).toBe(404);
    });

    it('should NOT allow Tenant A to update Tenant B vendor', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vendors/${tenantBVendorId}`)
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`)
        .send({
          name: 'Hacked by Tenant A',
        });

      // Either vendor not found (404) or VENDOR_ADMIN can't update other vendors (403)
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('User Isolation', () => {
    it('should NOT allow Tenant A to access Tenant B user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${tenantBUserId}`)
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      // VENDOR_ADMIN can't access user endpoints (403), or tenant isolation returns 404
      // Either way, data is protected
      expect([403, 404]).toContain(response.status);
    });

    // Note: VENDOR_ADMIN role doesn't have permission to list users (requires SUPER_ADMIN or TENANT_ADMIN)
    // This test verifies that even if they could access, they wouldn't see other tenant's users
    it('should NOT return Tenant B users when querying as Tenant A', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('X-Tenant-ID', tenantAId)
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      // VENDOR_ADMIN gets 403 (Forbidden) - which is also secure
      // If we had TENANT_ADMIN role, it would be 200 with only Tenant A users
      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        const users = getResponseItems(response.body);
        // All returned users should not be from Tenant B
        if (users.length > 0) {
          expect(users.every((u: { tenantId?: string }) => u.tenantId !== tenantBId)).toBe(true);
        }
      }
    });
  });

  describe('Tenant Status Isolation', () => {
    let suspendedTenantId: string;
    let suspendedTenantUserEmail: string;
    let suspendedTenantToken: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash(testPassword, 10);

      // Create a tenant that will be suspended
      const suspendedTenant = await prisma.tenant.create({
        data: {
          name: 'Suspended Tenant',
          slug: `suspended-tenant-${timestamp}`,
          enabledVerticals: ['real_estate'],
          status: TenantStatus.ACTIVE, // Start as active
          settings: {
            create: {},
          },
        },
      });
      suspendedTenantId = suspendedTenant.id;

      suspendedTenantUserEmail = `suspended-user-${timestamp}@example.com`;
      await prisma.user.create({
        data: {
          tenantId: suspendedTenantId,
          email: suspendedTenantUserEmail,
          passwordHash: hashedPassword,
          fullName: 'Suspended Tenant User',
          role: Role.TENANT_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      // Login first to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', suspendedTenantId)
        .send({
          email: suspendedTenantUserEmail,
          password: testPassword,
        });

      const loginData = getResponseData(loginResponse.body);
      suspendedTenantToken = loginData.accessToken as string;

      // Now suspend the tenant
      await prisma.tenant.update({
        where: { id: suspendedTenantId },
        data: { status: TenantStatus.SUSPENDED },
      });
    });

    afterAll(async () => {
      try {
        await prisma.user.deleteMany({ where: { tenantId: suspendedTenantId } });
        await prisma.tenantSettings.deleteMany({ where: { tenantId: suspendedTenantId } });
        await prisma.tenant.delete({ where: { id: suspendedTenantId } });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should NOT allow login to suspended tenant', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Tenant-ID', suspendedTenantId)
        .send({
          email: suspendedTenantUserEmail,
          password: testPassword,
        });

      expect([401, 403]).toContain(response.status);
    });

    it('should NOT allow API access with token from suspended tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Tenant-ID', suspendedTenantId)
        .set('Authorization', `Bearer ${suspendedTenantToken}`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Missing Tenant Header', () => {
    it('should return error for login without X-Tenant-ID header', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: tenantAUserEmail,
        password: testPassword,
      });

      // Missing tenant header results in either 400 (bad request) or 404 (tenant not found)
      expect([400, 404]).toContain(response.status);
    });

    it('should return error for protected routes without X-Tenant-ID header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      // Missing tenant header results in either 400 (bad request) or 404 (route not matched)
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Invalid Tenant Header', () => {
    it('should return error for non-existent tenant ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Tenant-ID', '00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      expect([400, 401, 404]).toContain(response.status);
    });

    it('should return error for invalid tenant ID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Tenant-ID', 'invalid-tenant-id')
        .set('Authorization', `Bearer ${tenantAAccessToken}`);

      // Invalid UUID format may return 400, 401, or 404 depending on validation layer
      expect([400, 401, 404]).toContain(response.status);
    });
  });
});
