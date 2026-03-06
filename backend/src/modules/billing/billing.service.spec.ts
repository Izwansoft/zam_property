/**
 * RentBillingService Unit Tests
 * Session 6.1 - Billing Engine
 *
 * Tests billing business logic: generate bill, add line items,
 * calculate late fees, status transitions, PDF generation.
 */

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RentBillingStatus, TenancyStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { RentBillingService } from './billing.service';

describe('RentBillingService', () => {
  let service: RentBillingService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockEventEmitter: any;

  // Helper: create a tenancy-like object
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
      user: { fullName: 'Jane Tenant', email: 'jane@test.com' },
    },
    ...overrides,
  });

  // Helper: create a billing-like object
  const createMockBilling = (overrides: Partial<any> = {}) => ({
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
    issueDate: new Date('2026-03-01'),
    dueDate: new Date('2026-03-08'),
    paidDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: [
      {
        id: 'li-001',
        billingId: 'bill-001',
        description: 'Monthly rent for March 2026',
        type: 'RENT',
        amount: new Decimal(2500),
        claimId: null,
        createdAt: new Date(),
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      rentBilling: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      rentBillingLineItem: {
        create: jest.fn(),
        findMany: jest.fn(),
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

    service = new RentBillingService(mockPrisma, mockPartnerContext, mockEventEmitter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // generateBill
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateBill', () => {
    it('should generate a bill for a valid tenancy', async () => {
      const tenancy = createMockTenancy();
      const createdBill = createMockBilling();

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null); // No duplicate
      mockPrisma.rentBilling.findMany.mockResolvedValue([]); // No overdue bills
      mockPrisma.rentBilling.count.mockResolvedValue(0); // First bill
      mockPrisma.rentBilling.create.mockResolvedValue(createdBill);

      const result = await service.generateBill({
        tenancyId: 'tenancy-001',
        billingPeriod: '2026-03-01',
      });

      expect(result).toBeDefined();
      expect(result.billNumber).toBe('BILL-202603-0001');
      expect(result.tenancyId).toBe('tenancy-001');
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
        expect.anything(),
      );
    });

    it('should throw NotFoundException if tenancy not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.generateBill({
          tenancyId: 'nonexistent',
          billingPeriod: '2026-03-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-billable tenancy status', async () => {
      const tenancy = createMockTenancy({ status: TenancyStatus.DRAFT });
      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);

      await expect(
        service.generateBill({
          tenancyId: 'tenancy-001',
          billingPeriod: '2026-03-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if bill already exists for period', async () => {
      const tenancy = createMockTenancy();
      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findFirst.mockResolvedValue(createMockBilling());

      await expect(
        service.generateBill({
          tenancyId: 'tenancy-001',
          billingPeriod: '2026-03-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should include additional line items when provided', async () => {
      const tenancy = createMockTenancy();
      const createdBill = createMockBilling({
        lineItems: [
          { id: 'li-001', type: 'RENT', amount: new Decimal(2500) },
          { id: 'li-002', type: 'UTILITY', amount: new Decimal(150) },
        ],
        adjustments: new Decimal(150),
        totalAmount: new Decimal(2650),
        balanceDue: new Decimal(2650),
      });

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);
      mockPrisma.rentBilling.findMany.mockResolvedValue([]); // No overdue bills
      mockPrisma.rentBilling.count.mockResolvedValue(0);
      mockPrisma.rentBilling.create.mockResolvedValue(createdBill);

      const result = await service.generateBill({
        tenancyId: 'tenancy-001',
        billingPeriod: '2026-03-01',
        additionalLineItems: [
          { description: 'Water bill', type: 'UTILITY', amount: 150 },
        ],
      });

      expect(result).toBeDefined();
      expect(mockPrisma.rentBilling.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adjustments: 150,
            totalAmount: 2650,
          }),
        }),
      );
    });

    it('should allow billing for tenancies in MAINTENANCE_HOLD status', async () => {
      const tenancy = createMockTenancy({ status: TenancyStatus.MAINTENANCE_HOLD });
      const createdBill = createMockBilling();

      mockPrisma.tenancy.findFirst.mockResolvedValue(tenancy);
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);
      mockPrisma.rentBilling.findMany.mockResolvedValue([]); // No overdue bills
      mockPrisma.rentBilling.count.mockResolvedValue(0);
      mockPrisma.rentBilling.create.mockResolvedValue(createdBill);

      const result = await service.generateBill({
        tenancyId: 'tenancy-001',
        billingPeriod: '2026-03-01',
      });

      expect(result).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // calculateLateFee
  // ─────────────────────────────────────────────────────────────────────────

  describe('calculateLateFee', () => {
    it('should return 0 when no late fee percent configured', async () => {
      const result = await service.calculateLateFee('tenancy-001', null);
      expect(result).toBe(0);
    });

    it('should return 0 when late fee percent is 0', async () => {
      const result = await service.calculateLateFee('tenancy-001', new Decimal(0));
      expect(result).toBe(0);
    });

    it('should return 0 when no overdue bills exist', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const result = await service.calculateLateFee('tenancy-001', new Decimal(10));
      expect(result).toBe(0);
    });

    it('should calculate late fee from overdue balance', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([
        createMockBilling({
          status: RentBillingStatus.OVERDUE,
          balanceDue: new Decimal(2500),
          dueDate: new Date('2026-01-08'),
        }),
      ]);

      const result = await service.calculateLateFee('tenancy-001', new Decimal(10));
      // 10% of 2500 = 250
      expect(result).toBe(250);
    });

    it('should sum overdue across multiple bills', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([
        createMockBilling({
          status: RentBillingStatus.OVERDUE,
          balanceDue: new Decimal(2500),
        }),
        createMockBilling({
          id: 'bill-002',
          status: RentBillingStatus.OVERDUE,
          balanceDue: new Decimal(1000),
        }),
      ]);

      const result = await service.calculateLateFee('tenancy-001', new Decimal(10));
      // 10% of (2500 + 1000) = 350
      expect(result).toBe(350);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // addLineItem
  // ─────────────────────────────────────────────────────────────────────────

  describe('addLineItem', () => {
    it('should add a line item to a GENERATED bill', async () => {
      const billing = createMockBilling();
      const updatedBilling = createMockBilling({
        adjustments: new Decimal(150),
        totalAmount: new Decimal(2650),
        balanceDue: new Decimal(2650),
        lineItems: [
          ...billing.lineItems,
          { id: 'li-002', type: 'UTILITY', description: 'Water', amount: new Decimal(150) },
        ],
      });

      mockPrisma.rentBilling.findUnique.mockResolvedValue(billing);
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });
      mockPrisma.rentBillingLineItem.create.mockResolvedValue({});
      mockPrisma.rentBillingLineItem.findMany.mockResolvedValue([
        { type: 'RENT', amount: new Decimal(2500) },
        { type: 'UTILITY', amount: new Decimal(150) },
      ]);
      mockPrisma.rentBilling.update.mockResolvedValue(updatedBilling);

      const result = await service.addLineItem('bill-001', {
        description: 'Water bill',
        type: 'UTILITY',
        amount: 150,
      });

      expect(result).toBeDefined();
      expect(mockPrisma.rentBillingLineItem.create).toHaveBeenCalled();
      expect(mockPrisma.rentBilling.update).toHaveBeenCalled();
    });

    it('should reject adding line item to PAID bill', async () => {
      const billing = createMockBilling({ status: RentBillingStatus.PAID });

      mockPrisma.rentBilling.findUnique.mockResolvedValue(billing);
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });

      await expect(
        service.addLineItem('bill-001', {
          description: 'Water bill',
          type: 'UTILITY',
          amount: 150,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject adding line item to PAID bill', async () => {
      const billing = createMockBilling({ status: RentBillingStatus.PAID });

      mockPrisma.rentBilling.findUnique.mockResolvedValue(billing);
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });

      await expect(
        service.addLineItem('bill-001', {
          description: 'Water bill',
          type: 'UTILITY',
          amount: 150,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getBill
  // ─────────────────────────────────────────────────────────────────────────

  describe('getBill', () => {
    it('should return billing with all relations', async () => {
      const billing = {
        ...createMockBilling(),
        tenancy: createMockTenancy(),
        reminders: [],
      };

      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      const result = await service.getBill('bill-001');

      expect(result).toBeDefined();
      expect(result.billNumber).toBe('BILL-202603-0001');
      expect(result.tenancy).toBeDefined();
    });

    it('should throw NotFoundException for non-existent bill', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(service.getBill('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // listBills
  // ─────────────────────────────────────────────────────────────────────────

  describe('listBills', () => {
    it('should return paginated results', async () => {
      const bills = [createMockBilling()];

      mockPrisma.rentBilling.findMany.mockResolvedValue(bills);
      mockPrisma.rentBilling.count.mockResolvedValue(1);

      const result = await service.listBills({ page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by tenancy ID', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);
      mockPrisma.rentBilling.count.mockResolvedValue(0);

      await service.listBills({ tenancyId: 'tenancy-001' });

      expect(mockPrisma.rentBilling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenancyId: 'tenancy-001',
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);
      mockPrisma.rentBilling.count.mockResolvedValue(0);

      await service.listBills({ status: RentBillingStatus.OVERDUE });

      expect(mockPrisma.rentBilling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RentBillingStatus.OVERDUE,
          }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Status transitions
  // ─────────────────────────────────────────────────────────────────────────

  describe('markAsSent', () => {
    it('should mark GENERATED bill as SENT', async () => {
      const billing = {
        ...createMockBilling({ status: RentBillingStatus.GENERATED }),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      const updatedBilling = createMockBilling({ status: RentBillingStatus.SENT });

      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue(updatedBilling);

      const result = await service.markAsSent('bill-001');

      expect(result.status).toBe(RentBillingStatus.SENT);
    });

    it('should reject marking non-GENERATED bill as sent', async () => {
      const billing = {
        ...createMockBilling({ status: RentBillingStatus.PAID }),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(service.markAsSent('bill-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('markAsOverdue', () => {
    it('should mark SENT bill as OVERDUE', async () => {
      const billing = {
        ...createMockBilling({ status: RentBillingStatus.SENT }),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      const updatedBilling = createMockBilling({ status: RentBillingStatus.OVERDUE });

      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue(updatedBilling);

      const result = await service.markAsOverdue('bill-001');

      expect(result.status).toBe(RentBillingStatus.OVERDUE);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.overdue',
        expect.anything(),
      );
    });

    it('should reject marking PAID bill as overdue', async () => {
      const billing = {
        ...createMockBilling({ status: RentBillingStatus.PAID }),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(service.markAsOverdue('bill-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('writeOff', () => {
    it('should write off an OVERDUE bill', async () => {
      const billing = {
        ...createMockBilling({ status: RentBillingStatus.OVERDUE }),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      const updatedBilling = createMockBilling({ status: RentBillingStatus.WRITTEN_OFF });

      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBilling.update.mockResolvedValue(updatedBilling);

      const result = await service.writeOff('bill-001');

      expect(result.status).toBe(RentBillingStatus.WRITTEN_OFF);
    });

    it('should reject writing off a PAID bill', async () => {
      const billing = {
        ...createMockBilling({ status: RentBillingStatus.PAID }),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(service.writeOff('bill-001')).rejects.toThrow(BadRequestException);
    });

    it('should reject writing off an already WRITTEN_OFF bill', async () => {
      const billing = {
        ...createMockBilling({ status: RentBillingStatus.WRITTEN_OFF }),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(service.writeOff('bill-001')).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PDF generation
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateBillPdf', () => {
    it('should generate a PDF buffer with correct filename', async () => {
      const billing = {
        ...createMockBilling(),
        tenancy: createMockTenancy(),
        reminders: [],
      };
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      const result = await service.generateBillPdf('bill-001');

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe('BILL-202603-0001.pdf');
    });

    it('should throw NotFoundException for non-existent bill', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(service.generateBillPdf('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Billing Configuration (Session 6.2)
  // ─────────────────────────────────────────────────────────────────────────

  describe('getBillingConfig', () => {
    it('should return billing configuration for a tenancy', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({
        id: 'tenancy-001',
        billingDay: 5,
        paymentDueDay: 14,
        lateFeePercent: new Decimal(8),
        monthlyRent: new Decimal(3000),
      });

      const result = await service.getBillingConfig('tenancy-001');

      expect(result).toEqual({
        tenancyId: 'tenancy-001',
        billingDay: 5,
        paymentDueDay: 14,
        lateFeePercent: 8,
        monthlyRent: 3000,
      });
    });

    it('should handle null lateFeePercent', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({
        id: 'tenancy-001',
        billingDay: 1,
        paymentDueDay: 7,
        lateFeePercent: null,
        monthlyRent: new Decimal(2000),
      });

      const result = await service.getBillingConfig('tenancy-001');

      expect(result.lateFeePercent).toBeNull();
    });

    it('should throw NotFoundException for non-existent tenancy', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(service.getBillingConfig('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateBillingConfig', () => {
    beforeEach(() => {
      mockPrisma.tenancy.update = jest.fn();
    });

    it('should update billing day', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001' });
      mockPrisma.tenancy.update.mockResolvedValue({
        id: 'tenancy-001',
        billingDay: 15,
        paymentDueDay: 7,
        lateFeePercent: new Decimal(10),
        monthlyRent: new Decimal(2500),
      });

      const result = await service.updateBillingConfig('tenancy-001', {
        billingDay: 15,
      });

      expect(result.billingDay).toBe(15);
      expect(mockPrisma.tenancy.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenancy-001' },
          data: expect.objectContaining({ billingDay: 15 }),
        }),
      );
    });

    it('should update payment due days', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001' });
      mockPrisma.tenancy.update.mockResolvedValue({
        id: 'tenancy-001',
        billingDay: 1,
        paymentDueDay: 30,
        lateFeePercent: new Decimal(10),
        monthlyRent: new Decimal(2500),
      });

      const result = await service.updateBillingConfig('tenancy-001', {
        paymentDueDay: 30,
      });

      expect(result.paymentDueDay).toBe(30);
    });

    it('should update late fee percent', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001' });
      mockPrisma.tenancy.update.mockResolvedValue({
        id: 'tenancy-001',
        billingDay: 1,
        paymentDueDay: 7,
        lateFeePercent: new Decimal(5),
        monthlyRent: new Decimal(2500),
      });

      const result = await service.updateBillingConfig('tenancy-001', {
        lateFeePercent: 5,
      });

      expect(result.lateFeePercent).toBe(5);
    });

    it('should reject billing day outside 1-28 range', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001' });

      await expect(
        service.updateBillingConfig('tenancy-001', { billingDay: 31 }),
      ).rejects.toThrow('billingDay must be between 1 and 28');
    });

    it('should reject payment due day outside 1-60 range', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001' });

      await expect(
        service.updateBillingConfig('tenancy-001', { paymentDueDay: 90 }),
      ).rejects.toThrow('paymentDueDay must be between 1 and 60');
    });

    it('should reject late fee percent outside 0-100 range', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001' });

      await expect(
        service.updateBillingConfig('tenancy-001', { lateFeePercent: 150 }),
      ).rejects.toThrow('lateFeePercent must be between 0 and 100');
    });

    it('should throw NotFoundException for non-existent tenancy', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.updateBillingConfig('nonexistent', { billingDay: 5 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAutomationStatus', () => {
    beforeEach(() => {
      mockPrisma.tenancy.count = jest.fn();
      mockPrisma.tenancy.groupBy = jest.fn();
      mockPrisma.rentBilling.count = jest.fn();
      mockPrisma.rentBilling.aggregate = jest.fn();
      mockPrisma.rentBilling.findFirst = jest.fn();
    });

    it('should return automation status summary', async () => {
      mockPrisma.tenancy.count.mockResolvedValue(10);
      mockPrisma.tenancy.groupBy.mockResolvedValue([
        { billingDay: 1, _count: { id: 7 } },
        { billingDay: 15, _count: { id: 3 } },
      ]);
      mockPrisma.rentBilling.count
        .mockResolvedValueOnce(5)  // pending bills
        .mockResolvedValueOnce(2); // overdue bills
      mockPrisma.rentBilling.aggregate.mockResolvedValue({
        _sum: { balanceDue: new Decimal(15000) },
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue({
        createdAt: new Date('2026-02-20'),
      });

      const result = await service.getAutomationStatus();

      expect(result).toEqual({
        totalActiveTenancies: 10,
        configuredBillingDays: [
          { day: 1, count: 7 },
          { day: 15, count: 3 },
        ],
        pendingBills: 5,
        overdueBills: 2,
        totalOutstanding: 15000,
        lastBillGenerated: new Date('2026-02-20'),
      });
    });

    it('should handle no data gracefully', async () => {
      mockPrisma.tenancy.count.mockResolvedValue(0);
      mockPrisma.tenancy.groupBy.mockResolvedValue([]);
      mockPrisma.rentBilling.count.mockResolvedValue(0);
      mockPrisma.rentBilling.aggregate.mockResolvedValue({
        _sum: { balanceDue: null },
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      const result = await service.getAutomationStatus();

      expect(result).toEqual({
        totalActiveTenancies: 0,
        configuredBillingDays: [],
        pendingBills: 0,
        overdueBills: 0,
        totalOutstanding: 0,
        lastBillGenerated: null,
      });
    });
  });
});
