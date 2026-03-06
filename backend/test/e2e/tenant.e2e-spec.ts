/**
 * Tenant E2E Tests
 * Session 5.8 - Phase 5 Testing & Integration
 *
 * Tests the tenant registration and management flow.
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

describe('Tenant E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  let adminUserId: string;
  let customerUserId: string;
  let adminToken: string;
  let customerToken: string;
  let createdTenantId: string;

  const adminEmail = `e2e-occ-admin-${Date.now()}@example.com`;
  const customerEmail = `e2e-occ-customer-${Date.now()}@example.com`;
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
        name: 'E2E Tenant Test Partner',
        slug: `e2e-occ-${Date.now()}`,
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
        fullName: 'Tenant Test Admin',
        role: Role.PARTNER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminUserId = admin.id;

    // Create customer user (will become tenant)
    const customer = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: customerEmail,
        passwordHash: hashedPassword,
        fullName: 'Jane Customer',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
    customerUserId = customer.id;

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Partner-ID', testpartnerId)
      .send({ email: adminEmail, password });
    adminToken = getResponseData(adminLogin.body).accessToken as string;

    // Login as customer
    const customerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Partner-ID', testpartnerId)
      .send({ email: customerEmail, password });
    customerToken = getResponseData(customerLogin.body).accessToken as string;
  }, 30000);

  afterAll(async () => {
    try {
      await prisma.tenant.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.user.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.partnerSettings.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.partner.delete({ where: { id: testpartnerId } });
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Create Tenant
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('POST /api/v1/tenants', () => {
    it('should create an tenant profile (admin)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: customerUserId,
          icNumber: '900101-01-1234',
          employmentType: 'EMPLOYED',
          monthlyIncome: 5000,
          employer: 'ACME Corp',
          emergencyName: 'John Emergency',
          emergencyPhone: '+60123456789',
          emergencyRelation: 'Brother',
        });

      expect(res.status).toBe(201);
      const data = getResponseData(res.body);
      expect(data.userId).toBe(customerUserId);
      expect(data.icNumber).toBe('900101-01-1234');
      createdTenantId = data.id as string;
    });

    it('should reject duplicate tenant for same user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: customerUserId,
        });

      expect(res.status).toBe(409);
    });

    it('should reject without auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .set('X-Partner-ID', testpartnerId)
        .send({
          userId: customerUserId,
        });

      expect(res.status).toBe(401);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Get Tenant
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('GET /api/v1/tenants/:id', () => {
    it('should get tenant by ID (admin)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tenants/${createdTenantId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.id).toBe(createdTenantId);
    });

    it('should return 404 for non-existent tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants/00000000-0000-0000-0000-000000000000')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // List Tenants
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('GET /api/v1/tenants', () => {
    it('should list tenants (admin)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/tenants')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const body = res.body;
      // Should have at least 1 tenant
      if (body.data && Array.isArray(body.data)) {
        expect(body.data.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Update Tenant
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('PATCH /api/v1/tenants/:id', () => {
    it('should update tenant fields (admin)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${createdTenantId}`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          monthlyIncome: 6000,
          employer: 'Upgraded Corp',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(Number(data.monthlyIncome)).toBe(6000);
    });
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Status Update
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  describe('PATCH /api/v1/tenants/:id/status', () => {
    it('should update tenant status to SCREENING then APPROVED (admin)', async () => {
      // Step 1: PENDING â†’ SCREENING
      const screeningRes = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${createdTenantId}/status`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SCREENING',
        });

      expect(screeningRes.status).toBe(200);
      const screeningData = getResponseData(screeningRes.body);
      expect(screeningData.status).toBe('SCREENING');

      // Step 2: SCREENING â†’ APPROVED
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tenants/${createdTenantId}/status`)
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APPROVED',
        });

      expect(res.status).toBe(200);
      const data = getResponseData(res.body);
      expect(data.status).toBe('APPROVED');
    });
  });
});
