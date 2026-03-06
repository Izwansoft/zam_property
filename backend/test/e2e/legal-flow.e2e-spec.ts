/**
 * Legal Flow E2E Tests
 * Session 8.6 - Legal Integration & Finalization
 *
 * Tests the complete legal workflow:
 * - Panel lawyer CRUD (create, list, get, update)
 * - Legal case creation
 * - Assign lawyer to case
 * - Generate notice documents
 * - Upload document to case
 * - Status transitions
 * - Case resolution
 * - List case documents
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

describe('Legal Flow E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  let adminToken: string;
  let tenancyId: string;
  let lawyerId: string;
  let legalCaseId: string;

  const adminEmail = `e2e-legal-flow-${Date.now()}@example.com`;
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
        name: 'E2E Legal Flow Partner',
        slug: `e2e-legal-flow-${Date.now()}`,
        enabledVerticals: ['real_estate'],
        settings: { create: {} },
      },
    });
    testpartnerId = partner.id;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Legal Flow Admin',
        role: Role.PARTNER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

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
        name: 'Legal Test Owner',
        slug: `legal-test-owner-${Date.now()}`,
        status: 'APPROVED',
      },
    });

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        partnerId: testpartnerId,
        vendorId: vendor.id,
        title: 'Unit 801 - Legal Test',
        slug: `unit-801-legal-test-${Date.now()}`,
        description: 'Property for legal flow testing',
        verticalType: 'real_estate',
        status: 'PUBLISHED',
        price: 2000,
      },
    });

    // Create customer + tenant
    const customer = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: `e2e-legal-cust-${Date.now()}@example.com`,
        passwordHash: hashedPassword,
        fullName: 'Legal Customer',
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

    // Create tenancy
    const tenancy = await prisma.tenancy.create({
      data: {
        partnerId: testpartnerId,
        listingId: listing.id,
        ownerId: vendor.id,
        tenantId: tenant.id,
        status: 'ACTIVE',
        monthlyRent: 2000,
        securityDeposit: 4000,
        utilityDeposit: 400,
        leaseStartDate: new Date('2025-01-01'),
        leaseEndDate: new Date('2025-12-31'),
      },
    });
    tenancyId = tenancy.id;
  }, 30000);

  afterAll(async () => {
    try {
      // Cleanup in reverse dependency order
      await prisma.legalDocument.deleteMany({
        where: { case: { partnerId: testpartnerId } },
      });
      await prisma.legalCase.deleteMany({
        where: { partnerId: testpartnerId },
      });
      await prisma.panelLawyer.deleteMany({
        where: { partnerId: testpartnerId },
      });
      await prisma.deposit.deleteMany({
        where: { tenancy: { partnerId: testpartnerId } },
      });
      await prisma.contract.deleteMany({
        where: { tenancy: { partnerId: testpartnerId } },
      });
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Panel Lawyer CRUD
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should create a panel lawyer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/panel-lawyers')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ahmad Zulkifli',
        firm: 'Zulkifli & Partners',
        email: `lawyer-${Date.now()}@lawfirm.com`,
        phone: '+60123456789',
        specialization: ['Tenancy Disputes', 'Debt Recovery'],
        notes: 'Experienced in property law',
      });

    expect(res.status).toBe(201);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Ahmad Zulkifli');
    expect(data.firm).toBe('Zulkifli & Partners');
    expect(data.isActive).toBe(true);
    lawyerId = data.id as string;
  });

  it('should list panel lawyers', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/panel-lawyers')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(Array.isArray(data)).toBe(true);
    expect((data as unknown as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it('should get panel lawyer by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/panel-lawyers/${lawyerId}`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.id).toBe(lawyerId);
    expect(data.name).toBe('Ahmad Zulkifli');
  });

  it('should update panel lawyer', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/panel-lawyers/${lawyerId}`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firm: 'Zulkifli, Ahmad & Associates' });

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.firm).toBe('Zulkifli, Ahmad & Associates');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Legal Case Creation
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should create a legal case', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/legal-cases')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tenancyId,
        reason: 'NON_PAYMENT',
        description: 'Partner has not paid rent for 3 months',
        amountOwed: 6000,
        notes: 'Multiple reminders sent without response',
      });

    expect(res.status).toBe(201);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('caseNumber');
    expect(data.status).toBe('NOTICE_SENT');
    expect(data.reason).toBe('NON_PAYMENT');
    expect(data.tenancyId).toBe(tenancyId);
    expect(data.amountOwed).toBe(6000);
    legalCaseId = data.id as string;
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // List & Get Legal Cases
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should list legal cases', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/legal-cases')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
    expect(Number(data.total)).toBeGreaterThanOrEqual(1);
  });

  it('should get legal case by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/legal-cases/${legalCaseId}`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.id).toBe(legalCaseId);
    expect(data.status).toBe('NOTICE_SENT');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Assign Lawyer
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should assign a lawyer to the case', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/assign-lawyer`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lawyerId });

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.lawyerId).toBe(lawyerId);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Generate Notice
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should generate a first reminder notice', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/notice`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'FIRST_REMINDER',
        notes: 'Automated first reminder notice',
      });

    expect(res.status).toBe(201);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('id');
    expect(data.type).toBe('FIRST_REMINDER');
    expect(data).toHaveProperty('fileName');
    expect(data.generatedBy).toBe('system');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Upload Document
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should upload a document to the case', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/documents`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'EVIDENCE',
        title: 'Payment History Export',
        fileName: 'payment-history.pdf',
        fileUrl: '/legal-documents/test/payment-history.pdf',
        notes: 'Complete payment history showing missed payments',
      });

    expect(res.status).toBe(201);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('id');
    expect(data.type).toBe('EVIDENCE');
    expect(data.title).toBe('Payment History Export');
    expect(data.fileName).toBe('payment-history.pdf');
    expect(data.caseId).toBe(legalCaseId);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // List Case Documents
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should list case documents', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/legal-cases/${legalCaseId}/documents`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    // Should have at least 2 docs: generated notice + uploaded evidence
    expect(Array.isArray(data)).toBe(true);
    expect((data as unknown as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Status Transitions
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should transition case to RESPONSE_PENDING', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/status?status=RESPONSE_PENDING`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.status).toBe('RESPONSE_PENDING');
  });

  it('should transition case to MEDIATION', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/status?status=MEDIATION`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.status).toBe('MEDIATION');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Update Case Details
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should update case details', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/legal-cases/${legalCaseId}`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'Mediation scheduled for next week',
        courtDate: '2025-09-15T10:00:00.000Z',
      });

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.notes).toBe('Mediation scheduled for next week');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Resolve Case
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should resolve the case', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/resolve`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolution: 'Settled via mediation - partner agreed to payment plan',
        settlementAmount: 5000,
        notes: 'Final settlement reached',
      });

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.status).toBe('CLOSED');
    expect(data.resolution).toBe('Settled via mediation - partner agreed to payment plan');
    expect(data.settlementAmount).toBe(5000);
    expect(data.resolvedAt).not.toBeNull();
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Cannot upload to closed case
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should reject document upload to a closed case', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/documents`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'OTHER',
        title: 'Late Document',
        fileName: 'late-doc.pdf',
        fileUrl: '/legal-documents/test/late-doc.pdf',
      });

    expect(res.status).toBe(400);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Invalid status transition
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should reject invalid status transition on closed case', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/legal-cases/${legalCaseId}/status?status=NOTICE_SENT`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});
