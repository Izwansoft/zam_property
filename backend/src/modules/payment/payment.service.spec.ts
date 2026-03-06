/**
 * RentPaymentService Unit Tests
 * Session 6.3 - Payment Processing
 *
 * Tests payment business logic: create payment intent, record manual payment,
 * handle webhook success/failure, get/list payments, receipt generation, FPX banks.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RentPaymentStatus, RentBillingStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { RentPaymentService } from './payment.service';
import { PaymentMethod } from './dto';

describe('RentPaymentService', () => {
  let service: RentPaymentService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockStripeBilling: any;
  let mockEventEmitter: any;

  // Helper: create a billing-like object
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
    issueDate: new Date('2026-03-01'),
    dueDate: new Date('2026-03-08'),
    paidDate: null,
    tenancy: {
      id: 'tenancy-001',
      listing: { id: 'listing-001', title: 'Unit 101' },
      owner: { id: 'owner-001', name: 'John Owner' },
      tenant: {
        id: 'occ-001',
        user: { fullName: 'Jane Tenant', email: 'jane@test.com' },
      },
    },
    ...overrides,
  });

  // Helper: create a payment-like object
  const createMockPayment = (overrides: Partial<any> = {}) => ({
    id: 'pay-001',
    partnerId: 'partner-001',
    billingId: 'bill-001',
    paymentNumber: 'PAY-202603-0001',
    amount: new Decimal(2500),
    status: RentPaymentStatus.PENDING,
    method: 'CARD',
    currency: 'MYR',
    gatewayId: 'pi_stripe_123',
    clientSecret: 'pi_stripe_123_secret_abc',
    gatewayData: { id: 'pi_stripe_123' },
    reference: null,
    receiptNumber: null,
    receiptUrl: null,
    paymentDate: null,
    processedAt: null,
    payerName: 'Jane Tenant',
    payerEmail: 'jane@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    billing: {
      id: 'bill-001',
      billNumber: 'BILL-202603-0001',
      billingPeriod: new Date('2026-03-01'),
      totalAmount: new Decimal(2500),
      balanceDue: new Decimal(2500),
      status: RentBillingStatus.GENERATED,
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
      },
      rentBilling: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((fn) => fn(mockPrisma)),
    };

    mockPartnerContext = {
      partnerId: 'partner-001',
    };

    mockStripeBilling = {
      createPaymentIntent: jest.fn().mockResolvedValue({
        id: 'pi_stripe_123',
        clientSecret: 'pi_stripe_123_secret_abc',
        status: 'requires_payment_method',
        amount: 250000,
        currency: 'myr',
      }),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new RentPaymentService(
      mockPrisma,
      mockPartnerContext,
      mockStripeBilling,
      mockEventEmitter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // createPaymentIntent
  // ─────────────────────────────────────────────────────────────────────────

  describe('createPaymentIntent', () => {
    it('should create a payment intent for a valid billing', async () => {
      const billing = createMockBilling();
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null); // for number generation
      mockPrisma.rentPayment.create.mockResolvedValue(
        createMockPayment(),
      );

      const result = await service.createPaymentIntent({
        billingId: 'bill-001',
        amount: 2500,
      });

      expect(result).toBeDefined();
      expect(mockStripeBilling.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 2500, currency: 'MYR' }),
      );
      expect(mockPrisma.rentPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partnerId: 'partner-001',
            billingId: 'bill-001',
            status: RentPaymentStatus.PENDING,
            method: PaymentMethod.CARD,
          }),
        }),
      );
    });

    it('should throw NotFoundException when billing not found', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent({ billingId: 'nonexistent', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when billing status is not payable', async () => {
      const billing = createMockBilling({ status: RentBillingStatus.PAID });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(
        service.createPaymentIntent({ billingId: 'bill-001', amount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount exceeds balance due', async () => {
      const billing = createMockBilling({ balanceDue: new Decimal(1000) });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(
        service.createPaymentIntent({ billingId: 'bill-001', amount: 1500 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should support FPX payment method', async () => {
      const billing = createMockBilling();
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);
      mockPrisma.rentPayment.create.mockResolvedValue(
        createMockPayment({ method: PaymentMethod.FPX }),
      );

      await service.createPaymentIntent({
        billingId: 'bill-001',
        amount: 2500,
        method: PaymentMethod.FPX,
      });

      expect(mockStripeBilling.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ method: PaymentMethod.FPX }),
        }),
      );
    });

    it('should allow partial payment (amount < balance due)', async () => {
      const billing = createMockBilling({ balanceDue: new Decimal(2500) });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);
      mockPrisma.rentPayment.create.mockResolvedValue(
        createMockPayment({ amount: new Decimal(1000) }),
      );

      const result = await service.createPaymentIntent({
        billingId: 'bill-001',
        amount: 1000,
      });

      expect(result).toBeDefined();
      expect(mockStripeBilling.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1000 }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // recordManualPayment
  // ─────────────────────────────────────────────────────────────────────────

  describe('recordManualPayment', () => {
    it('should record a manual payment and update billing', async () => {
      const billing = createMockBilling();
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null); // for number gen
      mockPrisma.rentPayment.create.mockResolvedValue(
        createMockPayment({
          status: RentPaymentStatus.COMPLETED,
          method: PaymentMethod.BANK_TRANSFER,
          receiptNumber: 'RCP-202603-0001',
        }),
      );
      // getPayment re-fetch
      mockPrisma.rentPayment.findFirst.mockResolvedValue(
        createMockPayment({
          status: RentPaymentStatus.COMPLETED,
          method: PaymentMethod.BANK_TRANSFER,
          receiptNumber: 'RCP-202603-0001',
        }),
      );

      const result = await service.recordManualPayment({
        billingId: 'bill-001',
        amount: 2500,
        method: PaymentMethod.BANK_TRANSFER,
        reference: 'TXN-12345',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.rentPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RentPaymentStatus.COMPLETED,
            method: PaymentMethod.BANK_TRANSFER,
            reference: 'TXN-12345',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rent.payment.completed',
        expect.objectContaining({ billingId: 'bill-001' }),
      );
    });

    it('should throw NotFoundException for non-existent billing', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(
        service.recordManualPayment({
          billingId: 'nonexistent',
          amount: 100,
          method: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when amount exceeds balance', async () => {
      const billing = createMockBilling({ balanceDue: new Decimal(500) });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(
        service.recordManualPayment({
          billingId: 'bill-001',
          amount: 1000,
          method: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-payable billing', async () => {
      const billing = createMockBilling({ status: RentBillingStatus.WRITTEN_OFF });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(
        service.recordManualPayment({
          billingId: 'bill-001',
          amount: 100,
          method: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // handlePaymentSuccess (webhook)
  // ─────────────────────────────────────────────────────────────────────────

  describe('handlePaymentSuccess', () => {
    it('should process successful payment from webhook', async () => {
      const payment = createMockPayment({
        billing: {
          ...createMockBilling(),
          tenancy: {
            id: 'tenancy-001',
            listing: { id: 'listing-001', title: 'Unit 101' },
            tenant: { id: 'occ-001', user: { fullName: 'Jane', email: 'jane@test.com' } },
          },
        },
      });
      // First call: find payment by gatewayId
      mockPrisma.rentPayment.findFirst.mockResolvedValueOnce(payment);
      // Second call: generateReceiptNumber
      mockPrisma.rentPayment.findFirst.mockResolvedValueOnce(null);
      // $transaction calls
      mockPrisma.rentPayment.update.mockResolvedValue({});
      mockPrisma.rentBilling.findFirst.mockResolvedValue(createMockBilling());
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.handlePaymentSuccess('pi_stripe_123', 2500, {
        partnerId: 'partner-001',
        billingId: 'bill-001',
      });

      expect(mockPrisma.rentPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-001' },
          data: expect.objectContaining({
            status: RentPaymentStatus.COMPLETED,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rent.payment.completed',
        expect.any(Object),
      );
    });

    it('should skip if payment not found for gatewayId', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);

      await service.handlePaymentSuccess('pi_unknown', 100, {});

      expect(mockPrisma.rentPayment.update).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should skip if payment already completed', async () => {
      const payment = createMockPayment({ status: RentPaymentStatus.COMPLETED });
      mockPrisma.rentPayment.findFirst.mockResolvedValue(payment);

      await service.handlePaymentSuccess('pi_stripe_123', 2500, {});

      expect(mockPrisma.rentPayment.update).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // handlePaymentFailure (webhook)
  // ─────────────────────────────────────────────────────────────────────────

  describe('handlePaymentFailure', () => {
    it('should mark payment as failed and emit event', async () => {
      const payment = createMockPayment({ status: RentPaymentStatus.PENDING });
      mockPrisma.rentPayment.findFirst.mockResolvedValue(payment);
      mockPrisma.rentPayment.update.mockResolvedValue({
        ...payment,
        status: RentPaymentStatus.FAILED,
      });

      await service.handlePaymentFailure('pi_stripe_123', 'Insufficient funds');

      expect(mockPrisma.rentPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-001' },
          data: expect.objectContaining({
            status: RentPaymentStatus.FAILED,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rent.payment.failed',
        expect.objectContaining({
          paymentId: 'pay-001',
          error: 'Insufficient funds',
        }),
      );
    });

    it('should skip if payment not found', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);

      await service.handlePaymentFailure('pi_unknown', 'Error');

      expect(mockPrisma.rentPayment.update).not.toHaveBeenCalled();
    });

    it('should skip if payment not in pending/processing state', async () => {
      const payment = createMockPayment({ status: RentPaymentStatus.COMPLETED });
      mockPrisma.rentPayment.findFirst.mockResolvedValue(payment);

      await service.handlePaymentFailure('pi_stripe_123', 'Error');

      expect(mockPrisma.rentPayment.update).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getPayment
  // ─────────────────────────────────────────────────────────────────────────

  describe('getPayment', () => {
    it('should return payment with billing relations', async () => {
      const payment = createMockPayment();
      mockPrisma.rentPayment.findFirst.mockResolvedValue(payment);

      const result = await service.getPayment('pay-001');

      expect(result).toBeDefined();
      expect(result.id).toBe('pay-001');
      expect(result.billing).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);

      await expect(service.getPayment('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // listPayments
  // ─────────────────────────────────────────────────────────────────────────

  describe('listPayments', () => {
    it('should return paginated payments', async () => {
      const payments = [createMockPayment()];
      mockPrisma.rentPayment.findMany.mockResolvedValue(payments);
      mockPrisma.rentPayment.count.mockResolvedValue(1);

      const result = await service.listPayments({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by billingId', async () => {
      mockPrisma.rentPayment.findMany.mockResolvedValue([]);
      mockPrisma.rentPayment.count.mockResolvedValue(0);

      await service.listPayments({ billingId: 'bill-001' });

      expect(mockPrisma.rentPayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ billingId: 'bill-001' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.rentPayment.findMany.mockResolvedValue([]);
      mockPrisma.rentPayment.count.mockResolvedValue(0);

      await service.listPayments({ status: 'COMPLETED' });

      expect(mockPrisma.rentPayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: RentPaymentStatus.COMPLETED }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // generateReceipt
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateReceipt', () => {
    it('should throw NotFoundException for non-existent payment', async () => {
      mockPrisma.rentPayment.findFirst.mockResolvedValue(null);

      await expect(service.generateReceipt('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-completed payment', async () => {
      const payment = createMockPayment({ status: RentPaymentStatus.PENDING });
      mockPrisma.rentPayment.findFirst.mockResolvedValue(payment);

      await expect(service.generateReceipt('pay-001')).rejects.toThrow(BadRequestException);
    });

    it('should generate PDF buffer for completed payment', async () => {
      const payment = createMockPayment({
        status: RentPaymentStatus.COMPLETED,
        receiptNumber: 'RCP-202603-0001',
        paymentDate: new Date(),
        billing: {
          ...createMockBilling(),
          tenancy: {
            id: 'tenancy-001',
            listing: { id: 'listing-001', title: 'Unit 101' },
            owner: { id: 'owner-001', name: 'John Owner', email: 'owner@test.com' },
            tenant: {
              id: 'occ-001',
              user: { fullName: 'Jane Tenant', email: 'jane@test.com' },
            },
          },
        },
      });
      mockPrisma.rentPayment.findFirst.mockResolvedValue(payment);

      const result = await service.generateReceipt('pay-001');

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toContain('RCP-202603-0001');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getFpxBanks
  // ─────────────────────────────────────────────────────────────────────────

  describe('getFpxBanks', () => {
    it('should return 16 Malaysian FPX banks', () => {
      const banks = service.getFpxBanks();

      expect(banks).toHaveLength(16);
      expect(banks[0]).toHaveProperty('code');
      expect(banks[0]).toHaveProperty('name');
    });

    it('should include major Malaysian banks', () => {
      const banks = service.getFpxBanks();
      const codes = banks.map((b) => b.code);

      expect(codes).toContain('maybank2u');
      expect(codes).toContain('cimb');
      expect(codes).toContain('public_bank');
      expect(codes).toContain('rhb');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Billing auto-update on payment
  // ─────────────────────────────────────────────────────────────────────────

  describe('billing auto-update', () => {
    it('should update billing to PAID when full amount paid', async () => {
      const billing = createMockBilling({
        totalAmount: new Decimal(2500),
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
      });

      // Setup for handlePaymentSuccess
      const payment = createMockPayment();
      mockPrisma.rentPayment.findFirst
        .mockResolvedValueOnce(payment) // find payment by gatewayId
        .mockResolvedValueOnce(null); // generateReceiptNumber
      mockPrisma.rentPayment.update.mockResolvedValue({});
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.handlePaymentSuccess('pi_stripe_123', 2500, {});

      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RentBillingStatus.PAID,
          }),
        }),
      );
    });

    it('should update billing to PARTIALLY_PAID for partial payment', async () => {
      const billing = createMockBilling({
        totalAmount: new Decimal(2500),
        paidAmount: new Decimal(0),
        balanceDue: new Decimal(2500),
      });

      const payment = createMockPayment({ amount: new Decimal(1000) });
      mockPrisma.rentPayment.findFirst
        .mockResolvedValueOnce(payment) // find payment
        .mockResolvedValueOnce(null); // receiptNumber gen
      mockPrisma.rentPayment.update.mockResolvedValue({});
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.handlePaymentSuccess('pi_stripe_123', 1000, {});

      expect(mockPrisma.rentBilling.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: RentBillingStatus.PARTIALLY_PAID,
          }),
        }),
      );
    });

    it('should emit billing.status.changed event when status changes', async () => {
      const billing = createMockBilling();
      const payment = createMockPayment();
      mockPrisma.rentPayment.findFirst
        .mockResolvedValueOnce(payment)
        .mockResolvedValueOnce(null);
      mockPrisma.rentPayment.update.mockResolvedValue({});
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue({});

      await service.handlePaymentSuccess('pi_stripe_123', 2500, {});

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.status.changed',
        expect.objectContaining({
          billingId: 'bill-001',
          newStatus: RentBillingStatus.PAID,
        }),
      );
    });
  });
});
