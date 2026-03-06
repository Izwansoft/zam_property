/**
 * PayoutService Unit Tests
 * Session 6.6 - Owner Payout Core
 *
 * Tests payout business logic: calculate payout with gross rental,
 * platform fees, line items, overlap prevention, and querying.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PayoutStatus, RentPaymentStatus, TenancyStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PayoutService } from './payout.service';

describe('PayoutService', () => {
  let service: PayoutService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockEventEmitter: any;

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const createMockVendor = (overrides: Partial<any> = {}) => ({
    id: 'vendor-001',
    partnerId: 'partner-001',
    name: 'John Owner',
    email: 'owner@test.com',
    ...overrides,
  });

  const createMockTenancy = (overrides: Partial<any> = {}) => ({
    id: 'tenancy-001',
    partnerId: 'partner-001',
    ownerId: 'vendor-001',
    status: TenancyStatus.ACTIVE,
    monthlyRent: new Decimal(2500),
    listing: { id: 'listing-001', title: 'Unit 101' },
    tenant: {
      id: 'occ-001',
      user: { fullName: 'Jane Tenant' },
    },
    ...overrides,
  });

  const createMockPayment = (overrides: Partial<any> = {}) => ({
    id: 'payment-001',
    partnerId: 'partner-001',
    amount: new Decimal(2500),
    status: RentPaymentStatus.COMPLETED,
    paymentDate: new Date('2026-03-15'),
    paymentNumber: 'PAY-001',
    billing: {
      id: 'bill-001',
      tenancyId: 'tenancy-001',
      billNumber: 'BILL-202603-0001',
      billingPeriod: new Date('2026-03-01'),
    },
    ...overrides,
  });

  const createMockPayout = (overrides: Partial<any> = {}) => ({
    id: 'payout-001',
    partnerId: 'partner-001',
    ownerId: 'vendor-001',
    payoutNumber: 'PAY-OUT-202603-0001',
    periodStart: new Date('2026-03-01'),
    periodEnd: new Date('2026-03-31'),
    status: PayoutStatus.CALCULATED,
    grossRental: new Decimal(5000),
    platformFee: new Decimal(500),
    maintenanceCost: new Decimal(0),
    otherDeductions: new Decimal(0),
    netPayout: new Decimal(4500),
    bankName: null,
    bankAccount: null,
    bankAccountName: null,
    approvedBy: null,
    approvedAt: null,
    processedAt: null,
    bankReference: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: { name: 'John Owner' },
    lineItems: [
      {
        id: 'li-001',
        tenancyId: 'tenancy-001',
        billingId: 'bill-001',
        type: 'RENTAL',
        description: 'Rent payment — BILL-202603-0001 (PAY-001)',
        amount: new Decimal(2500),
        createdAt: new Date(),
      },
      {
        id: 'li-002',
        tenancyId: 'tenancy-002',
        billingId: 'bill-002',
        type: 'RENTAL',
        description: 'Rent payment — BILL-202603-0002 (PAY-002)',
        amount: new Decimal(2500),
        createdAt: new Date(),
      },
      {
        id: 'li-003',
        tenancyId: 'tenancy-001',
        billingId: null,
        type: 'PLATFORM_FEE',
        description: 'Platform fee (10%)',
        amount: new Decimal(-250),
        createdAt: new Date(),
      },
      {
        id: 'li-004',
        tenancyId: 'tenancy-002',
        billingId: null,
        type: 'PLATFORM_FEE',
        description: 'Platform fee (10%)',
        amount: new Decimal(-250),
        createdAt: new Date(),
      },
    ],
    ...overrides,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Setup
  // ─────────────────────────────────────────────────────────────────────────

  beforeEach(() => {
    mockPrisma = {
      vendor: {
        findFirst: jest.fn(),
      },
      ownerPayout: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      tenancy: {
        findMany: jest.fn(),
      },
      rentPayment: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(mockPrisma)),
    };

    mockPartnerContext = {
      partnerId: 'partner-001',
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new PayoutService(mockPrisma, mockPartnerContext, mockEventEmitter);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // calculatePayout
  // ─────────────────────────────────────────────────────────────────────────

  describe('calculatePayout', () => {
    it('should calculate payout correctly for single tenancy', async () => {
      const vendor = createMockVendor();
      const tenancy = createMockTenancy();
      const payment = createMockPayment();

      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null); // no overlap
      mockPrisma.tenancy.findMany.mockResolvedValue([tenancy]);
      mockPrisma.rentPayment.findMany.mockResolvedValue([payment]);
      mockPrisma.ownerPayout.count.mockResolvedValue(0); // first payout
      mockPrisma.ownerPayout.create.mockImplementation(({ data }: any) => ({
        id: 'payout-new',
        ...data,
        lineItems: data.lineItems?.create || [],
      }));

      const result = await service.calculatePayout(
        'vendor-001',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
        10,
      );

      expect(result.ownerId).toBe('vendor-001');
      expect(result.ownerName).toBe('John Owner');
      expect(result.grossRental).toBe(2500);
      expect(result.platformFee).toBe(250);
      expect(result.netPayout).toBe(2250);
      expect(result.lineItemCount).toBe(2); // 1 rental + 1 fee
      expect(result.tenancyCount).toBe(1);

      // Verify payout.calculated event was emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payout.calculated',
        expect.objectContaining({
          payoutId: 'payout-new',
          ownerId: 'vendor-001',
          grossRental: 2500,
          platformFee: 250,
          netPayout: 2250,
        }),
      );
    });

    it('should calculate payout for multiple tenancies', async () => {
      const vendor = createMockVendor();
      const tenancy1 = createMockTenancy({ id: 'tenancy-001' });
      const tenancy2 = createMockTenancy({ id: 'tenancy-002' });
      const payment1 = createMockPayment({
        id: 'payment-001',
        amount: new Decimal(2500),
        billing: {
          id: 'bill-001',
          tenancyId: 'tenancy-001',
          billNumber: 'BILL-202603-0001',
          billingPeriod: new Date('2026-03-01'),
        },
      });
      const payment2 = createMockPayment({
        id: 'payment-002',
        amount: new Decimal(3000),
        paymentNumber: 'PAY-002',
        billing: {
          id: 'bill-002',
          tenancyId: 'tenancy-002',
          billNumber: 'BILL-202603-0002',
          billingPeriod: new Date('2026-03-01'),
        },
      });

      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);
      mockPrisma.tenancy.findMany.mockResolvedValue([tenancy1, tenancy2]);
      mockPrisma.rentPayment.findMany.mockResolvedValue([payment1, payment2]);
      mockPrisma.ownerPayout.count.mockResolvedValue(0);
      mockPrisma.ownerPayout.create.mockImplementation(({ data }: any) => ({
        id: 'payout-new',
        ...data,
        lineItems: data.lineItems?.create || [],
      }));

      const result = await service.calculatePayout(
        'vendor-001',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
        10,
      );

      expect(result.grossRental).toBe(5500);
      expect(result.platformFee).toBe(550);
      expect(result.netPayout).toBe(4950);
      expect(result.tenancyCount).toBe(2);
      // 2 rental + 2 fee line items = 4
      expect(result.lineItemCount).toBe(4);
    });

    it('should throw NotFoundException when owner not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.calculatePayout(
          'nonexistent-vendor',
          new Date('2026-03-01'),
          new Date('2026-03-31'),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when periodStart >= periodEnd', async () => {
      const vendor = createMockVendor();
      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);

      await expect(
        service.calculatePayout(
          'vendor-001',
          new Date('2026-03-31'),
          new Date('2026-03-01'),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when overlapping payout exists', async () => {
      const vendor = createMockVendor();
      const existingPayout = createMockPayout();

      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(existingPayout);

      await expect(
        service.calculatePayout(
          'vendor-001',
          new Date('2026-03-01'),
          new Date('2026-03-31'),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no tenancies found', async () => {
      const vendor = createMockVendor();

      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);
      mockPrisma.tenancy.findMany.mockResolvedValue([]);

      await expect(
        service.calculatePayout(
          'vendor-001',
          new Date('2026-03-01'),
          new Date('2026-03-31'),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use custom platform fee percentage', async () => {
      const vendor = createMockVendor();
      const tenancy = createMockTenancy();
      const payment = createMockPayment({ amount: new Decimal(1000) });

      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);
      mockPrisma.tenancy.findMany.mockResolvedValue([tenancy]);
      mockPrisma.rentPayment.findMany.mockResolvedValue([payment]);
      mockPrisma.ownerPayout.count.mockResolvedValue(0);
      mockPrisma.ownerPayout.create.mockImplementation(({ data }: any) => ({
        id: 'payout-new',
        ...data,
        lineItems: data.lineItems?.create || [],
      }));

      const result = await service.calculatePayout(
        'vendor-001',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
        15, // 15% fee
      );

      expect(result.grossRental).toBe(1000);
      expect(result.platformFee).toBe(150);
      expect(result.netPayout).toBe(850);
    });

    it('should generate correct payout number', async () => {
      const vendor = createMockVendor();
      const tenancy = createMockTenancy();
      const payment = createMockPayment();

      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);
      mockPrisma.tenancy.findMany.mockResolvedValue([tenancy]);
      mockPrisma.rentPayment.findMany.mockResolvedValue([payment]);
      mockPrisma.ownerPayout.count.mockResolvedValue(3); // 3 existing for the month
      mockPrisma.ownerPayout.create.mockImplementation(({ data }: any) => ({
        id: 'payout-new',
        ...data,
        lineItems: data.lineItems?.create || [],
      }));

      const result = await service.calculatePayout(
        'vendor-001',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );

      // Should be sequence 4 (count=3, so next is 4)
      expect(result.payoutNumber).toMatch(/^PAY-OUT-\d{6}-0004$/);
    });

    it('should handle zero payments gracefully (still creates payout)', async () => {
      const vendor = createMockVendor();
      const tenancy = createMockTenancy();

      mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);
      mockPrisma.tenancy.findMany.mockResolvedValue([tenancy]);
      mockPrisma.rentPayment.findMany.mockResolvedValue([]); // No payments
      mockPrisma.ownerPayout.count.mockResolvedValue(0);
      mockPrisma.ownerPayout.create.mockImplementation(({ data }: any) => ({
        id: 'payout-new',
        ...data,
        lineItems: data.lineItems?.create || [],
      }));

      const result = await service.calculatePayout(
        'vendor-001',
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );

      expect(result.grossRental).toBe(0);
      expect(result.platformFee).toBe(0);
      expect(result.netPayout).toBe(0);
      expect(result.lineItemCount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getPayout
  // ─────────────────────────────────────────────────────────────────────────

  describe('getPayout', () => {
    it('should return payout view with line items', async () => {
      const payout = createMockPayout();
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(payout);

      const result = await service.getPayout('payout-001');

      expect(result.id).toBe('payout-001');
      expect(result.ownerName).toBe('John Owner');
      expect(result.grossRental).toBe(5000);
      expect(result.platformFee).toBe(500);
      expect(result.netPayout).toBe(4500);
      expect(result.lineItems).toHaveLength(4);
      expect(result.lineItems[0].type).toBe('RENTAL');
      expect(result.lineItems[0].amount).toBe(2500);
    });

    it('should throw NotFoundException when payout not found', async () => {
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);

      await expect(service.getPayout('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // listPayouts
  // ─────────────────────────────────────────────────────────────────────────

  describe('listPayouts', () => {
    it('should return paginated list of payouts', async () => {
      const payout = createMockPayout();
      mockPrisma.ownerPayout.findMany.mockResolvedValue([payout]);
      mockPrisma.ownerPayout.count.mockResolvedValue(1);

      const result = await service.listPayouts({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.data[0].id).toBe('payout-001');
    });

    it('should filter by ownerId', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);
      mockPrisma.ownerPayout.count.mockResolvedValue(0);

      await service.listPayouts({ ownerId: 'vendor-001' });

      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: 'vendor-001' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);
      mockPrisma.ownerPayout.count.mockResolvedValue(0);

      await service.listPayouts({ status: PayoutStatus.CALCULATED });

      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: PayoutStatus.CALCULATED }),
        }),
      );
    });

    it('should filter by period dates', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);
      mockPrisma.ownerPayout.count.mockResolvedValue(0);

      const periodStart = new Date('2026-01-01');
      const periodEnd = new Date('2026-12-31');
      await service.listPayouts({ periodStart, periodEnd });

      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            periodStart: { gte: periodStart },
            periodEnd: { lte: periodEnd },
          }),
        }),
      );
    });

    it('should use default pagination', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);
      mockPrisma.ownerPayout.count.mockResolvedValue(0);

      const result = await service.listPayouts({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should handle page 2 correctly', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);
      mockPrisma.ownerPayout.count.mockResolvedValue(25);

      const result = await service.listPayouts({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // approvePayout
  // ─────────────────────────────────────────────────────────────────────────

  describe('approvePayout', () => {
    it('should approve a CALCULATED payout', async () => {
      const payout = createMockPayout({ status: PayoutStatus.CALCULATED });

      mockPrisma.ownerPayout.findFirst.mockResolvedValue(payout);
      mockPrisma.ownerPayout.update.mockResolvedValue({
        ...payout,
        status: PayoutStatus.APPROVED,
        approvedBy: 'admin-001',
        approvedAt: expect.any(Date),
      });

      const result = await service.approvePayout('payout-001', 'admin-001');

      expect(result.payoutId).toBe('payout-001');
      expect(result.status).toBe(PayoutStatus.APPROVED);
      expect(result.approvedBy).toBe('admin-001');
      expect(result.approvedAt).toBeDefined();

      // Verify status transition
      expect(mockPrisma.ownerPayout.update).toHaveBeenCalledWith({
        where: { id: 'payout-001' },
        data: expect.objectContaining({
          status: PayoutStatus.APPROVED,
          approvedBy: 'admin-001',
        }),
      });

      // Verify event emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payout.approved',
        expect.objectContaining({
          payoutId: 'payout-001',
          approvedBy: 'admin-001',
        }),
      );
    });

    it('should throw NotFoundException when payout not found', async () => {
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);

      await expect(
        service.approvePayout('nonexistent', 'admin-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when payout status is not CALCULATED', async () => {
      const payout = createMockPayout({ status: PayoutStatus.APPROVED });
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(payout);

      await expect(
        service.approvePayout('payout-001', 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for COMPLETED payout', async () => {
      const payout = createMockPayout({ status: PayoutStatus.COMPLETED });
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(payout);

      await expect(
        service.approvePayout('payout-001', 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // processBatch
  // ─────────────────────────────────────────────────────────────────────────

  describe('processBatch', () => {
    it('should process all approved payouts successfully', async () => {
      const payout1 = createMockPayout({
        id: 'payout-001',
        payoutNumber: 'PAY-OUT-202603-0001',
        status: PayoutStatus.APPROVED,
      });
      const payout2 = createMockPayout({
        id: 'payout-002',
        payoutNumber: 'PAY-OUT-202603-0002',
        status: PayoutStatus.APPROVED,
      });

      mockPrisma.ownerPayout.findMany.mockResolvedValue([payout1, payout2]);
      mockPrisma.ownerPayout.update.mockResolvedValue({});

      const result = await service.processBatch();

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].status).toBe('COMPLETED');
      expect(result.results[1].status).toBe('COMPLETED');

      // Each payout gets 2 updates: PROCESSING then COMPLETED
      expect(mockPrisma.ownerPayout.update).toHaveBeenCalledTimes(4);

      // Verify payout.completed events emitted for each
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payout.completed',
        expect.objectContaining({ payoutId: 'payout-001' }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payout.completed',
        expect.objectContaining({ payoutId: 'payout-002' }),
      );
    });

    it('should process specific payout IDs', async () => {
      const payout = createMockPayout({
        id: 'payout-001',
        status: PayoutStatus.APPROVED,
      });

      mockPrisma.ownerPayout.findMany.mockResolvedValue([payout]);
      mockPrisma.ownerPayout.update.mockResolvedValue({});

      const result = await service.processBatch(['payout-001']);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);

      // Verify filter used specific IDs
      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['payout-001'] },
          }),
        }),
      );
    });

    it('should throw BadRequestException when no approved payouts found', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);

      await expect(service.processBatch()).rejects.toThrow(BadRequestException);
    });

    it('should handle partial failures', async () => {
      const payout1 = createMockPayout({
        id: 'payout-001',
        payoutNumber: 'PAY-OUT-202603-0001',
        status: PayoutStatus.APPROVED,
      });
      const payout2 = createMockPayout({
        id: 'payout-002',
        payoutNumber: 'PAY-OUT-202603-0002',
        status: PayoutStatus.APPROVED,
      });

      mockPrisma.ownerPayout.findMany.mockResolvedValue([payout1, payout2]);

      // First payout succeeds (2 updates), second payout fails on PROCESSING update
      let updateCall = 0;
      mockPrisma.ownerPayout.update.mockImplementation(() => {
        updateCall++;
        if (updateCall === 3) {
          // 3rd call = payout2's PROCESSING update
          throw new Error('Bank transfer failed');
        }
        return {};
      });

      const result = await service.processBatch();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[0].status).toBe('COMPLETED');
      expect(result.results[1].status).toBe('FAILED');
      expect(result.results[1].error).toBe('Bank transfer failed');

      // Verify payout.failed event emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payout.failed',
        expect.objectContaining({ payoutId: 'payout-002' }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // generateBankFile
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateBankFile', () => {
    it('should generate a valid CSV bank file', async () => {
      const payout1 = createMockPayout({
        id: 'payout-001',
        payoutNumber: 'PAY-OUT-202603-0001',
        status: PayoutStatus.APPROVED,
        bankName: 'Maybank',
        bankAccount: '1234567890',
        bankAccountName: 'John Owner',
        netPayout: new Decimal(4500),
      });
      const payout2 = createMockPayout({
        id: 'payout-002',
        payoutNumber: 'PAY-OUT-202603-0002',
        status: PayoutStatus.APPROVED,
        bankName: 'CIMB',
        bankAccount: '9876543210',
        bankAccountName: 'Jane Owner',
        netPayout: new Decimal(3200),
        owner: { name: 'Jane Owner' },
      });

      mockPrisma.ownerPayout.findMany.mockResolvedValue([payout1, payout2]);

      const result = await service.generateBankFile();

      expect(result.count).toBe(2);
      expect(result.filename).toMatch(/^payout-bank-file-\d{8}\.csv$/);

      // Validate CSV contents
      const lines = result.csv.split('\n');
      expect(lines[0]).toContain('Payout Number');
      expect(lines[0]).toContain('Beneficiary Name');
      expect(lines[0]).toContain('Amount (MYR)');
      expect(lines[1]).toContain('PAY-OUT-202603-0001');
      expect(lines[1]).toContain('4500.00');
      expect(lines[2]).toContain('PAY-OUT-202603-0002');
      expect(lines[2]).toContain('3200.00');
      // Total row
      expect(lines[4]).toContain('7700.00');
    });

    it('should throw BadRequestException when no payouts found', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);

      await expect(service.generateBankFile()).rejects.toThrow(BadRequestException);
    });

    it('should filter by specific payout IDs', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([
        createMockPayout({
          status: PayoutStatus.APPROVED,
          bankName: 'Maybank',
          bankAccount: '1234567890',
          bankAccountName: 'John Owner',
        }),
      ]);

      await service.generateBankFile(['payout-001']);

      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['payout-001'] },
          }),
        }),
      );
    });

    it('should escape CSV values containing commas', async () => {
      const payout = createMockPayout({
        status: PayoutStatus.APPROVED,
        bankName: 'Bank, Regional',
        bankAccount: '1234567890',
        bankAccountName: 'Owner, Name',
        netPayout: new Decimal(1000),
      });

      mockPrisma.ownerPayout.findMany.mockResolvedValue([payout]);

      const result = await service.generateBankFile();

      // Values with commas should be quoted
      expect(result.csv).toContain('"Bank, Regional"');
      expect(result.csv).toContain('"Owner, Name"');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // generatePayoutStatementPdf
  // ─────────────────────────────────────────────────────────────────────────

  describe('generatePayoutStatementPdf', () => {
    it('should generate a PDF buffer and filename', async () => {
      const payout = createMockPayout({
        bankName: 'Maybank',
        bankAccount: '1234567890',
        bankAccountName: 'John Owner',
      });

      mockPrisma.ownerPayout.findFirst.mockResolvedValue(payout);

      const result = await service.generatePayoutStatementPdf('payout-001');

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe('PAY-OUT-202603-0001-statement.pdf');
    });

    it('should throw NotFoundException when payout not found', async () => {
      mockPrisma.ownerPayout.findFirst.mockResolvedValue(null);

      await expect(
        service.generatePayoutStatementPdf('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
