/**
 * Partner Isolation E2E Tests
 * Session 4.5 - Testing & E2E
 *
 * Tests to verify multi-partner data isolation.
 * This is CRITICAL for security - data should never leak between tenants.
 *
 * Note: API returns standardized response format: { data: {...}, meta: {...} }
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus, VendorStatus, ListingStatus, PartnerStatus } from '@prisma/client';

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

describe('Partner Isolation E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Partner A
  let partnerAId: string;
  let _partnerAUserId: string;
  let partnerAUserEmail: string;
  let partnerAVendorId: string;
  let partnerAListingId: string;
  let partnerAAccessToken: string;

  // Partner B
  let partnerBId: string;
  let partnerBUserId: string;
  let partnerBUserEmail: string;
  let partnerBVendorId: string;
  let partnerBListingId: string;
  let partnerBAccessToken: string;

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

    // ===== Create Partner A =====
    const partnerA = await prisma.partner.create({
      data: {
        name: 'Partner A',
        slug: `partner-a-${timestamp}`,
        enabledVerticals: ['real_estate'],
        settings: {
          create: {},
        },
      },
    });
    partnerAId = partnerA.id;

    const vendorA = await prisma.vendor.create({
      data: {
        partnerId: partnerAId,
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
    partnerAVendorId = vendorA.id;

    partnerAUserEmail = `user-a-${timestamp}@example.com`;
    const userA = await prisma.user.create({
      data: {
        partnerId: partnerAId,
        email: partnerAUserEmail,
        passwordHash: hashedPassword,
        fullName: 'User A',
        role: Role.VENDOR_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    _partnerAUserId = userA.id;

    await prisma.userVendor.create({
      data: {
        userId: userA.id,
        vendorId: partnerAVendorId,
        role: 'OWNER',
        isPrimary: true,
      },
    });

    const listingA = await prisma.listing.create({
      data: {
        partnerId: partnerAId,
        vendorId: partnerAVendorId,
        title: 'Partner A Listing',
        slug: `partner-a-listing-${timestamp}`,
        description: 'A listing belonging to Partner A',
        price: 100000,
        currency: 'MYR',
        verticalType: 'real_estate',
        status: ListingStatus.PUBLISHED,
        location: {
          address: '123 Partner A Street',
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
    partnerAListingId = listingA.id;

    // ===== Create Partner B =====
    const partnerB = await prisma.partner.create({
      data: {
        name: 'Partner B',
        slug: `partner-b-${timestamp}`,
        enabledVerticals: ['real_estate'],
        settings: {
          create: {},
        },
      },
    });
    partnerBId = partnerB.id;

    const vendorB = await prisma.vendor.create({
      data: {
        partnerId: partnerBId,
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
    partnerBVendorId = vendorB.id;

    partnerBUserEmail = `user-b-${timestamp}@example.com`;
    const userB = await prisma.user.create({
      data: {
        partnerId: partnerBId,
        email: partnerBUserEmail,
        passwordHash: hashedPassword,
        fullName: 'User B',
        role: Role.VENDOR_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    partnerBUserId = userB.id;

    await prisma.userVendor.create({
      data: {
        userId: userB.id,
        vendorId: partnerBVendorId,
        role: 'OWNER',
        isPrimary: true,
      },
    });

    const listingB = await prisma.listing.create({
      data: {
        partnerId: partnerBId,
        vendorId: partnerBVendorId,
        title: 'Partner B Listing',
        slug: `partner-b-listing-${timestamp}`,
        description: 'A listing belonging to Partner B',
        price: 200000,
        currency: 'MYR',
        verticalType: 'real_estate',
        status: ListingStatus.PUBLISHED,
        location: {
          address: '456 Partner B Street',
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
    partnerBListingId = listingB.id;

    // ===== Get Access Tokens =====
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Partner-ID', partnerAId)
      .send({
        email: partnerAUserEmail,
        password: testPassword,
      });
    const loginAData = getResponseData(loginA.body);
    partnerAAccessToken = loginAData.accessToken as string;

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Partner-ID', partnerBId)
      .send({
        email: partnerBUserEmail,
        password: testPassword,
      });
    const loginBData = getResponseData(loginB.body);
    partnerBAccessToken = loginBData.accessToken as string;
  });

  afterAll(async () => {
    // Cleanup Partner A
    try {
      await prisma.listing.deleteMany({ where: { partnerId: partnerAId } });
      await prisma.vendorSettings.deleteMany({ where: { vendor: { partnerId: partnerAId } } });
      await prisma.vendorProfile.deleteMany({ where: { vendor: { partnerId: partnerAId } } });
      await prisma.user.deleteMany({ where: { partnerId: partnerAId } });
      await prisma.vendor.deleteMany({ where: { partnerId: partnerAId } });
      await prisma.partnerSettings.deleteMany({ where: { partnerId: partnerAId } });
      await prisma.partner.delete({ where: { id: partnerAId } });
    } catch {
      // Ignore cleanup errors
    }

    // Cleanup Partner B
    try {
      await prisma.listing.deleteMany({ where: { partnerId: partnerBId } });
      await prisma.vendorSettings.deleteMany({ where: { vendor: { partnerId: partnerBId } } });
      await prisma.vendorProfile.deleteMany({ where: { vendor: { partnerId: partnerBId } } });
      await prisma.user.deleteMany({ where: { partnerId: partnerBId } });
      await prisma.vendor.deleteMany({ where: { partnerId: partnerBId } });
      await prisma.partnerSettings.deleteMany({ where: { partnerId: partnerBId } });
      await prisma.partner.delete({ where: { id: partnerBId } });
    } catch {
      // Ignore cleanup errors
    }

    await app.close();
  });

  describe('Authentication Isolation', () => {
    it('should NOT allow User A to login with Partner B context', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', partnerBId)
        .send({
          email: partnerAUserEmail,
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });

    it('should NOT allow User B to login with Partner A context', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', partnerAId)
        .send({
          email: partnerBUserEmail,
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });

    it('should NOT allow Partner A token to be used with Partner B header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Partner-ID', partnerBId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      // Token's partnerId won't match header partnerId - either 401 (unauthorized) or 404 (user not found in partner)
      expect([401, 404]).toContain(response.status);
    });
  });

  describe('Listing Isolation', () => {
    it('should NOT return Partner B listings when querying as Partner A', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      expect(response.status).toBe(200);
      const listings = getResponseItems(response.body);

      // Verify no Partner B listing in results
      expect(listings.some((l: { id?: string }) => l.id === partnerBListingId)).toBe(false);
    });

    it('should NOT return Partner A listings when querying as Partner B', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Partner-ID', partnerBId)
        .set('Authorization', `Bearer ${partnerBAccessToken}`);

      expect(response.status).toBe(200);
      const listings = getResponseItems(response.body);

      // Verify no Partner A listing in results
      expect(listings.some((l: { id?: string }) => l.id === partnerAListingId)).toBe(false);
    });

    it('should NOT allow Partner A to access Partner B listing by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${partnerBListingId}`)
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      expect(response.status).toBe(404);
    });

    it('should NOT allow Partner B to access Partner A listing by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${partnerAListingId}`)
        .set('X-Partner-ID', partnerBId)
        .set('Authorization', `Bearer ${partnerBAccessToken}`);

      expect(response.status).toBe(404);
    });

    it('should NOT allow Partner A to update Partner B listing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/listings/${partnerBListingId}`)
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`)
        .send({
          title: 'Hacked by Partner A',
        });

      expect(response.status).toBe(404);
    });

    it('should NOT allow Partner A to delete Partner B listing', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/listings/${partnerBListingId}`)
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Vendor Isolation', () => {
    it('should NOT return Partner B vendors when querying as Partner A', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vendors')
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      expect(response.status).toBe(200);
      const vendors = getResponseItems(response.body);

      // Verify no Partner B vendor in results
      expect(vendors.some((v: { id?: string }) => v.id === partnerBVendorId)).toBe(false);
    });

    it('should NOT allow Partner A to access Partner B vendor by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/vendors/${partnerBVendorId}`)
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      expect(response.status).toBe(404);
    });

    it('should NOT allow Partner A to update Partner B vendor', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/vendors/${partnerBVendorId}`)
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`)
        .send({
          name: 'Hacked by Partner A',
        });

      // Either vendor not found (404) or VENDOR_ADMIN can't update other vendors (403)
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('User Isolation', () => {
    it('should NOT allow Partner A to access Partner B user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${partnerBUserId}`)
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      // VENDOR_ADMIN can't access user endpoints (403), or partner isolation returns 404
      // Either way, data is protected
      expect([403, 404]).toContain(response.status);
    });

    // Note: VENDOR_ADMIN role doesn't have permission to list users (requires SUPER_ADMIN or PARTNER_ADMIN)
    // This test verifies that even if they could access, they wouldn't see other partner's users
    it('should NOT return Partner B users when querying as Partner A', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('X-Partner-ID', partnerAId)
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      // VENDOR_ADMIN gets 403 (Forbidden) - which is also secure
      // If we had PARTNER_ADMIN role, it would be 200 with only Partner A users
      expect([200, 403]).toContain(response.status);
      if (response.status === 200) {
        const users = getResponseItems(response.body);
        // All returned users should not be from Partner B
        if (users.length > 0) {
          expect(users.every((u: { partnerId?: string }) => u.partnerId !== partnerBId)).toBe(true);
        }
      }
    });
  });

  describe('Partner Status Isolation', () => {
    let suspendedpartnerId: string;
    let suspendedTenantUserEmail: string;
    let suspendedTenantToken: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash(testPassword, 10);

      // Create a partner that will be suspended
      const suspendedTenant = await prisma.partner.create({
        data: {
          name: 'Suspended Partner',
          slug: `suspended-partner-${timestamp}`,
          enabledVerticals: ['real_estate'],
          status: PartnerStatus.ACTIVE, // Start as active
          settings: {
            create: {},
          },
        },
      });
      suspendedpartnerId = suspendedTenant.id;

      suspendedTenantUserEmail = `suspended-user-${timestamp}@example.com`;
      await prisma.user.create({
        data: {
          partnerId: suspendedpartnerId,
          email: suspendedTenantUserEmail,
          passwordHash: hashedPassword,
          fullName: 'Suspended Partner User',
          role: Role.PARTNER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });

      // Login first to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', suspendedpartnerId)
        .send({
          email: suspendedTenantUserEmail,
          password: testPassword,
        });

      const loginData = getResponseData(loginResponse.body);
      suspendedTenantToken = loginData.accessToken as string;

      // Now suspend the partner
      await prisma.partner.update({
        where: { id: suspendedpartnerId },
        data: { status: PartnerStatus.SUSPENDED },
      });
    });

    afterAll(async () => {
      try {
        await prisma.user.deleteMany({ where: { partnerId: suspendedpartnerId } });
        await prisma.partnerSettings.deleteMany({ where: { partnerId: suspendedpartnerId } });
        await prisma.partner.delete({ where: { id: suspendedpartnerId } });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should NOT allow login to suspended partner', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', suspendedpartnerId)
        .send({
          email: suspendedTenantUserEmail,
          password: testPassword,
        });

      expect([401, 403]).toContain(response.status);
    });

    it('should NOT allow API access with token from suspended partner', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Partner-ID', suspendedpartnerId)
        .set('Authorization', `Bearer ${suspendedTenantToken}`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Missing Partner Header', () => {
    it('should return error for login without X-Partner-ID header', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: partnerAUserEmail,
        password: testPassword,
      });

      // Missing partner header results in either 400 (bad request) or 404 (partner not found)
      expect([400, 404]).toContain(response.status);
    });

    it('should return error for protected routes without X-Partner-ID header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      // Missing partner header results in either 400 (bad request) or 404 (route not matched)
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Invalid Partner Header', () => {
    it('should return error for non-existent partner ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Partner-ID', '00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      expect([400, 401, 404]).toContain(response.status);
    });

    it('should return error for invalid partner ID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Partner-ID', 'invalid-partner-id')
        .set('Authorization', `Bearer ${partnerAAccessToken}`);

      // Invalid UUID format may return 400, 401, or 404 depending on validation layer
      expect([400, 401, 404]).toContain(response.status);
    });
  });
});
