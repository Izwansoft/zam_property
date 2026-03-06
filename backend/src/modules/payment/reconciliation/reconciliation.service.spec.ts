/**
 * ReconciliationService Unit Tests
 * Session 6.4 - Payment Reconciliation
 *
 * Tests: matchPaymentToBill, handlePartialPayment, handleOverpayment,
 * handleAdvancePayment, reassignPayment, reconcileBilling, reconcileTenancy,
 * getStatementOfAccount.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RentPaymentStatus, RentBillingStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockEventEmitter: any;

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const createMockBilling = (overrides: Partial<any> = {}) => ({
    id: 'bill-001',
    tenancyId: 'tenancy-001',
    billNumber: 'BILL-202603-0001',
    billingPeriod: new Date('2026-03-01'),
    status: RentBillingStatus.GENERATED,
    rentAmount: new Decimal(2500),
    totalAmount: new Decimal(2500),
    paidAmount: new Decimal(0),
    balanceDue: new Decimal(2500),
    lateFee: new Decimal(0),
    adjustments: new Decimal(0),
    issueDate: new Date('2026-03-01'),
    dueDate: new Date('2026-03-08'),
    paidDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockPayment = (overrides: Partial<any> = {}) => ({
    id: 'pay-001',
    partnerId: 'partner-001',
    billingId: 'bill-001',
    paymentNumber: 'PAY-202603-0001',
    amount: new Decimal(2500),
    status: RentPaymentStatus.COMPLETED,
    method: 'BANK_TRANSFER',
    currency: 'MYR',
    gatewayId: null,
    clientSecret: null,
    gatewayData: null,
    reference: 'TXN-12345',
    receiptNumber: 'RCP-202603-0001',
    receiptUrl: null,
    paymentDate: new Date('2026-03-05'),
    processedAt: new Date('2026-03-05'),
    payerName: 'Jane Tenant',
    payerEmail: 'jane@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockTenancy = (overrides: Partial<any> = {}) => ({
    id: 'tenancy-001',
    partnerId: 'partner-001',
    listingId: 'listing-001',
    leaseStartDate: new Date('2026-01-01'),
    createdAt: new Date('2025-12-15'),
    listing: { id: 'listing-001', title: 'Unit 101' },
    owner: { id: 'owner-001', name: 'John Owner' },
    tenant: {
      id: 'occ-001',
      user: { fullName: 'Jane Tenant', email: 'jane@test.com' },
    },
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      rentPayment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      rentBilling: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      tenancy: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(mockPrisma)),
    };

    mockPartnerContext = {
      partnerId: 'partner-001',
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new ReconciliationService(
      mockPrisma,
      mockPartnerContext,
      mockEventEmitter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // reconcileBilling
  // ─────────────────────────────────────────────────────────────────────────

  describe('reconcileBilling', () => {
    it('should recalculate paidAmount from completed payments', async () => {
      const billing = createMockBilling({
        paidAmount: new Decimal(1000), // incorrect
        balanceDue: new Decimal(1500), // incorrect
        status: RentBillingStatus.PARTIALLY_PAID,
        payments: [
          createMockPayment({ amount: new Decimal(2500) }),
        ],
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.reconcileBilling('bill-001');

      expect(result.changed).toBe(true);
      expect(result.reconciledPaidAmount).toBe(2500);
      expect(result.reconciledBalanceDue).toBe(0);
      expect(result.reconciledStatus).toBe(RentBillingStatus.PAID);
      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmount: 2500,
            balanceDue: 0,
            status: RentBillingStatus.PAID,
          }),
        }),
      );
    });

    it('should report no change when billing is already correct', async () => {
      const billing = createMockBilling({
        paidAmount: new Decimal(2500),
        balanceDue: new Decimal(0),
        status: RentBillingStatus.PAID,
        paidDate: new Date(),
        payments: [
          createMockPayment({ amount: new Decimal(2500) }),
        ],
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      const result = await service.reconcileBilling('bill-001');

      expect(result.changed).toBe(false);
      expect(mockPrisma.rentBilling.update).not.toHaveBeenCalled();
    });

    it('should handle multiple partial payments correctly', async () => {
      const billing = createMockBilling({
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
        payments: [
          createMockPayment({ id: 'p1', amount: new Decimal(1000) }),
          createMockPayment({ id: 'p2', amount: new Decimal(800) }),
        ],
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.reconcileBilling('bill-001');

      expect(result.changed).toBe(true);
      expect(result.reconciledPaidAmount).toBe(1800);
      expect(result.reconciledBalanceDue).toBe(700);
      expect(result.reconciledStatus).toBe(RentBillingStatus.PARTIALLY_PAID);
    });

    it('should throw NotFoundException for non-existent billing', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(
        service.reconcileBilling('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should emit reconciliation event when billing changes', async () => {
      const billing = createMockBilling({
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
        payments: [
          createMockPayment({ amount: new Decimal(2500) }),
        ],
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.reconcileBilling('bill-001');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'reconciliation.billing.reconciled',
        expect.objectContaining({ billingId: 'bill-001' }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // reassignPayment
  // ─────────────────────────────────────────────────────────────────────────

  describe('reassignPayment', () => {
    it('should reassign payment from one billing to another', async () => {
      const payment = createMockPayment();
      const oldBilling = createMockBilling({
        paidAmount: new Decimal(2500),
        balanceDue: new Decimal(0),
        status: RentBillingStatus.PAID,
      });
      const newBilling = createMockBilling({
        id: 'bill-002',
        billNumber: 'BILL-202604-0001',
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(3000),
        totalAmount: new Decimal(3000),
      });

      mockPrisma.rentPayment.findFirst
        .mockResolvedValueOnce(payment) // getPayment
        .mockResolvedValueOnce(payment); // return after update
      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce(oldBilling)
        .mockResolvedValueOnce(newBilling);
      mockPrisma.rentPayment.update.mockResolvedValue({});
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.reassignPayment({
        paymentId: 'pay-001',
        newBillingId: 'bill-002',
        reason: 'Wrong bill',
      });

      // Old billing should have paidAmount reversed
      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bill-001' },
          data: expect.objectContaining({
            paidAmount: 0,
            balanceDue: 2500,
          }),
        }),
      );

      // New billing should have payment applied
      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bill-002' },
          data: expect.objectContaining({
            paidAmount: 2500,
            balanceDue: 500,
            status: RentBillingStatus.PARTIALLY_PAID,
          }),
        }),
      );

      // Payment should be updated
      expect(mockPrisma.rentPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-001' },
          data: { billingId: 'bill-002' },
        }),
      );

      // Event should be emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rent.payment.reassigned',
        expect.objectContaining({
          paymentId: 'pay-001',
          oldBillingId: 'bill-001',
          newBillingId: 'bill-002',
        }),
      );
    });

    it('should throw if payment is not completed', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(
        createMockPayment({ status: RentPaymentStatus.PENDING }),
      );

      await expect(
        service.reassignPayment({
          paymentId: 'pay-001',
          newBillingId: 'bill-002',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if payment already assigned to same billing', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(
        createMockPayment({ billingId: 'bill-001' }),
      );

      await expect(
        service.reassignPayment({
          paymentId: 'pay-001',
          newBillingId: 'bill-001',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if target billing not found', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(
        createMockPayment(),
      );
      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce(createMockBilling()) // old billing
        .mockResolvedValueOnce(null); // new billing not found

      await expect(
        service.reassignPayment({
          paymentId: 'pay-001',
          newBillingId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // handleOverpayment
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleOverpayment', () => {
    it('should return zero excess when billing is not overpaid', async () => {
      const billing = createMockBilling({
        totalAmount: new Decimal(2500),
        paidAmount: new Decimal(2500),
        payments: [
          createMockPayment({ amount: new Decimal(2500) }),
        ],
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      const result = await service.handleOverpayment('bill-001');

      expect(result.excessAmount).toBe(0);
      expect(result.appliedToBillingId).toBeUndefined();
    });

    it('should apply excess to next outstanding billing', async () => {
      const billing = createMockBilling({
        totalAmount: new Decimal(2500),
        payments: [
          createMockPayment({ amount: new Decimal(3000) }),
        ],
      });
      const nextBilling = createMockBilling({
        id: 'bill-002',
        billNumber: 'BILL-202604-0001',
        billingPeriod: new Date('2026-04-01'),
        totalAmount: new Decimal(2500),
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
      });

      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce(billing) // handleOverpayment
        .mockResolvedValueOnce(nextBilling); // find next billing
      mockPrisma.rentBilling.update.mockResolvedValue({});
      // For generatePaymentNumber and generateReceiptNumber
      mockPrisma.rentPayment.findFirst
        .mockResolvedValueOnce(null) // payment number
        .mockResolvedValueOnce(null); // receipt number
      mockPrisma.rentPayment.create.mockResolvedValue({
        id: 'credit-pay-001',
      });

      const result = await service.handleOverpayment('bill-001');

      expect(result.excessAmount).toBe(500);
      expect(result.appliedToBillingId).toBe('bill-002');
      expect(result.creditPaymentId).toBe('credit-pay-001');

      // Source billing capped at totalAmount
      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bill-001' },
          data: expect.objectContaining({
            paidAmount: 2500,
            balanceDue: 0,
            status: RentBillingStatus.PAID,
          }),
        }),
      );
    });

    it('should emit unresolved event when no next billing exists', async () => {
      const billing = createMockBilling({
        totalAmount: new Decimal(2500),
        payments: [
          createMockPayment({ amount: new Decimal(3000) }),
        ],
      });

      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce(billing)
        .mockResolvedValueOnce(null); // no next billing
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.handleOverpayment('bill-001');

      expect(result.excessAmount).toBe(500);
      expect(result.appliedToBillingId).toBeUndefined();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'reconciliation.overpayment.unresolved',
        expect.objectContaining({ excessAmount: 500 }),
      );
    });

    it('should throw NotFoundException for non-existent billing', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(
        service.handleOverpayment('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // handleAdvancePayment
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleAdvancePayment', () => {
    it('should distribute payment across multiple outstanding billings', async () => {
      const tenancy = createMockTenancy();
      const bill1 = createMockBilling({
        id: 'bill-001',
        billNumber: 'BILL-202601-0001',
        totalAmount: new Decimal(2500),
        balanceDue: new Decimal(2500),
        paidAmount: new Decimal(0),
      });
      const bill2 = createMockBilling({
        id: 'bill-002',
        billNumber: 'BILL-202602-0001',
        totalAmount: new Decimal(2500),
        balanceDue: new Decimal(2500),
        paidAmount: new Decimal(0),
      });

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findMany.mockResolvedValue([bill1, bill2]);
      // generatePaymentNumber and generateReceiptNumber
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);
      mockPrisma.rentPayment.create
        .mockResolvedValueOnce({ id: 'p1', paymentNumber: 'PAY-202603-0001' })
        .mockResolvedValueOnce({ id: 'p2', paymentNumber: 'PAY-202603-0002' });
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.handleAdvancePayment({
        tenancyId: 'tenancy-001',
        amount: 5000,
        method: 'BANK_TRANSFER' as any,
        reference: 'REF-001',
      });

      expect(result.distributed).toHaveLength(2);
      expect(result.distributed[0].amount).toBe(2500);
      expect(result.distributed[0].billingFullyPaid).toBe(true);
      expect(result.distributed[1].amount).toBe(2500);
      expect(result.distributed[1].billingFullyPaid).toBe(true);
      expect(result.remainingAmount).toBe(0);
    });

    it('should handle partial coverage when amount is less than total outstanding', async () => {
      const tenancy = createMockTenancy();
      const bill1 = createMockBilling({
        totalAmount: new Decimal(2500),
        balanceDue: new Decimal(2500),
        paidAmount: new Decimal(0),
      });
      const bill2 = createMockBilling({
        id: 'bill-002',
        totalAmount: new Decimal(2500),
        balanceDue: new Decimal(2500),
        paidAmount: new Decimal(0),
      });

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findMany.mockResolvedValue([bill1, bill2]);
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);
      mockPrisma.rentPayment.create
        .mockResolvedValueOnce({ id: 'p1' })
        .mockResolvedValueOnce({ id: 'p2' });
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.handleAdvancePayment({
        tenancyId: 'tenancy-001',
        amount: 3000,
        method: 'BANK_TRANSFER' as any,
      });

      expect(result.distributed).toHaveLength(2);
      expect(result.distributed[0].amount).toBe(2500);
      expect(result.distributed[0].billingFullyPaid).toBe(true);
      expect(result.distributed[1].amount).toBe(500);
      expect(result.distributed[1].billingFullyPaid).toBe(false);
      expect(result.remainingAmount).toBe(0);
    });

    it('should throw if no outstanding billings', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(createMockTenancy());
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      await expect(
        service.handleAdvancePayment({
          tenancyId: 'tenancy-001',
          amount: 1000,
          method: 'CASH' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if tenancy not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.handleAdvancePayment({
          tenancyId: 'nonexistent',
          amount: 1000,
          method: 'CASH' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should report remaining amount when payment exceeds all billings', async () => {
      const tenancy = createMockTenancy();
      const bill1 = createMockBilling({
        totalAmount: new Decimal(2500),
        balanceDue: new Decimal(2500),
        paidAmount: new Decimal(0),
      });

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findMany.mockResolvedValue([bill1]);
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);
      mockPrisma.rentPayment.create.mockResolvedValue({ id: 'p1' });
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.handleAdvancePayment({
        tenancyId: 'tenancy-001',
        amount: 5000,
        method: 'BANK_TRANSFER' as any,
      });

      expect(result.distributed).toHaveLength(1);
      expect(result.distributed[0].amount).toBe(2500);
      expect(result.remainingAmount).toBe(2500);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // matchPaymentToBill
  // ─────────────────────────────────────────────────────────────────────────

  describe('matchPaymentToBill', () => {
    it('should manually match when suggestedBillingId is provided', async () => {
      const payment = createMockPayment({
        billing: {
          tenancyId: 'tenancy-001',
          billNumber: 'BILL-202603-0001',
        },
      });

      // matchPaymentToBill calls
      mockPrisma.rentPayment.findFirst
        .mockResolvedValueOnce(payment) // find payment
        .mockResolvedValueOnce(payment) // reassignPayment: find payment
        .mockResolvedValueOnce(payment); // return after reassign
      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce({
          id: 'bill-002',
          billNumber: 'BILL-202604-0001',
        }) // new billing for return
        .mockResolvedValueOnce(createMockBilling()) // old billing
        .mockResolvedValueOnce(
          createMockBilling({ id: 'bill-002', billNumber: 'BILL-202604-0001' }),
        ); // new billing
      mockPrisma.rentPayment.update.mockResolvedValue({});
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.matchPaymentToBill('pay-001', 'bill-002');

      expect(result.matchedBillingId).toBe('bill-002');
      expect(result.confidence).toBe('MANUAL');
      expect(result.reassigned).toBe(true);
    });

    it('should return current match when already correctly assigned and no suggestion', async () => {
      const payment = createMockPayment({
        billing: {
          tenancyId: 'tenancy-001',
          billNumber: 'BILL-202603-0001',
        },
      });
      mockPrisma.rentPayment.findFirst.mockResolvedValue(payment);
      // No candidates (all bills matched)
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const result = await service.matchPaymentToBill('pay-001');

      expect(result.reassigned).toBe(false);
      expect(result.confidence).toBe('EXACT');
    });

    it('should auto-match by exact amount when possible', async () => {
      const payment = createMockPayment({
        amount: new Decimal(2500),
        billing: {
          tenancyId: 'tenancy-001',
          billNumber: 'BILL-202603-0001',
        },
      });
      const candidateBill = createMockBilling({
        id: 'bill-002',
        billNumber: 'BILL-202604-0001',
        balanceDue: new Decimal(2500),
      });

      mockPrisma.rentPayment.findFirst
        .mockResolvedValueOnce(payment) // main query
        .mockResolvedValueOnce(payment) // reassignPayment
        .mockResolvedValueOnce(payment); // return after update
      mockPrisma.rentBilling.findMany.mockResolvedValue([candidateBill]);
      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce(createMockBilling()) // old billing
        .mockResolvedValueOnce(candidateBill); // new billing
      mockPrisma.rentPayment.update.mockResolvedValue({});
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.matchPaymentToBill('pay-001');

      expect(result.matchedBillingId).toBe('bill-002');
      expect(result.confidence).toBe('AMOUNT_MATCH');
      expect(result.reassigned).toBe(true);
    });

    it('should throw if payment not found', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);

      await expect(
        service.matchPaymentToBill('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if payment is not completed', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(
        createMockPayment({
          status: RentPaymentStatus.PENDING,
          billing: { tenancyId: 'tenancy-001', billNumber: 'B1' },
        }),
      );

      await expect(
        service.matchPaymentToBill('pay-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // reconcileTenancy
  // ─────────────────────────────────────────────────────────────────────────

  describe('reconcileTenancy', () => {
    it('should reconcile all billings for a tenancy', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(createMockTenancy());
      mockPrisma.rentBilling.findMany.mockResolvedValue([
        createMockBilling({
          id: 'bill-001',
          paidAmount: new Decimal(0),
          payments: [
            createMockPayment({ amount: new Decimal(2500) }),
          ],
        }),
        createMockBilling({
          id: 'bill-002',
          billNumber: 'BILL-202604-0001',
          paidAmount: new Decimal(0),
          payments: [],
        }),
      ]);

      // reconcileBilling calls findFirst for each billing
      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce(
          createMockBilling({
            id: 'bill-001',
            payments: [createMockPayment({ amount: new Decimal(2500) })],
          }),
        )
        .mockResolvedValueOnce(
          createMockBilling({
            id: 'bill-002',
            billNumber: 'BILL-202604-0001',
            payments: [],
          }),
        );
      mockPrisma.rentBilling.update.mockResolvedValue({});

      const result = await service.reconcileTenancy('tenancy-001');

      expect(result.billings).toHaveLength(2);
      expect(result.totalChanged).toBeGreaterThanOrEqual(1);
    });

    it('should throw if tenancy not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.reconcileTenancy('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getStatementOfAccount
  // ─────────────────────────────────────────────────────────────────────────

  describe('getStatementOfAccount', () => {
    it('should generate a complete statement of account', async () => {
      const tenancy = createMockTenancy();
      const billings = [
        createMockBilling({
          billingPeriod: new Date('2026-01-01'),
          issueDate: new Date('2026-01-01'),
          totalAmount: new Decimal(2500),
          lateFee: new Decimal(0),
        }),
        createMockBilling({
          id: 'bill-002',
          billNumber: 'BILL-202602-0001',
          billingPeriod: new Date('2026-02-01'),
          issueDate: new Date('2026-02-01'),
          totalAmount: new Decimal(2625),
          lateFee: new Decimal(125),
          status: RentBillingStatus.OVERDUE,
          balanceDue: new Decimal(2625),
        }),
      ];
      const payments = [
        createMockPayment({
          paymentDate: new Date('2026-01-05'),
          amount: new Decimal(2500),
        }),
      ];

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.aggregate.mockResolvedValue({
        _sum: { totalAmount: new Decimal(0) },
      });
      mockPrisma.rentPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(0) },
      });
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentPayment.findMany.mockResolvedValue(payments);

      const result = await service.getStatementOfAccount('tenancy-001', {});

      expect(result.tenancyId).toBe('tenancy-001');
      expect(result.property.title).toBe('Unit 101');
      expect(result.openingBalance).toBe(0);
      // 2 billings + 1 late fee + 1 payment = 4 entries
      expect(result.entries.length).toBeGreaterThanOrEqual(3);
      expect(result.summary.totalBilled).toBe(5125); // 2500 + 2625
      expect(result.summary.totalPaid).toBe(2500);
      expect(result.closingBalance).toBe(2625);
    });

    it('should calculate opening balance from prior period', async () => {
      const tenancy = createMockTenancy();

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.aggregate.mockResolvedValue({
        _sum: { totalAmount: new Decimal(5000) },
      });
      mockPrisma.rentPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(2500) },
      });
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);
      mockPrisma.rentPayment.findMany.mockResolvedValue([]);

      const result = await service.getStatementOfAccount('tenancy-001', {
        fromDate: '2026-03-01',
        toDate: '2026-03-31',
      });

      expect(result.openingBalance).toBe(2500);
      expect(result.closingBalance).toBe(2500);
    });

    it('should throw NotFoundException for non-existent tenancy', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.getStatementOfAccount('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include late fee entries separately', async () => {
      const tenancy = createMockTenancy();
      const billings = [
        createMockBilling({
          issueDate: new Date('2026-01-01'),
          billingPeriod: new Date('2026-01-01'),
          dueDate: new Date('2026-01-08'),
          totalAmount: new Decimal(2625),
          lateFee: new Decimal(125),
        }),
      ];

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.aggregate.mockResolvedValue({
        _sum: { totalAmount: new Decimal(0) },
      });
      mockPrisma.rentPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(0) },
      });
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentPayment.findMany.mockResolvedValue([]);

      const result = await service.getStatementOfAccount('tenancy-001', {});

      const lateFeeEntries = result.entries.filter(
        (e) => e.type === 'LATE_FEE',
      );
      expect(lateFeeEntries).toHaveLength(1);
      expect(lateFeeEntries[0].debit).toBe(125);
    });

    it('should handle credit payments correctly', async () => {
      const tenancy = createMockTenancy();
      const billings = [
        createMockBilling({
          issueDate: new Date('2026-01-01'),
          billingPeriod: new Date('2026-01-01'),
        }),
      ];
      const payments = [
        createMockPayment({
          method: 'CREDIT',
          reference: 'Credit from overpayment on BILL-202512-0001',
          amount: new Decimal(500),
          paymentDate: new Date('2026-01-01'),
        }),
      ];

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.aggregate.mockResolvedValue({
        _sum: { totalAmount: new Decimal(0) },
      });
      mockPrisma.rentPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(0) },
      });
      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentPayment.findMany.mockResolvedValue(payments);

      const result = await service.getStatementOfAccount('tenancy-001', {});

      const creditEntries = result.entries.filter(
        (e) => e.type === 'CREDIT',
      );
      expect(creditEntries).toHaveLength(1);
      expect(creditEntries[0].credit).toBe(500);
      expect(creditEntries[0].description).toContain('Credit');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // handlePartialPayment
  // ─────────────────────────────────────────────────────────────────────────

  describe('handlePartialPayment', () => {
    it('should update billing to PARTIALLY_PAID for partial payment', async () => {
      const billing = createMockBilling({
        totalAmount: new Decimal(2500),
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.handlePartialPayment(mockPrisma, 'bill-001', 1000);

      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmount: 1000,
            balanceDue: 1500,
            status: RentBillingStatus.PARTIALLY_PAID,
          }),
        }),
      );
    });

    it('should update billing to PAID when full amount paid', async () => {
      const billing = createMockBilling({
        totalAmount: new Decimal(2500),
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.handlePartialPayment(mockPrisma, 'bill-001', 2500);

      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RentBillingStatus.PAID,
          }),
        }),
      );
    });

    it('should emit billing.status.changed when status changes', async () => {
      const billing = createMockBilling();
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.handlePartialPayment(mockPrisma, 'bill-001', 1000);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.status.changed',
        expect.objectContaining({
          billingId: 'bill-001',
          newStatus: RentBillingStatus.PARTIALLY_PAID,
        }),
      );
    });
  });
});
