/**
 * Contract E2E Tests
 * Session 5.8 - Phase 5 Testing & Integration
 *
 * Tests contract creation, template management, and status updates.
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

describe('Contract E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  let adminToken: string;
  let adminUserId: string;
  let tenancyId: string;
  let contractId: string;
  let templateId: string;

  const adminEmail = `e2e-contract-admin-${Date.now()}@example.com`;
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
        name: 'E2E Contract Test Partner',
        slug: `e2e-contract-${Date.now()}`,
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
        fullName: 'Contract Test Admin',
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
        name: 'Contract Test Owner',
        slug: `contract-test-owner-${Date.now()}`,
        status: 'APPROVED',
      },
    });

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        partnerId: testpartnerId,
        vendorId: vendor.id,
        title: 'Unit 201 - Contract Test',
        slug: `unit-201-contract-test-${Date.now()}`,
        description: 'Property for contract testing',
        verticalType: 'real_estate',
        status: 'PUBLISHED',
        price: 2000,
      },
    });

    // Create customer + tenant
    const customer = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: `e2e-contract-cust-${Date.now()}@example.com`,
        passwordHash: hashedPassword,
        fullName: 'Contract Customer',
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

    // Create tenancy in CONTRACT_PENDING state
    const tenancy = await prisma.tenancy.create({
      data: {
        partnerId: testpartnerId,
        listingId: listing.id,
        ownerId: vendor.id,
        tenantId: tenant.id,
        status: 'CONTRACT_PENDING',
        monthlyRent: 2000,
        securityDeposit: 4000,
        leaseStartDate: new Date('2025-04-01'),
        leaseEndDate: new Date('2026-03-31'),
      },
    });
    tenancyId = tenancy.id;
  }, 30000);

  afterAll(async () => {
    try {
      await prisma.contract.deleteMany({ where: { tenancy: { partnerId: testpartnerId } } });
      await prisma.contractTemplate.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.deposit.deleteMany({ where: { tenancy: { partnerId: testpartnerId } } });
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
  // Template Management
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Contract Templates', () => {
    it('GET /api/v1/contracts/templates/variables â†’ should return standard variables', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contracts/templates/variables')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      // Should return array of variables
      expect(data).toBeDefined();
    });

    it('POST /api/v1/contracts/templates â†’ should create template', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/contracts/templates')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Standard Tenancy Agreement',
          description: 'Default template for all tenancies',
          content:
            'This agreement between {{ownerName}} (IC: {{ownerIc}}) and {{tenantName}} (IC: {{tenantIc}}) for property at {{propertyAddress}}. Monthly rent: RM{{rentAmount}}. Deposit: RM{{depositAmount}}. Period: {{startDate}} to {{endDate}}. Contract: {{contractNumber}} dated {{contractDate}}.',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      const data = getResponseData(res.body);
      expect(data.name).toBe('Standard Tenancy Agreement');
      expect(data.isDefault).toBe(true);
      templateId = data.id as string;
    });

    it('GET /api/v1/contracts/templates â†’ should list templates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contracts/templates')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /api/v1/contracts/templates/:id â†’ should get template by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contracts/templates/${templateId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.id).toBe(templateId);
    });

    it('PATCH /api/v1/contracts/templates/:id â†’ should update template', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/contracts/templates/${templateId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated default template',
        });

      expect(res.status).toBe(200);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Contract CRUD
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Contract CRUD', () => {
    it('POST /api/v1/contracts â†’ should create contract for tenancy', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/contracts')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenancyId,
          templateId,
          startDate: '2025-04-01',
          endDate: '2026-03-31',
          terms: {
            rentAmount: 2000,
            depositAmount: 4000,
          },
        });

      expect(res.status).toBe(201);
      const data = getResponseData(res.body);
      expect(data.tenancyId).toBe(tenancyId);
      expect(data.status).toBe('DRAFT');
      contractId = data.id as string;
    });

    it('GET /api/v1/contracts/:id â†’ should get contract by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contracts/${contractId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.id).toBe(contractId);
    });

    it('GET /api/v1/contracts â†’ should list contracts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contracts')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /api/v1/contracts/tenancy/:tenancyId â†’ should get contract by tenancy', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contracts/tenancy/${tenancyId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('PATCH /api/v1/contracts/:id â†’ should update draft contract', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/contracts/${contractId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          terms: {
            rentAmount: 2000,
            depositAmount: 4000,
            paymentDueDay: 5,
          },
        });

      expect(res.status).toBe(200);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Contract Status Flow
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Contract Status', () => {
    it('PATCH /api/v1/contracts/:id/status â†’ should move to PENDING_SIGNATURE', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/contracts/${contractId}/status`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PENDING_SIGNATURE',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('PENDING_SIGNATURE');
    });

    it('PATCH /api/v1/contracts/:id/status â†’ should move to ACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/contracts/${contractId}/status`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ACTIVE',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('ACTIVE');
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Validation
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('Validation', () => {
    it('should reject creating contract without required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/contracts')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject action without auth', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contracts/${contractId}`)
        .set('X-Partner-ID', testpartnerId);

      expect(res.status).toBe(401);
    });
  });
});
