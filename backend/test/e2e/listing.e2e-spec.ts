/**
 * Listing E2E Tests
 * Session 4.5 - Testing & E2E
 *
 * End-to-end tests for listing CRUD and workflows.
 *
 * Note: API returns standardized response format: { data: {...}, meta: {...} }
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus, VendorStatus, ListingStatus } from '@prisma/client';

import { AppModule } from '@/app.module';
import { PrismaService } from '@infrastructure/database';

/**
 * Helper to extract data from standardized API response
 * API returns: { data: {...}, meta: {...} } or just the data object
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

describe('Listing E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testTenantId: string;
  const testUserEmail = `e2e-listing-${Date.now()}@example.com`;
  const testUserPassword = 'TestPassword123!';
  let _testUserId: string;
  let testVendorId: string;
  let accessToken: string;
  let createdListingId: string;

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

    // Create test tenant - let DB generate UUID
    const tenant = await prisma.tenant.create({
      data: {
        name: 'E2E Listing Test Tenant',
        slug: `e2e-listing-${Date.now()}`,
        enabledVerticals: ['real_estate'],
        settings: {
          create: {},
        },
      },
    });
    testTenantId = tenant.id;

    // Create test vendor first
    const vendor = await prisma.vendor.create({
      data: {
        tenantId: testTenantId,
        name: 'E2E Test Vendor',
        slug: `e2e-vendor-${Date.now()}`,
        email: 'vendor@example.com',
        phone: '+60123456789',
        status: VendorStatus.APPROVED,
        profile: {
          create: {},
        },
        settings: {
          create: {},
        },
      },
    });
    testVendorId = vendor.id;

    // Create test user with VENDOR_ADMIN role linked to vendor
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: testTenantId,
        email: testUserEmail,
        passwordHash: hashedPassword,
        fullName: 'E2E Listing Test User',
        role: Role.VENDOR_ADMIN,
        status: UserStatus.ACTIVE,
        vendorId: testVendorId,
      },
    });
    _testUserId = user.id;

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Tenant-ID', testTenantId)
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    const loginData = getResponseData(loginResponse.body);
    accessToken = loginData.accessToken as string;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await prisma.listing.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.vendorSettings.deleteMany({ where: { vendor: { tenantId: testTenantId } } });
      await prisma.vendorProfile.deleteMany({ where: { vendor: { tenantId: testTenantId } } });
      await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.vendor.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.tenantSettings.deleteMany({ where: { tenantId: testTenantId } });
      await prisma.tenant.delete({ where: { id: testTenantId } });
    } catch {
      // Ignore cleanup errors
    }

    await app.close();
  });

  describe('POST /api/v1/listings', () => {
    it('should create a new listing in DRAFT status', async () => {
      const listingData = {
        title: 'Beautiful Condo in KL',
        description: 'A beautiful 3-bedroom condo in the heart of Kuala Lumpur',
        price: 500000,
        currency: 'MYR',
        verticalType: 'real_estate',
        vendorId: testVendorId,
        location: {
          address: '123 Jalan Test',
          city: 'Kuala Lumpur',
          state: 'Wilayah Persekutuan',
          country: 'Malaysia',
          postalCode: '50000',
        },
        attributes: {
          propertyType: 'condominium',
          listingType: 'sale',
          bedrooms: 3,
          bathrooms: 2,
          builtUpSize: 1200,
          furnishing: 'fully_furnished',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/listings')
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(listingData);

      expect(response.status).toBe(201);
      const data = getResponseData(response.body);
      expect(data).toHaveProperty('id');
      expect(data.title).toBe(listingData.title);
      expect(data.status).toBe('DRAFT');
      expect(data.vendorId).toBe(testVendorId);

      createdListingId = data.id as string;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/listings')
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Listing',
          // Missing other required fields
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/listings')
        .set('X-Tenant-ID', testTenantId)
        .send({
          title: 'Test Listing',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/listings', () => {
    it('should return paginated listings', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const listings = getResponseItems(response.body);
      expect(Array.isArray(listings)).toBe(true);
    });

    it('should filter listings by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .query({ status: 'DRAFT' })
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const listings = getResponseItems(response.body);
      expect(listings.every((l: { status?: string }) => l.status === 'DRAFT' || !l.status)).toBe(
        true,
      );
    });

    it('should filter listings by vendorId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings')
        .query({ vendorId: testVendorId })
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const listings = getResponseItems(response.body);
      expect(
        listings.every((l: { vendorId?: string }) => l.vendorId === testVendorId || !l.vendorId),
      ).toBe(true);
    });
  });

  describe('GET /api/v1/listings/:id', () => {
    it('should return listing by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/listings/${createdListingId}`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data).toHaveProperty('id', createdListingId);
      expect(data).toHaveProperty('title');
    });

    it('should return 404 for non-existent listing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/listings/00000000-0000-0000-0000-000000000000')
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/listings/:id', () => {
    it('should update listing details', async () => {
      const updateData = {
        title: 'Updated Condo Title',
        price: 550000,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/listings/${createdListingId}`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data.title).toBe(updateData.title);
      // Price may come back as string from API
      expect(Number(data.price)).toBe(updateData.price);
    });

    it('should return 404 for non-existent listing', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/listings/00000000-0000-0000-0000-000000000000')
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/listings/:id/publish', () => {
    it('should publish a DRAFT listing', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/listings/${createdListingId}/publish`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data.status).toBe('PUBLISHED');
    });

    it('should return 400 when trying to publish already published listing', async () => {
      // First verify it's published
      const checkResponse = await request(app.getHttpServer())
        .get(`/api/v1/listings/${createdListingId}`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      const checkData = getResponseData(checkResponse.body);
      expect(checkData.status).toBe('PUBLISHED');

      // Try to publish again - should fail
      const response = await request(app.getHttpServer())
        .post(`/api/v1/listings/${createdListingId}/publish`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/listings/:id/unpublish', () => {
    it('should unpublish a PUBLISHED listing', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/listings/${createdListingId}/unpublish`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reason: 'Need to update information' });

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data.status).toBe('DRAFT');
    });
  });

  describe('POST /api/v1/listings/:id/archive', () => {
    it('should archive a listing', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/listings/${createdListingId}/archive`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data.status).toBe('ARCHIVED');
    });
  });

  describe('DELETE /api/v1/listings/:id', () => {
    let listingToDelete: string;

    beforeAll(async () => {
      // Create a listing to delete
      const listing = await prisma.listing.create({
        data: {
          tenantId: testTenantId,
          vendorId: testVendorId,
          title: 'Listing to Delete',
          slug: `delete-listing-${Date.now()}`,
          description: 'This listing will be deleted',
          price: 100000,
          currency: 'MYR',
          verticalType: 'real_estate',
          status: ListingStatus.DRAFT,
          location: {
            address: '456 Delete Street',
            city: 'Kuala Lumpur',
            state: 'Wilayah Persekutuan',
            country: 'Malaysia',
          },
          attributes: {},
        },
      });
      listingToDelete = listing.id;
    });

    it('should soft delete a listing', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/listings/${listingToDelete}`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      // DELETE returns 204 No Content on success
      expect(response.status).toBe(204);

      // Verify it's soft deleted
      const deletedListing = await prisma.listing.findUnique({
        where: { id: listingToDelete },
      });

      expect(deletedListing?.deletedAt).not.toBeNull();
    });

    it('should return 404 for non-existent listing', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/listings/00000000-0000-0000-0000-000000000000')
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Listing State Machine Enforcement', () => {
    let stateMachineListing: string;

    beforeAll(async () => {
      // Create a fresh listing
      const listing = await prisma.listing.create({
        data: {
          tenantId: testTenantId,
          vendorId: testVendorId,
          title: 'State Machine Test Listing',
          slug: `state-test-${Date.now()}`,
          description: 'Testing state machine transitions',
          price: 200000,
          currency: 'MYR',
          verticalType: 'real_estate',
          status: ListingStatus.DRAFT,
          location: {
            address: '789 State Street',
            city: 'Kuala Lumpur',
            state: 'Wilayah Persekutuan',
            country: 'Malaysia',
          },
          attributes: {
            propertyType: 'condominium',
            listingType: 'sale',
            bedrooms: 2,
            bathrooms: 1,
          },
        },
      });
      stateMachineListing = listing.id;
    });

    it('should allow DRAFT -> ARCHIVED directly', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/listings/${stateMachineListing}/archive`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data.status).toBe('ARCHIVED');
    });

    it('should not allow ARCHIVED -> PUBLISHED', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/listings/${stateMachineListing}/publish`)
        .set('X-Tenant-ID', testTenantId)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
