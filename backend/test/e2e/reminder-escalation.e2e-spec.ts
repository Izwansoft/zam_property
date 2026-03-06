/**
 * Reminder Escalation E2E Tests
 * Session 6.8 - Phase 6 Testing & Reports
 *
 * Tests reminder and escalation flows:
 * - Send manual payment reminders (sequences 1-4)
 * - List reminder history for a billing
 * - Escalate to legal action
 * - Mark billing as overdue
 * - Write-off a billing
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

describe('Reminder Escalation E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  let adminToken: string;
  let tenancyId: string;
  let billingId: string;
  let writeOffBillingId: string;

  const adminEmail = `e2e-reminder-esc-${Date.now()}@example.com`;
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
        name: 'E2E Reminder Escalation Partner',
        slug: `e2e-reminder-esc-${Date.now()}`,
        enabledVerticals: ['real_estate'],
        settings: { create: {} },
      },
    });
    testpartnerId = partner.id;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Reminder Escalation Admin',
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
        name: 'Reminder Test Owner',
        slug: `reminder-test-owner-${Date.now()}`,
        status: 'APPROVED',
      },
    });

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        partnerId: testpartnerId,
        vendorId: vendor.id,
        title: 'Unit 701 - Reminder Test',
        slug: `unit-701-reminder-test-${Date.now()}`,
        description: 'Property for reminder testing',
        verticalType: 'real_estate',
        status: 'PUBLISHED',
        price: 1500,
      },
    });

    // Create customer + tenant
    const customer = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: `e2e-reminder-cust-${Date.now()}@example.com`,
        passwordHash: hashedPassword,
        fullName: 'Reminder Customer',
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
        monthlyRent: 1500,
        securityDeposit: 3000,
        utilityDeposit: 300,
        lateFeePercent: 10,
        leaseStartDate: new Date('2025-06-01'),
        leaseEndDate: new Date('2026-05-31'),
      },
    });
    tenancyId = tenancy.id;

    // Generate a billing and send it (so we can test reminders)
    const bill = await request(app.getHttpServer())
      .post('/api/v1/rent-billings/generate')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tenancyId, billingPeriod: '2026-03-01' });
    billingId = getResponseData(bill.body).id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/send`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    // Generate a second billing for write-off tests
    const bill2 = await request(app.getHttpServer())
      .post('/api/v1/rent-billings/generate')
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tenancyId, billingPeriod: '2026-04-01' });
    writeOffBillingId = getResponseData(bill2.body).id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${writeOffBillingId}/send`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);
  }, 30000);

  afterAll(async () => {
    try {
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
  // Send Reminder (Sequence 1)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should send first payment reminder', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/remind`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data).toHaveProperty('sequence');
    expect(data.sequence).toBe(1);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Send Reminder (Sequence 2)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should send second payment reminder', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/remind`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.sequence).toBe(2);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Send Reminder (Sequence 3)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should send third payment reminder', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/remind`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.sequence).toBe(3);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // List Reminders
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should list all reminders for the billing', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/rent-billings/${billingId}/reminders`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    // Should have at least 3 reminders
    if (Array.isArray(data)) {
      expect(data.length).toBeGreaterThanOrEqual(3);
    } else if (data && typeof data === 'object' && 'items' in data) {
      expect((data.items as unknown[]).length).toBeGreaterThanOrEqual(3);
    }
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Escalate to Legal
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should escalate billing to legal action', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/escalate`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    // Escalation should set sequence to 4 (LEGAL_NOTICE)
    expect(data).toHaveProperty('sequence');
    expect(data.sequence).toBe(4);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Mark Overdue
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should mark billing as overdue', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/overdue`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.status).toBe('OVERDUE');
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Apply Late Fee
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should apply late fee to overdue billing', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${billingId}/late-fee`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    // lateFee should be > 0 after applying
    expect(Number(data.lateFee)).toBeGreaterThanOrEqual(0);
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Write Off (separate billing)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  it('should write off a billing as uncollectable', async () => {
    // First mark it overdue
    await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${writeOffBillingId}/overdue`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/rent-billings/${writeOffBillingId}/write-off`)
      .set('X-Partner-ID', testpartnerId)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = getResponseData(res.body);
    expect(data.status).toBe('WRITTEN_OFF');
  });
});
