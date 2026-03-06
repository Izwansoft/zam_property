/**
 * Tenancy Lifecycle E2E Tests
 * Session 5.8 - Phase 5 Testing & Integration
 *
 * Tests the complete tenancy lifecycle from DRAFT → TERMINATED,
 * including all intermediate state transitions.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';

import { AppModule } from '@/app.module';
import { PrismaService } from '@infrastructure/database';

function getResponseData(body: unknown): Record<string, unknown> {
  if (typeof body === 'object' && body !== null && 'data' in body) {
    return (body as { data: Record<string, unknown> }).data;
  }
  return body as Record<string, unknown>;
}

describe('Tenancy Lifecycle E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  let adminToken: string;
  let adminUserId: string;

  // Pre-created entities
  let vendorId: string;
  let listingId: string;
  let tenantId: string;
  let customerUserId: string;

  // Tenancy ID under test
  let tenancyId: string;

  const adminEmail = `e2e-tenancy-admin-${Date.now()}@example.com`;
  const customerEmail = `e2e-tenancy-cust-${Date.now()}@example.com`;
  const password = 'TestPassword123!';

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
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);

    // Create test partner
    const partner = await prisma.partner.create({
      data: {
        name: 'E2E Tenancy Lifecycle Partner',
        slug: `e2e-tenancy-${Date.now()}`,
        enabledVerticals: ['real_estate'],
        settings: { create: {} },
      },
    });
    testpartnerId = partner.id;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Tenancy Test Admin',
        role: Role.PARTNER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminUserId = admin.id;

    // Create customer user
    const customer = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: customerEmail,
        passwordHash: hashedPassword,
        fullName: 'Tenancy Test Customer',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
    customerUserId = customer.id;

    // Login admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Partner-ID', testpartnerId)
      .send({ email: adminEmail, password });
    adminToken = getResponseData(loginRes.body).accessToken as string;

    // Create vendor (owner) via Prisma
    const vendor = await prisma.vendor.create({
      data: {
        partnerId: testpartnerId,
        name: 'Test Property Owner',
        slug: `test-property-owner-${Date.now()}`,
        status: 'APPROVED',
      },
    });
    vendorId = vendor.id;

    // Create listing via Prisma
    const listing = await prisma.listing.create({
      data: {
        partnerId: testpartnerId,
        vendorId: vendorId,
        title: 'Unit 101 - Test Property',
        slug: `unit-101-test-property-${Date.now()}`,
        description: 'A test property for tenancy lifecycle',
        verticalType: 'real_estate',
        status: 'PUBLISHED',
        price: 1500,
        managementType: 'PARTNER_MANAGED',
      },
    });
    listingId = listing.id;

    // Create tenant profile
    const tenant = await prisma.tenant.create({
      data: {
        userId: customerUserId,
        partnerId: testpartnerId,
        status: 'APPROVED',
        icNumber: '950505-05-5678',
        employmentType: 'EMPLOYED',
        monthlyIncome: 5000,
      },
    });
    tenantId = tenant.id;
  }, 30000);

  afterAll(async () => {
    try {
      // Clean up in FK order
      await prisma.deposit.deleteMany({ where: { tenancy: { partnerId: testpartnerId } } });
      await prisma.contract.deleteMany({ where: { tenancy: { partnerId: testpartnerId } } });
      await prisma.tenancy.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.tenant.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.listing.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.vendor.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.user.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.partnerSettings.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.partner.delete({ where: { id: testpartnerId } });
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // ─────────────────────────────────────────────────────────
  // Step 1: Create Tenancy (DRAFT)
  // ─────────────────────────────────────────────────────────

  describe('Step 1: Create Tenancy', () => {
    it('POST /api/v1/tenancies → should create tenancy in DRAFT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tenancies')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          listingId,
          tenantId,
          monthlyRent: 1500,
          securityDeposit: 3000,
          utilityDeposit: 500,
          keyDeposit: 200,
          leaseStartDate: '2025-04-01',
          leaseEndDate: '2026-03-31',
          moveInDate: '2025-04-01',
        });

      expect(res.status).toBe(201);
      const data = getResponseData(res.body);
      expect(data.status).toBe('DRAFT');
      expect(data.listingId).toBe(listingId);
      expect(data.tenantId).toBe(tenantId);
      tenancyId = data.id as string;
    });

    it('GET /api/v1/tenancies/:id → should retrieve tenancy', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenancies/${tenancyId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.id).toBe(tenancyId);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Step 2: Confirm Booking (DRAFT → BOOKED)
  // ─────────────────────────────────────────────────────────

  describe('Step 2: Confirm Booking', () => {
    it('POST /api/v1/tenancies/:id/confirm-booking → BOOKED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${tenancyId}/confirm-booking`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Partner approved after viewing',
          moveInDate: '2025-04-01',
          leaseStartDate: '2025-04-01',
          leaseEndDate: '2026-03-31',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('BOOKED');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Step 3: Confirm Deposit (BOOKED → DEPOSIT_PAID)
  // ─────────────────────────────────────────────────────────

  describe('Step 3: Confirm Deposit', () => {
    it('POST /api/v1/tenancies/:id/confirm-deposit → DEPOSIT_PAID', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${tenancyId}/confirm-deposit`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentReference: 'PAY-REF-12345',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('DEPOSIT_PAID');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Step 4: Submit Contract (DEPOSIT_PAID → CONTRACT_PENDING)
  // ─────────────────────────────────────────────────────────

  describe('Step 4: Submit Contract', () => {
    it('POST /api/v1/tenancies/:id/submit-contract → CONTRACT_PENDING', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${tenancyId}/submit-contract`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Contract generated and sent for signing',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('CONTRACT_PENDING');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Step 5: Activate (CONTRACT_PENDING → ACTIVE)
  // ─────────────────────────────────────────────────────────

  describe('Step 5: Activate', () => {
    it('POST /api/v1/tenancies/:id/activate → ACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${tenancyId}/activate`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Contract signed, keys handed over',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('ACTIVE');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Step 6: Request Termination (ACTIVE → TERMINATION_REQUESTED)
  // ─────────────────────────────────────────────────────────

  describe('Step 6: Request Termination', () => {
    it('POST /api/v1/tenancies/:id/request-termination → TERMINATION_REQUESTED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${tenancyId}/request-termination`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          requestedMoveOutDate: '2026-03-31',
          terminationReason: 'Lease ending, not renewing',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('TERMINATION_REQUESTED');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Step 7: Terminate (TERMINATION_REQUESTED → TERMINATED)
  // ─────────────────────────────────────────────────────────

  describe('Step 7: Terminate', () => {
    it('POST /api/v1/tenancies/:id/terminate → TERMINATED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${tenancyId}/terminate`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actualMoveOutDate: '2026-03-31',
          inspectionNotes: 'Property in good condition, minor wear',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('TERMINATED');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Step 8: List & History
  // ─────────────────────────────────────────────────────────

  describe('Step 8: List and History', () => {
    it('GET /api/v1/tenancies → should list tenancies', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenancies')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /api/v1/tenancies/:id/history → should return status history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenancies/${tenancyId}/history`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Cancel Flow (separate tenancy)
  // ─────────────────────────────────────────────────────────

  describe('Cancel Flow', () => {
    let cancelTenancyId: string;

    it('should create and cancel a tenancy from DRAFT', async () => {
      // Create another tenancy
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/tenancies')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          listingId,
          tenantId,
          monthlyRent: 1200,
          securityDeposit: 2400,
          leaseStartDate: '2025-05-01',
          leaseEndDate: '2026-04-30',
        });

      expect(createRes.status).toBe(201);
      cancelTenancyId = getResponseData(createRes.body).id as string;

      // Cancel
      const cancelRes = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${cancelTenancyId}/cancel`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Changed mind' });

      expect(cancelRes.status).toBe(200);
      const data = getResponseData(cancelRes.body);
      expect(data.status).toBe('TERMINATED');
    });
  });

  // ─────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────

  describe('Validation', () => {
    it('should reject creating tenancy without required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tenancies')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject invalid transition on TERMINATED tenancy', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tenancies/${tenancyId}/activate`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      // Should get 400 (Bad Request — invalid transition)
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
