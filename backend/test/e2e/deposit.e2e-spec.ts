/**
 * Deposit E2E Tests
 * Session 5.8 - Phase 5 Testing & Integration
 *
 * Tests deposit creation, collection, deductions, refund calculation, and refund processing.
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

describe('Deposit E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  let adminToken: string;
  let adminUserId: string;
  let tenancyId: string;
  let securityDepositId: string;
  let utilityDepositId: string;

  const adminEmail = `e2e-deposit-admin-${Date.now()}@example.com`;
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

    // Create partner
    const partner = await prisma.partner.create({
      data: {
        name: 'E2E Deposit Test Partner',
        slug: `e2e-deposit-${Date.now()}`,
        enabledVerticals: ['real_estate'],
        settings: { create: {} },
      },
    });
    testpartnerId = partner.id;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Deposit Test Admin',
        role: Role.PARTNER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminUserId = admin.id;

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Partner-ID', testpartnerId)
      .send({ email: adminEmail, password });
    adminToken = getResponseData(loginRes.body).accessToken as string;

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        partnerId: testpartnerId,
        name: 'Deposit Test Owner',
        slug: `deposit-test-owner-${Date.now()}`,
        status: 'APPROVED',
      },
    });

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        partnerId: testpartnerId,
        vendorId: vendor.id,
        title: 'Unit 301 - Deposit Test',
        slug: `unit-301-deposit-test-${Date.now()}`,
        description: 'Property for deposit testing',
        verticalType: 'real_estate',
        status: 'PUBLISHED',
        price: 1800,
      },
    });

    // Create customer + tenant
    const customer = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: `e2e-deposit-cust-${Date.now()}@example.com`,
        passwordHash: hashedPassword,
        fullName: 'Deposit Customer',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
    const tenant = await prisma.tenant.create({
      data: {
        userId: customer.id,
        partnerId: testpartnerId,
        status: 'APPROVED',
      },
    });

    // Create tenancy in ACTIVE state (deposits need active tenancy)
    const tenancy = await prisma.tenancy.create({
      data: {
        partnerId: testpartnerId,
        listingId: listing.id,
        ownerId: vendor.id,
        tenantId: tenant.id,
        status: 'ACTIVE',
        monthlyRent: 1800,
        securityDeposit: 3600,
        utilityDeposit: 500,
        keyDeposit: 200,
        leaseStartDate: new Date('2025-04-01'),
        leaseEndDate: new Date('2026-03-31'),
      },
    });
    tenancyId = tenancy.id;
  }, 30000);

  afterAll(async () => {
    try {
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Create Deposits
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Create Deposits', () => {
    it('POST /api/v1/deposits â†’ should create SECURITY deposit', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deposits')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenancyId,
          type: 'SECURITY',
          amount: 3600,
        });

      expect(res.status).toBe(201);
      const data = getResponseData(res.body);
      expect(data.type).toBe('SECURITY');
      expect(data.status).toBe('PENDING');
      securityDepositId = data.id as string;
    });

    it('POST /api/v1/deposits â†’ should create UTILITY deposit', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deposits')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenancyId,
          type: 'UTILITY',
          amount: 500,
        });

      expect(res.status).toBe(201);
      const data = getResponseData(res.body);
      expect(data.type).toBe('UTILITY');
      utilityDepositId = data.id as string;
    });

    it('should reject duplicate deposit type', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deposits')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenancyId,
          type: 'SECURITY',
          amount: 3600,
        });

      expect(res.status).toBe(409);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Read Operations
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Read Operations', () => {
    it('GET /api/v1/deposits/:id â†’ should get deposit by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/deposits/${securityDepositId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.id).toBe(securityDepositId);
    });

    it('GET /api/v1/deposits â†’ should list all deposits', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/deposits')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /api/v1/deposits/tenancy/:tenancyId â†’ should get by tenancy', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/deposits/tenancy/${tenancyId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Collect Deposit
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Collect Deposits', () => {
    it('POST /api/v1/deposits/:id/collect â†’ should mark as COLLECTED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${securityDepositId}/collect`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          collectedVia: 'BANK_TRANSFER',
          paymentRef: 'PAY-SEC-001',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('COLLECTED');
    });

    it('should reject collecting already collected deposit', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${securityDepositId}/collect`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          collectedVia: 'CASH',
        });

      expect(res.status).toBe(400);
    });

    it('should collect utility deposit', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${utilityDepositId}/collect`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          collectedVia: 'CASH',
          paymentRef: 'PAY-UTL-001',
        });

      expect(res.status).toBe(200);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Add Deductions
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Add Deductions', () => {
    it('POST /api/v1/deposits/:id/deduction â†’ should add deduction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${securityDepositId}/deduction`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Wall damage in bedroom',
          amount: 500,
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('HELD');
    });

    it('should add another deduction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${securityDepositId}/deduction`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Professional cleaning fee',
          amount: 200,
        });

      expect(res.status).toBe(200);
    });

    it('should reject deduction exceeding deposit amount', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${securityDepositId}/deduction`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Excessive claim',
          amount: 5000,
        });

      expect(res.status).toBe(400);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Calculate Refund
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Calculate Refund', () => {
    it('GET /api/v1/deposits/:id/refund-calculation â†’ should calculate refund', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/deposits/${securityDepositId}/refund-calculation`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.originalAmount).toBe(3600);
      expect(data.totalDeductions).toBe(700); // 500 + 200
      expect(data.refundableAmount).toBe(2900); // 3600 - 700
      // canRefund might be false because tenancy is ACTIVE, not TERMINATED
      expect(data.canRefund).toBe(false);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Refund Processing (requires TERMINATED tenancy)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Refund Processing', () => {
    it('should reject refund when tenancy is not TERMINATED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${securityDepositId}/refund`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          refundRef: 'REF-001',
        });

      expect(res.status).toBe(400);
    });

    it('should process refund after terminating tenancy', async () => {
      // Terminate tenancy directly via Prisma
      await prisma.tenancy.update({
        where: { id: tenancyId },
        data: { status: 'TERMINATED' },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${securityDepositId}/refund`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          refundRef: 'REFUND-SEC-001',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('PARTIALLY_REFUNDED');
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Deposit Summary
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Deposit Summary', () => {
    it('GET /api/v1/deposits/tenancy/:tenancyId/summary â†’ should return summary', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/deposits/tenancy/${tenancyId}/summary`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.tenancyId).toBe(tenancyId);
      expect(data.totalDeposits).toBeDefined();
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Forfeit
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Forfeit', () => {
    it('POST /api/v1/deposits/:id/forfeit â†’ should forfeit utility deposit', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/deposits/${utilityDepositId}/forfeit`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Outstanding utility bills unpaid',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('FORFEITED');
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Validation
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Validation', () => {
    it('should reject creating deposit without required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/deposits')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject without auth', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/deposits/${securityDepositId}`)
        .set('X-Partner-ID', testpartnerId);

      expect(res.status).toBe(401);
    });
  });
});
