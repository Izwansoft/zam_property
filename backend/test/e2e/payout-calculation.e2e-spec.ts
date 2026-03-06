/**
 * Payout Calculation E2E Tests
 * Session 6.8 - Phase 6 Testing & Reports
 *
 * Tests payout lifecycle:
 * - Calculate a payout for an owner
 * - List and get payout details
 * - Approve a payout
 * - Process batch of approved payouts
 * - Download bank file (CSV)
 * - Download payout statement (PDF)
 * - Verify Decimal precision for financial calculations
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

describe('Payout Calculation E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  let adminToken: string;
  let adminUserId: string;
  let vendorId: string;
  let tenancyId: string;
  let payoutId: string;

  const adminEmail = `e2e-payout-calc-${Date.now()}@example.com`;
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
        name: 'E2E Payout Calculation Partner',
        slug: `e2e-payout-calc-${Date.now()}`,
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
        fullName: 'Payout Test Admin',
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

    // Create vendor (owner)
    const vendor = await prisma.vendor.create({
      data: {
        partnerId: testpartnerId,
        name: 'Payout Test Owner',
        slug: `payout-test-owner-${Date.now()}`,
        status: 'APPROVED',
      },
    });
    vendorId = vendor.id;

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        partnerId: testpartnerId,
        vendorId: vendor.id,
        title: 'Unit 801 - Payout Test',
        slug: `unit-801-payout-test-${Date.now()}`,
        description: 'Property for payout testing',
        verticalType: 'real_estate',
        status: 'PUBLISHED',
        price: 3000,
      },
    });

    // Create customer + tenant
    const customer = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: `e2e-payout-cust-${Date.now()}@example.com`,
        passwordHash: hashedPassword,
        fullName: 'Payout Customer',
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
        monthlyRent: 3000,
        securityDeposit: 6000,
        utilityDeposit: 600,
        leaseStartDate: new Date('2025-04-01'),
        leaseEndDate: new Date('2026-03-31'),
      },
    });
    tenancyId = tenancy.id;

    // Generate & send a billing, pay it â€” prerequisite for payout calculation
    const bill = await request(app.getHttpServer())
      .post('/api/v1/rent-billings/generate')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tenancyId, billingPeriod: '2026-01-01' });
    const billingId = getResponseData(bill.body).id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/send`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    await request(app.getHttpServer())
      .post('/api/v1/rent-payments/manual')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        billingId,
        amount: 3000,
        method: 'BANK_TRANSFER',
        paymentDate: '2026-01-10',
        reference: 'PAY-PAYOUT-001',
      });
  }, 30000);

  afterAll(async () => {
    try {
      await prisma.payoutLineItem.deleteMany({
        where: { payout: { partnerId: testpartnerId } },
      });
      await prisma.ownerPayout.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.rentBillingLineItem.deleteMany({
        where: { billing: { tenancy: { partnerId: testpartnerId } } },
      });
      await prisma.rentBillingReminder.deleteMany({
        where: { billing: { tenancy: { partnerId: testpartnerId } } },
      });
      await prisma.rentPayment.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.rentBilling.deleteMany({
        where: { tenancy: { partnerId: testpartnerId } },
      });
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Calculate Payout
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should calculate a payout for the owner', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payouts/calculate')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ownerId: vendorId,
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      });

    expect(res.status).toBe(201);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('payoutId');
    expect(Number(data.grossRental)).toBe(3000);
    // Platform fee should be deducted (10% default)
    expect(Number(data.platformFee)).toBeGreaterThan(0);
    expect(Number(data.netPayout)).toBeLessThan(3000);
    // Verify net = gross - platformFee - maintenanceCost - otherDeductions
    const net = Number(data.grossRental) - Number(data.platformFee) -
      Number(data.maintenanceCost) - Number(data.otherDeductions);
    expect(Number(data.netPayout)).toBeCloseTo(net, 2);
    payoutId = data.payoutId as string;
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Get Payout Details
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should get payout details with line items', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/payouts/${payoutId}`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.id).toBe(payoutId);
    expect(data).toHaveProperty('lineItems');
    expect((data.lineItems as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // List Payouts
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should list payouts with filters', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/payouts')
      .query({ ownerId: vendorId, status: 'CALCULATED' })
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const listBody = res.body as Record<string, unknown>;
    expect(listBody).toHaveProperty('data');
    expect(Array.isArray(listBody.data)).toBe(true);
    expect((listBody.data as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Approve Payout
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should approve the calculated payout', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/payouts/${payoutId}/approve`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvedBy: adminUserId });

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.status).toBe('APPROVED');
    expect(data).toHaveProperty('approvedAt');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Download Bank File (before processing â€” requires APPROVED status)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should download bank file for payouts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/payouts/bank-file')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    // Bank file is CSV
    expect(res.headers['content-type']).toMatch(/text\/csv|application\/octet-stream/);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Process Batch
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should process approved payouts in batch', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payouts/process-batch')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        payoutIds: [payoutId],
      });

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('processed');
    expect(Number(data.processed)).toBeGreaterThanOrEqual(1);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Download Payout Statement PDF
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should download payout statement as PDF', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/payouts/${payoutId}/statement`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Verify Financial Precision
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should verify Decimal precision on payout amounts', async () => {
    // Verify via direct DB read that amounts use proper Decimal(12,2)
    const payout = await prisma.ownerPayout.findUnique({
      where: { id: payoutId },
    });

    expect(payout).toBeDefined();
    expect(payout!.grossRental.toNumber()).toBe(3000);
    expect(payout!.platformFee.toNumber()).toBeGreaterThan(0);
    expect(payout!.netPayout.toNumber()).toBeLessThan(3000);

    // Net = gross - fee - maintenance - other
    const expectedNet = payout!.grossRental
      .minus(payout!.platformFee)
      .minus(payout!.maintenanceCost)
      .minus(payout!.otherDeductions);
    expect(payout!.netPayout.equals(expectedNet)).toBe(true);
  });
});
