/**
 * ReportService Unit Tests
 * Session 6.8 - Phase 6 Testing & Reports
 *
 * Tests financial reporting logic:
 * - Revenue report (platform fee income)
 * - Collection report (billed vs collected)
 * - Outstanding report (overdue bills with aging)
 *
 * Money calculations use Decimal for precision.
 */

import { RentBillingStatus, RentPaymentStatus, PayoutStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { ReportService } from './report.service';
import { ReportPeriod } from './dto';

describe('ReportService', () => {
  let service: ReportService;
  let mockPrisma: any;
  let mockPartnerContext: any;

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const createMockPayout = (overrides: Partial<any> = {}) => ({
    id: 'payout-001',
    partnerId: 'partner-001',
    ownerId: 'vendor-001',
    payoutNumber: 'PAY-OUT-202603-0001',
    periodStart: new Date('2026-03-01'),
    periodEnd: new Date('2026-03-31'),
    status: PayoutStatus.COMPLETED,
    grossRental: new Decimal(5000),
    platformFee: new Decimal(500),
    maintenanceCost: new Decimal(0),
    otherDeductions: new Decimal(0),
    netPayout: new Decimal(4500),
    owner: { id: 'vendor-001', name: 'John Owner' },
    ...overrides,
  });

  const createMockBilling = (overrides: Partial<any> = {}) => ({
    id: 'bill-001',
    tenancyId: 'tenancy-001',
    billNumber: 'BILL-202603-0001',
    billingPeriod: new Date('2026-03-01'),
    status: RentBillingStatus.PAID,
    rentAmount: new Decimal(2500),
    lateFee: new Decimal(0),
    adjustments: new Decimal(0),
    totalAmount: new Decimal(2500),
    paidAmount: new Decimal(2500),
    balanceDue: new Decimal(0),
    issueDate: new Date('2026-03-01'),
    dueDate: new Date('2026-03-07'),
    paidDate: new Date('2026-03-05'),
    tenancy: {
      partnerId: 'partner-001',
      listing: { title: 'Unit 101' },
      owner: { name: 'John Owner' },
      tenant: { user: { fullName: 'Jane Tenant' } },
    },
    ...overrides,
  });

  const createMockPayment = (overrides: Partial<any> = {}) => ({
    id: 'payment-001',
    partnerId: 'partner-001',
    billingId: 'bill-001',
    paymentNumber: 'PAY-001',
    amount: new Decimal(2500),
    status: RentPaymentStatus.COMPLETED,
    method: 'ONLINE_BANKING',
    paymentDate: new Date('2026-03-05'),
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      ownerPayout: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      rentBilling: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      rentPayment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockPartnerContext = {
      partnerId: 'partner-001',
    };

    service = new ReportService(mockPrisma, mockPartnerContext);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Revenue Report
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getRevenueReport', () => {
    it('should return empty report when no payouts exist', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);

      const result = await service.getRevenueReport({});

      expect(result.summary.totalGrossRental).toBe(0);
      expect(result.summary.totalPlatformFee).toBe(0);
      expect(result.summary.totalNetPayout).toBe(0);
      expect(result.summary.totalPayouts).toBe(0);
      expect(result.byPeriod).toHaveLength(0);
      expect(result.byOwner).toHaveLength(0);
    });

    it('should aggregate revenue from completed payouts', async () => {
      const payouts = [
        createMockPayout({
          grossRental: new Decimal(5000),
          platformFee: new Decimal(500),
          netPayout: new Decimal(4500),
        }),
        createMockPayout({
          id: 'payout-002',
          grossRental: new Decimal(3000),
          platformFee: new Decimal(300),
          netPayout: new Decimal(2700),
        }),
      ];
      mockPrisma.ownerPayout.findMany.mockResolvedValue(payouts);

      const result = await service.getRevenueReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      });

      expect(result.summary.totalGrossRental).toBe(8000);
      expect(result.summary.totalPlatformFee).toBe(800);
      expect(result.summary.totalNetPayout).toBe(7200);
      expect(result.summary.totalPayouts).toBe(2);
    });

    it('should group revenue by monthly period', async () => {
      const payouts = [
        createMockPayout({
          periodStart: new Date('2026-03-01'),
          grossRental: new Decimal(5000),
          platformFee: new Decimal(500),
          netPayout: new Decimal(4500),
        }),
        createMockPayout({
          id: 'payout-002',
          periodStart: new Date('2026-04-01'),
          grossRental: new Decimal(3000),
          platformFee: new Decimal(300),
          netPayout: new Decimal(2700),
        }),
      ];
      mockPrisma.ownerPayout.findMany.mockResolvedValue(payouts);

      const result = await service.getRevenueReport({
        period: ReportPeriod.MONTHLY,
      });

      expect(result.byPeriod).toHaveLength(2);
      expect(result.byPeriod[0].period).toBe('2026-03');
      expect(result.byPeriod[0].platformFee).toBe(500);
      expect(result.byPeriod[1].period).toBe('2026-04');
      expect(result.byPeriod[1].platformFee).toBe(300);
    });

    it('should group revenue by owner', async () => {
      const payouts = [
        createMockPayout({
          ownerId: 'vendor-001',
          owner: { id: 'vendor-001', name: 'Owner A' },
          platformFee: new Decimal(500),
        }),
        createMockPayout({
          id: 'payout-002',
          ownerId: 'vendor-002',
          owner: { id: 'vendor-002', name: 'Owner B' },
          platformFee: new Decimal(800),
        }),
      ];
      mockPrisma.ownerPayout.findMany.mockResolvedValue(payouts);

      const result = await service.getRevenueReport({});

      expect(result.byOwner).toHaveLength(2);
      // Sorted by platformFee descending
      expect(result.byOwner[0].ownerName).toBe('Owner B');
      expect(result.byOwner[0].platformFee).toBe(800);
      expect(result.byOwner[1].ownerName).toBe('Owner A');
      expect(result.byOwner[1].platformFee).toBe(500);
    });

    it('should filter by ownerId', async () => {
      mockPrisma.ownerPayout.findMany.mockResolvedValue([]);

      await service.getRevenueReport({ ownerId: 'vendor-001' });

      expect(mockPrisma.ownerPayout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: 'vendor-001' }),
        }),
      );
    });

    it('should handle Decimal precision correctly', async () => {
      const payouts = [
        createMockPayout({
          grossRental: new Decimal('2500.50'),
          platformFee: new Decimal('250.05'),
          netPayout: new Decimal('2250.45'),
        }),
        createMockPayout({
          id: 'payout-002',
          grossRental: new Decimal('1999.99'),
          platformFee: new Decimal('200.00'),
          netPayout: new Decimal('1799.99'),
        }),
      ];
      mockPrisma.ownerPayout.findMany.mockResolvedValue(payouts);

      const result = await service.getRevenueReport({});

      expect(result.summary.totalGrossRental).toBe(4500.49);
      expect(result.summary.totalPlatformFee).toBe(450.05);
      expect(result.summary.totalNetPayout).toBe(4050.44);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Collection Report
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getCollectionReport', () => {
    it('should return empty report when no billings exist', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const result = await service.getCollectionReport({});

      expect(result.summary.totalBilled).toBe(0);
      expect(result.summary.totalCollected).toBe(0);
      expect(result.summary.totalOutstanding).toBe(0);
      expect(result.summary.collectionRate).toBe(0);
      expect(result.summary.paymentCount).toBe(0);
    });

    it('should calculate collection rate', async () => {
      const billings = [
        createMockBilling({
          totalAmount: new Decimal(5000),
          paidAmount: new Decimal(5000),
          balanceDue: new Decimal(0),
        }),
        createMockBilling({
          id: 'bill-002',
          totalAmount: new Decimal(3000),
          paidAmount: new Decimal(1500),
          balanceDue: new Decimal(1500),
          status: RentBillingStatus.PARTIALLY_PAID,
        }),
      ];
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentPayment.findMany.mockResolvedValue([
        createMockPayment({ amount: new Decimal(5000) }),
        createMockPayment({ id: 'pay-002', billingId: 'bill-002', amount: new Decimal(1500) }),
      ]);

      const result = await service.getCollectionReport({
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      });

      expect(result.summary.totalBilled).toBe(8000);
      expect(result.summary.totalCollected).toBe(6500);
      expect(result.summary.totalOutstanding).toBe(1500);
      expect(result.summary.collectionRate).toBe(81.25);
      expect(result.summary.paymentCount).toBe(2);
    });

    it('should group collections by period', async () => {
      const billings = [
        createMockBilling({
          billingPeriod: new Date('2026-03-01'),
          totalAmount: new Decimal(2500),
          paidAmount: new Decimal(2500),
          balanceDue: new Decimal(0),
        }),
        createMockBilling({
          id: 'bill-002',
          billingPeriod: new Date('2026-04-01'),
          totalAmount: new Decimal(2500),
          paidAmount: new Decimal(0),
          balanceDue: new Decimal(2500),
          status: RentBillingStatus.SENT,
        }),
      ];
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentPayment.findMany.mockResolvedValue([]);

      const result = await service.getCollectionReport({
        period: ReportPeriod.MONTHLY,
      });

      expect(result.byPeriod).toHaveLength(2);
      expect(result.byPeriod[0].period).toBe('2026-03');
      expect(result.byPeriod[0].billed).toBe(2500);
      expect(result.byPeriod[0].collected).toBe(2500);
      expect(result.byPeriod[1].period).toBe('2026-04');
      expect(result.byPeriod[1].billed).toBe(2500);
      expect(result.byPeriod[1].outstanding).toBe(2500);
    });

    it('should group by payment method', async () => {
      const billings = [
        createMockBilling({ totalAmount: new Decimal(5000), paidAmount: new Decimal(5000) }),
      ];
      const payments = [
        createMockPayment({ method: 'ONLINE_BANKING', amount: new Decimal(3000) }),
        createMockPayment({ id: 'pay-002', method: 'CREDIT_CARD', amount: new Decimal(2000) }),
      ];
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentPayment.findMany.mockResolvedValue(payments);

      const result = await service.getCollectionReport({});

      expect(result.byMethod).toHaveLength(2);
      expect(result.byMethod[0].method).toBe('ONLINE_BANKING');
      expect(result.byMethod[0].amount).toBe(3000);
      expect(result.byMethod[1].method).toBe('CREDIT_CARD');
      expect(result.byMethod[1].amount).toBe(2000);
    });

    it('should filter by tenancyId', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      await service.getCollectionReport({ tenancyId: 'tenancy-001' });

      expect(mockPrisma.rentBilling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenancyId: 'tenancy-001' }),
        }),
      );
    });

    it('should handle 100% collection rate', async () => {
      const billings = [
        createMockBilling({
          totalAmount: new Decimal(10000),
          paidAmount: new Decimal(10000),
          balanceDue: new Decimal(0),
        }),
      ];
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentPayment.findMany.mockResolvedValue([
        createMockPayment({ amount: new Decimal(10000) }),
      ]);

      const result = await service.getCollectionReport({});

      expect(result.summary.collectionRate).toBe(100);
      expect(result.summary.totalOutstanding).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Outstanding Report
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getOutstandingReport', () => {
    it('should return empty report when no outstanding bills', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const result = await service.getOutstandingReport({});

      expect(result.summary.totalOutstanding).toBe(0);
      expect(result.summary.totalOverdue).toBe(0);
      expect(result.summary.billCount).toBe(0);
      expect(result.summary.overdueBillCount).toBe(0);
      expect(result.aging.current).toBe(0);
      expect(result.bills).toHaveLength(0);
    });

    it('should calculate outstanding amounts with aging buckets', async () => {
      const now = new Date('2026-06-15');
      const billings = [
        // Not yet due (current)
        createMockBilling({
          id: 'bill-current',
          status: RentBillingStatus.SENT,
          totalAmount: new Decimal(2500),
          paidAmount: new Decimal(0),
          balanceDue: new Decimal(2500),
          dueDate: new Date('2026-06-20'),
        }),
        // 10 days overdue (1-30 bucket)
        createMockBilling({
          id: 'bill-10days',
          status: RentBillingStatus.OVERDUE,
          totalAmount: new Decimal(2500),
          paidAmount: new Decimal(0),
          balanceDue: new Decimal(2500),
          dueDate: new Date('2026-06-05'),
        }),
        // 45 days overdue (31-60 bucket)
        createMockBilling({
          id: 'bill-45days',
          status: RentBillingStatus.OVERDUE,
          totalAmount: new Decimal(3000),
          paidAmount: new Decimal(500),
          balanceDue: new Decimal(2500),
          dueDate: new Date('2026-05-01'),
        }),
        // 75 days overdue (61-90 bucket)
        createMockBilling({
          id: 'bill-75days',
          status: RentBillingStatus.OVERDUE,
          totalAmount: new Decimal(2500),
          paidAmount: new Decimal(0),
          balanceDue: new Decimal(2500),
          dueDate: new Date('2026-04-01'),
        }),
        // 120 days overdue (90+ bucket)
        createMockBilling({
          id: 'bill-120days',
          status: RentBillingStatus.OVERDUE,
          totalAmount: new Decimal(2500),
          paidAmount: new Decimal(0),
          balanceDue: new Decimal(2500),
          dueDate: new Date('2026-02-15'),
        }),
      ];
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);

      const result = await service.getOutstandingReport({ asOfDate: now });

      expect(result.summary.totalOutstanding).toBe(12500);
      expect(result.summary.billCount).toBe(5);
      expect(result.summary.overdueBillCount).toBe(4); // All except current
      expect(result.aging.current).toBe(2500);
      expect(result.aging.days1to30).toBe(2500);
      expect(result.aging.days31to60).toBe(2500);
      expect(result.aging.days61to90).toBe(2500);
      expect(result.aging.over90days).toBe(2500);
    });

    it('should include bill details with tenant & owner info', async () => {
      const billings = [
        createMockBilling({
          status: RentBillingStatus.OVERDUE,
          totalAmount: new Decimal(2500),
          paidAmount: new Decimal(1000),
          balanceDue: new Decimal(1500),
          dueDate: new Date('2026-05-01'),
          tenancy: {
            id: 'tenancy-001',
            partnerId: 'partner-001',
            listing: { title: 'Unit 101' },
            owner: { name: 'John Owner' },
            tenant: { user: { fullName: 'Jane Tenant' } },
          },
        }),
      ];
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);

      const result = await service.getOutstandingReport({
        asOfDate: new Date('2026-06-15'),
      });

      expect(result.bills).toHaveLength(1);
      expect(result.bills[0].listingTitle).toBe('Unit 101');
      expect(result.bills[0].ownerName).toBe('John Owner');
      expect(result.bills[0].tenantName).toBe('Jane Tenant');
      expect(result.bills[0].balanceDue).toBe(1500);
      expect(result.bills[0].daysOverdue).toBe(45);
    });

    it('should filter by ownerId', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      await service.getOutstandingReport({ ownerId: 'vendor-001' });

      expect(mockPrisma.rentBilling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenancy: expect.objectContaining({
              ownerId: 'vendor-001',
            }),
          }),
        }),
      );
    });

    it('should filter by tenancyId', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      await service.getOutstandingReport({ tenancyId: 'tenancy-001' });

      expect(mockPrisma.rentBilling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenancyId: 'tenancy-001',
          }),
        }),
      );
    });

    it('should handle partially paid bills correctly', async () => {
      const billings = [
        createMockBilling({
          status: RentBillingStatus.PARTIALLY_PAID,
          totalAmount: new Decimal(5000),
          paidAmount: new Decimal(3500),
          balanceDue: new Decimal(1500),
          dueDate: new Date('2026-06-01'),
        }),
      ];
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);

      const result = await service.getOutstandingReport({
        asOfDate: new Date('2026-06-15'),
      });

      expect(result.summary.totalOutstanding).toBe(1500);
      expect(result.bills[0].totalAmount).toBe(5000);
      expect(result.bills[0].paidAmount).toBe(3500);
      expect(result.bills[0].balanceDue).toBe(1500);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Period Formatting
  // ═══════════════════════════════════════════════════════════════════════════

  describe('period formatting', () => {
    it('should group by quarterly period', async () => {
      const payouts = [
        createMockPayout({
          periodStart: new Date('2026-01-15'),
          platformFee: new Decimal(100),
        }),
        createMockPayout({
          id: 'payout-002',
          periodStart: new Date('2026-04-15'),
          platformFee: new Decimal(200),
        }),
      ];
      mockPrisma.ownerPayout.findMany.mockResolvedValue(payouts);

      const result = await service.getRevenueReport({
        period: ReportPeriod.QUARTERLY,
      });

      expect(result.byPeriod).toHaveLength(2);
      expect(result.byPeriod[0].period).toBe('2026-Q1');
      expect(result.byPeriod[1].period).toBe('2026-Q2');
    });

    it('should group by yearly period', async () => {
      const payouts = [
        createMockPayout({
          periodStart: new Date('2025-06-01'),
          platformFee: new Decimal(100),
        }),
        createMockPayout({
          id: 'payout-002',
          periodStart: new Date('2026-06-01'),
          platformFee: new Decimal(200),
        }),
      ];
      mockPrisma.ownerPayout.findMany.mockResolvedValue(payouts);

      const result = await service.getRevenueReport({
        period: ReportPeriod.YEARLY,
      });

      expect(result.byPeriod).toHaveLength(2);
      expect(result.byPeriod[0].period).toBe('2025');
      expect(result.byPeriod[1].period).toBe('2026');
    });

    it('should group by daily period', async () => {
      const payouts = [
        createMockPayout({
          periodStart: new Date('2026-03-15'),
          platformFee: new Decimal(100),
        }),
      ];
      mockPrisma.ownerPayout.findMany.mockResolvedValue(payouts);

      const result = await service.getRevenueReport({
        period: ReportPeriod.DAILY,
      });

      expect(result.byPeriod).toHaveLength(1);
      expect(result.byPeriod[0].period).toBe('2026-03-15');
    });
  });
});
