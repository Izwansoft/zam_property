/**
 * BillingProcessor Unit Tests
 * Session 6.2 - Billing Automation
 *
 * Tests automated billing: batch generation, overdue detection,
 * late fee application, and cron-driven scheduling.
 */

import { RentBillingStatus, TenancyStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Job } from 'bullmq';

import { BillingProcessor } from '@infrastructure/queue/processors/billing.processor';

describe('BillingProcessor', () => {
  let processor: BillingProcessor;
  let mockPrisma: any;
  let mockEventEmitter: any;
  let mockQueueService: any;

  // Helper: create mock tenancy
  const createMockTenancy = (overrides: Partial<any> = {}) => ({
    id: 'tenancy-001',
    partnerId: 'partner-001',
    status: TenancyStatus.ACTIVE,
    monthlyRent: new Decimal(2500),
    billingDay: 1,
    paymentDueDay: 7,
    lateFeePercent: new Decimal(10),
    listing: { id: 'listing-001', title: 'Unit 101' },
    owner: { id: 'owner-001', name: 'John Owner', email: 'owner@test.com' },
    tenant: {
      id: 'occ-001',
      user: { id: 'user-001', fullName: 'Jane Tenant', email: 'jane@test.com' },
    },
    ...overrides,
  });

  // Helper: create mock job
  const createMockJob = <T>(data: T): Job<T> =>
    ({ id: 'job-001', name: 'test', data } as Job<T>);

  beforeEach(() => {
    mockPrisma = {
      tenancy: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      rentBilling: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      rentBillingLineItem: {
        create: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(mockPrisma)),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockQueueService = {
      addJob: jest.fn().mockResolvedValue('job-id'),
    };

    processor = new BillingProcessor(
      mockPrisma,
      mockEventEmitter,
      mockQueueService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // process (router)
  // ─────────────────────────────────────────────────────────────────────────

  describe('process', () => {
    it('should route generate-batch job correctly', async () => {
      mockPrisma.tenancy.findMany.mockResolvedValue([]);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-batch' as const,
        billingPeriod: '2026-03-01',
        billingDay: 1,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
    });

    it('should route generate-single job correctly', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-single' as const,
        tenancyId: 'tenancy-001',
        billingPeriod: '2026-03-01',
        includeLateFee: false,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(false); // tenancy not found
    });

    it('should route detect-overdue job correctly', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.detect-overdue' as const,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
    });

    it('should route apply-late-fees job correctly', async () => {
      mockPrisma.tenancy.findMany.mockResolvedValue([]);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.apply-late-fees' as const,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
    });

    it('should handle unknown job type', async () => {
      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'unknown.type' as any,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown job type');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Batch Bill Generation
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleGenerateBatch', () => {
    it('should find tenancies with matching billing day and queue jobs', async () => {
      const tenancies = [
        createMockTenancy({ id: 'ten-001', lateFeePercent: new Decimal(10) }),
        createMockTenancy({ id: 'ten-002', lateFeePercent: null }),
      ];

      mockPrisma.tenancy.findMany.mockResolvedValue(tenancies);
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null); // No existing bills

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-batch' as const,
        billingPeriod: '2026-03-01',
        billingDay: 1,
        batchSize: 100,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(mockQueueService.addJob).toHaveBeenCalledTimes(2);

      // First tenancy — includeLateFee should be true
      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        'billing.process',
        'rent-billing.generate-single',
        expect.objectContaining({
          tenancyId: 'ten-001',
          includeLateFee: true,
        }),
      );

      // Second tenancy — includeLateFee should be false (no lateFeePercent)
      expect(mockQueueService.addJob).toHaveBeenCalledWith(
        'billing.process',
        'rent-billing.generate-single',
        expect.objectContaining({
          tenancyId: 'ten-002',
          includeLateFee: false,
        }),
      );
    });

    it('should skip tenancies that already have a bill for the period', async () => {
      const tenancies = [
        createMockTenancy({ id: 'ten-001', lateFeePercent: new Decimal(10) }),
      ];

      mockPrisma.tenancy.findMany.mockResolvedValue(tenancies);
      mockPrisma.rentBilling.findFirst.mockResolvedValue({ id: 'existing-bill' }); // Already has bill

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-batch' as const,
        billingPeriod: '2026-03-01',
        billingDay: 1,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(mockQueueService.addJob).not.toHaveBeenCalled();
    });

    it('should return success with zero count when no tenancies found', async () => {
      mockPrisma.tenancy.findMany.mockResolvedValue([]);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-batch' as const,
        billingPeriod: '2026-03-01',
        billingDay: 1,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(result.message).toContain('No tenancies eligible');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Single Bill Generation
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleGenerateSingle', () => {
    it('should generate a bill for a valid tenancy', async () => {
      const tenancy = createMockTenancy();
      const createdBill = {
        id: 'bill-001',
        tenancyId: 'tenancy-001',
        billNumber: 'BILL-202603-0001',
        billingPeriod: new Date('2026-03-01'),
        status: RentBillingStatus.GENERATED,
        rentAmount: new Decimal(2500),
        lateFee: new Decimal(0),
        adjustments: new Decimal(0),
        totalAmount: new Decimal(2500),
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
        issueDate: new Date(),
        dueDate: new Date('2026-03-08'),
        lineItems: [
          { description: 'Monthly rent for March 2026', type: 'RENT', amount: new Decimal(2500) },
        ],
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null); // No duplicate
      mockPrisma.rentBilling.count.mockResolvedValue(0);
      mockPrisma.rentBilling.create.mockResolvedValue(createdBill);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-single' as const,
        tenancyId: 'tenancy-001',
        billingPeriod: '2026-03-01',
        includeLateFee: false,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(result.message).toContain('generated successfully');
      expect(mockPrisma.rentBilling.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenancyId: 'tenancy-001',
            status: RentBillingStatus.GENERATED,
            rentAmount: 2500,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.generated',
        expect.objectContaining({
          billingId: 'bill-001',
          tenancyId: 'tenancy-001',
          tenantEmail: 'jane@test.com',
        }),
      );
    });

    it('should return failure when tenancy not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-single' as const,
        tenancyId: 'tenancy-999',
        billingPeriod: '2026-03-01',
        includeLateFee: false,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should skip if bill already exists', async () => {
      const tenancy = createMockTenancy();
      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findFirst.mockResolvedValue({
        id: 'existing-bill',
        billNumber: 'BILL-202603-0001',
      });

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-single' as const,
        tenancyId: 'tenancy-001',
        billingPeriod: '2026-03-01',
        includeLateFee: false,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(result.message).toContain('already exists');
      expect(mockPrisma.rentBilling.create).not.toHaveBeenCalled();
    });

    it('should include late fee when configured', async () => {
      const tenancy = createMockTenancy({ lateFeePercent: new Decimal(10) });
      const createdBill = {
        id: 'bill-001',
        tenancyId: 'tenancy-001',
        billNumber: 'BILL-202603-0001',
        billingPeriod: new Date('2026-03-01'),
        status: RentBillingStatus.GENERATED,
        rentAmount: new Decimal(2500),
        lateFee: new Decimal(250),
        adjustments: new Decimal(0),
        totalAmount: new Decimal(2750),
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2750),
        issueDate: new Date(),
        dueDate: new Date('2026-03-08'),
        lineItems: [],
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);
      // Overdue bills for late fee calculation
      mockPrisma.rentBilling.findMany.mockResolvedValue([
        { balanceDue: new Decimal(2500) },
      ]);
      mockPrisma.rentBilling.count.mockResolvedValue(0);
      mockPrisma.rentBilling.create.mockResolvedValue(createdBill);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.generate-single' as const,
        tenancyId: 'tenancy-001',
        billingPeriod: '2026-03-01',
        includeLateFee: true,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(mockPrisma.rentBilling.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lateFee: 250,
            totalAmount: 2750,
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Overdue Detection
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleDetectOverdue', () => {
    it('should mark past-due bills as OVERDUE', async () => {
      const overdueBills = [
        {
          id: 'bill-001',
          billNumber: 'BILL-202602-0001',
          tenancyId: 'tenancy-001',
          balanceDue: new Decimal(2500),
          dueDate: new Date('2026-02-08'),
        },
        {
          id: 'bill-002',
          billNumber: 'BILL-202602-0002',
          tenancyId: 'tenancy-002',
          balanceDue: new Decimal(1800),
          dueDate: new Date('2026-02-15'),
        },
      ];

      mockPrisma.rentBilling.findMany.mockResolvedValue(overdueBills);
      mockPrisma.rentBilling.updateMany.mockResolvedValue({ count: 2 });

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.detect-overdue' as const,
        batchSize: 200,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 bills as overdue');
      expect(mockPrisma.rentBilling.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['bill-001', 'bill-002'] } },
        data: { status: RentBillingStatus.OVERDUE },
      });

      // Should emit overdue event for each bill
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.overdue',
        expect.objectContaining({ billingId: 'bill-001' }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.overdue',
        expect.objectContaining({ billingId: 'bill-002' }),
      );

      // Should emit batch event
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.overdue.batch',
        expect.objectContaining({ overdueCount: 2 }),
      );
    });

    it('should handle no overdue bills gracefully', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.detect-overdue' as const,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(result.message).toContain('No overdue bills');
      expect(mockPrisma.rentBilling.updateMany).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Late Fee Application
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleApplyLateFees', () => {
    it('should apply late fees to tenancies with overdue bills', async () => {
      const tenanciesWithOverdue = [
        { id: 'tenancy-001', lateFeePercent: new Decimal(10) },
      ];

      mockPrisma.tenancy.findMany.mockResolvedValue(tenanciesWithOverdue);

      // Overdue bills for late fee calculation
      mockPrisma.rentBilling.findMany.mockResolvedValue([
        { balanceDue: new Decimal(2500) },
      ]);

      // Target bill for late fee
      mockPrisma.rentBilling.findFirst.mockResolvedValue({
        id: 'bill-overdue-001',
      });

      mockPrisma.rentBillingLineItem.create.mockResolvedValue({});
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.apply-late-fees' as const,
        batchSize: 100,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Applied late fees to 1');

      // Should have created a late fee line item
      expect(mockPrisma.rentBillingLineItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            billingId: 'bill-overdue-001',
            type: 'LATE_FEE',
            amount: 250, // 10% of 2500
          }),
        }),
      );

      // Should have updated bill totals
      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bill-overdue-001' },
          data: expect.objectContaining({
            lateFee: { increment: 250 },
            totalAmount: { increment: 250 },
            balanceDue: { increment: 250 },
          }),
        }),
      );
    });

    it('should handle no overdue tenancies gracefully', async () => {
      mockPrisma.tenancy.findMany.mockResolvedValue([]);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.apply-late-fees' as const,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(result.message).toContain('No tenancies');
    });

    it('should skip tenancy when late fee calculates to zero', async () => {
      mockPrisma.tenancy.findMany.mockResolvedValue([
        { id: 'tenancy-001', lateFeePercent: new Decimal(10) },
      ]);

      // No overdue bills → late fee = 0
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const job = createMockJob({
        partnerId: 'partner-001',
        type: 'rent-billing.apply-late-fees' as const,
      });

      const result = await processor.process(job);

      expect(result.success).toBe(true);
      expect(mockPrisma.rentBillingLineItem.create).not.toHaveBeenCalled();
    });
  });
});
