/**
 * DepositService Unit Tests
 * Session 5.8 - Phase 5 Testing & Integration
 *
 * Tests deposit business logic: collection, deductions, refund calculation, forfeit.
 */

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DepositStatus, TenancyStatus, ClaimStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { DepositService, DeductionClaim } from './deposit.service';

describe('DepositService', () => {
  let service: DepositService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockEventEmitter: any;

  // Helper: create a deposit-like object
  const createMockDeposit = (overrides: Partial<any> = {}) => ({
    id: 'dep-001',
    tenancyId: 'tenancy-001',
    type: 'SECURITY',
    amount: new Decimal(3000),
    status: DepositStatus.PENDING,
    collectedAt: null,
    collectedVia: null,
    paymentRef: null,
    refundableAmount: null,
    deductions: null,
    refundedAmount: null,
    refundedAt: null,
    refundRef: null,
    deductionClaims: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenancy: {
      id: 'tenancy-001',
      partnerId: 'partner-001',
      status: TenancyStatus.ACTIVE,
      listing: { id: 'listing-001', title: 'Unit 101' },
      owner: { id: 'owner-001', name: 'John Owner' },
      tenant: {
        id: 'occ-001',
        user: { fullName: 'Jane Tenant', email: 'jane@test.com' },
      },
    },
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      deposit: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      tenancy: {
        findFirst: jest.fn(),
      },
      claim: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    mockPartnerContext = {
      partnerId: 'partner-001',
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new DepositService(mockPrisma, mockPartnerContext, mockEventEmitter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // markCollected
  // ─────────────────────────────────────────────────────────

  describe('markCollected', () => {
    it('should mark PENDING deposit as COLLECTED', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.PENDING });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.COLLECTED,
        collectedAt: expect.any(Date),
        refundableAmount: deposit.amount,
      });

      const result = await service.markCollected('dep-001', {
        collectedVia: 'BANK_TRANSFER',
        paymentRef: 'REF-12345',
      });

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dep-001' },
          data: expect.objectContaining({
            status: DepositStatus.COLLECTED,
            collectedVia: 'BANK_TRANSFER',
            paymentRef: 'REF-12345',
            refundableAmount: deposit.amount,
          }),
        }),
      );
    });

    it('should reject non-PENDING deposit', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.COLLECTED });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.markCollected('dep-001', {
          collectedVia: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit deposit.collected event', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.PENDING });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.COLLECTED,
      });

      await service.markCollected('dep-001', {
        collectedVia: 'BANK_TRANSFER',
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'deposit.collected',
        expect.objectContaining({
          depositId: 'dep-001',
          tenancyId: 'tenancy-001',
          partnerId: 'partner-001',
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // addDeduction
  // ─────────────────────────────────────────────────────────

  describe('addDeduction', () => {
    it('should add deduction to COLLECTED deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.HELD,
        deductions: 500,
        refundableAmount: 2500,
      });

      const result = await service.addDeduction('dep-001', {
        description: 'Wall damage repair',
        amount: 500,
      });

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DepositStatus.HELD,
            deductions: 500,
            refundableAmount: 2500,
          }),
        }),
      );
    });

    it('should add deduction to HELD deposit with existing deductions', async () => {
      const existingClaims: DeductionClaim[] = [
        { description: 'Previous damage', amount: 200, addedAt: new Date() },
      ];
      const deposit = createMockDeposit({
        status: DepositStatus.HELD,
        deductionClaims: existingClaims,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        deductions: 700,
        refundableAmount: 2300,
      });

      await service.addDeduction('dep-001', {
        description: 'Additional damage',
        amount: 500,
      });

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deductions: 700, // 200 + 500
            refundableAmount: 2300, // 3000 - 700
          }),
        }),
      );
    });

    it('should reject deduction exceeding deposit amount', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.addDeduction('dep-001', {
          description: 'Excessive claim',
          amount: 5000, // exceeds 3000 deposit
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject deduction on PENDING deposit', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.PENDING });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.addDeduction('dep-001', {
          description: 'Some damage',
          amount: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject deduction on FULLY_REFUNDED deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.FULLY_REFUNDED,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.addDeduction('dep-001', {
          description: 'Some damage',
          amount: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject deduction on FORFEITED deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.FORFEITED,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.addDeduction('dep-001', {
          description: 'Some damage',
          amount: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────
  // calculateRefund
  // ─────────────────────────────────────────────────────────

  describe('calculateRefund', () => {
    it('should calculate full refund when no deductions', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: {
          id: 'tenancy-001',
          partnerId: 'partner-001',
          status: TenancyStatus.TERMINATED,
          listing: { id: 'l', title: 'U' },
          owner: { id: 'o', name: 'O' },
          tenant: { id: 'oc', user: { fullName: 'J', email: 'j@t' } },
        },
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      const result = await service.calculateRefund('dep-001');

      expect(result.originalAmount).toBe(3000);
      expect(result.totalDeductions).toBe(0);
      expect(result.refundableAmount).toBe(3000);
      expect(result.canRefund).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should calculate partial refund with deductions', async () => {
      const deductions: DeductionClaim[] = [
        { description: 'Wall repair', amount: 500, addedAt: new Date() },
        { description: 'Cleaning fee', amount: 200, addedAt: new Date() },
      ];
      const deposit = createMockDeposit({
        status: DepositStatus.HELD,
        deductionClaims: deductions,
        tenancy: {
          id: 'tenancy-001',
          partnerId: 'partner-001',
          status: TenancyStatus.TERMINATED,
          listing: { id: 'l', title: 'U' },
          owner: { id: 'o', name: 'O' },
          tenant: { id: 'oc', user: { fullName: 'J', email: 'j@t' } },
        },
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      const result = await service.calculateRefund('dep-001');

      expect(result.originalAmount).toBe(3000);
      expect(result.totalDeductions).toBe(700);
      expect(result.refundableAmount).toBe(2300);
      expect(result.deductions).toHaveLength(2);
      expect(result.canRefund).toBe(true);
    });

    it('should not allow refund when tenancy is ACTIVE', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: {
          id: 'tenancy-001',
          partnerId: 'partner-001',
          status: TenancyStatus.ACTIVE,
          listing: { id: 'l', title: 'U' },
          owner: { id: 'o', name: 'O' },
          tenant: { id: 'oc', user: { fullName: 'J', email: 'j@t' } },
        },
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      const result = await service.calculateRefund('dep-001');

      expect(result.canRefund).toBe(false);
      expect(result.reason).toContain('TERMINATED');
    });

    it('should not allow refund when deposit is PENDING', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.PENDING,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      const result = await service.calculateRefund('dep-001');

      expect(result.canRefund).toBe(false);
      expect(result.reason).toContain('PENDING');
    });

    it('should not allow refund when deposit is FORFEITED', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.FORFEITED,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      const result = await service.calculateRefund('dep-001');

      expect(result.canRefund).toBe(false);
    });

    it('should not allow refund when deposit is already FULLY_REFUNDED', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.FULLY_REFUNDED,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      const result = await service.calculateRefund('dep-001');

      expect(result.canRefund).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────
  // processRefund
  // ─────────────────────────────────────────────────────────

  describe('processRefund', () => {
    it('should process full refund (FULLY_REFUNDED)', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: {
          id: 'tenancy-001',
          partnerId: 'partner-001',
          status: TenancyStatus.TERMINATED,
          listing: { id: 'l', title: 'U' },
          owner: { id: 'o', name: 'O' },
          tenant: { id: 'oc', user: { fullName: 'J', email: 'j@t' } },
        },
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.FULLY_REFUNDED,
        refundedAmount: 3000,
      });

      const result = await service.processRefund('dep-001', {
        refundRef: 'REF-REFUND-001',
      });

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DepositStatus.FULLY_REFUNDED,
            refundedAmount: 3000,
          }),
        }),
      );
    });

    it('should process partial refund (PARTIALLY_REFUNDED)', async () => {
      const deductions: DeductionClaim[] = [
        { description: 'Damage', amount: 1000, addedAt: new Date() },
      ];
      const deposit = createMockDeposit({
        status: DepositStatus.HELD,
        deductionClaims: deductions,
        tenancy: {
          id: 'tenancy-001',
          partnerId: 'partner-001',
          status: TenancyStatus.TERMINATED,
          listing: { id: 'l', title: 'U' },
          owner: { id: 'o', name: 'O' },
          tenant: { id: 'oc', user: { fullName: 'J', email: 'j@t' } },
        },
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.PARTIALLY_REFUNDED,
        refundedAmount: 2000,
      });

      const result = await service.processRefund('dep-001', {
        refundRef: 'REF-PARTIAL-001',
      });

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DepositStatus.PARTIALLY_REFUNDED,
            refundedAmount: 2000,
          }),
        }),
      );
    });

    it('should reject refund when canRefund is false', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.PENDING,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.processRefund('dep-001', { refundRef: 'REF-X' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit deposit.refunded event', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: {
          id: 'tenancy-001',
          partnerId: 'partner-001',
          status: TenancyStatus.TERMINATED,
          listing: { id: 'l', title: 'U' },
          owner: { id: 'o', name: 'O' },
          tenant: { id: 'oc', user: { fullName: 'J', email: 'j@t' } },
        },
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.FULLY_REFUNDED,
        refundedAmount: 3000,
        tenancyId: 'tenancy-001',
        type: 'SECURITY',
      });

      await service.processRefund('dep-001', { refundRef: 'REF-001' });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'deposit.refunded',
        expect.objectContaining({
          depositId: 'dep-001',
          refundedAmount: 3000,
          deductions: 0,
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // forfeit
  // ─────────────────────────────────────────────────────────

  describe('forfeit', () => {
    it('should forfeit COLLECTED deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.FORFEITED,
        refundableAmount: 0,
      });

      await service.forfeit('dep-001', { reason: 'Tenant abandoned property' });

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DepositStatus.FORFEITED,
            refundableAmount: 0,
            deductions: deposit.amount,
          }),
        }),
      );
    });

    it('should forfeit HELD deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.HELD,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.FORFEITED,
      });

      await service.forfeit('dep-001', { reason: 'Breach of contract' });

      expect(mockPrisma.deposit.update).toHaveBeenCalled();
    });

    it('should reject forfeiting PENDING deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.PENDING,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.forfeit('dep-001', { reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject forfeiting already FULLY_REFUNDED deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.FULLY_REFUNDED,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.forfeit('dep-001', { reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────
  // findById
  // ─────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return deposit when found', async () => {
      const deposit = createMockDeposit();
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      const result = await service.findById('dep-001');
      expect(result.id).toBe('dep-001');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.deposit.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // getTenancyDepositSummary
  // ─────────────────────────────────────────────────────────

  describe('getTenancyDepositSummary', () => {
    it('should summarize deposits for a tenancy', async () => {
      const deposits = [
        createMockDeposit({
          id: 'dep-001',
          type: 'SECURITY',
          amount: new Decimal(3000),
          status: DepositStatus.COLLECTED,
          deductions: null,
          refundableAmount: new Decimal(3000),
          refundedAmount: null,
        }),
        createMockDeposit({
          id: 'dep-002',
          type: 'UTILITY',
          amount: new Decimal(500),
          status: DepositStatus.PENDING,
          deductions: null,
          refundableAmount: null,
          refundedAmount: null,
        }),
        createMockDeposit({
          id: 'dep-003',
          type: 'KEY',
          amount: new Decimal(200),
          status: DepositStatus.FULLY_REFUNDED,
          deductions: new Decimal(0),
          refundableAmount: new Decimal(200),
          refundedAmount: new Decimal(200),
        }),
      ];
      mockPrisma.deposit.findMany.mockResolvedValue(deposits);

      const summary = await service.getTenancyDepositSummary('tenancy-001');

      expect(summary.tenancyId).toBe('tenancy-001');
      expect(summary.totalDeposits).toBe(3700);
      expect(summary.totalCollected).toBe(3000); // SECURITY
      expect(summary.totalPending).toBe(500); // UTILITY
      expect(summary.totalRefunded).toBe(200); // KEY
      expect(summary.deposits).toHaveLength(3);
    });

    it('should handle tenancy with no deposits', async () => {
      mockPrisma.deposit.findMany.mockResolvedValue([]);

      const summary = await service.getTenancyDepositSummary('tenancy-empty');

      expect(summary.totalDeposits).toBe(0);
      expect(summary.totalCollected).toBe(0);
      expect(summary.totalPending).toBe(0);
      expect(summary.deposits).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────
  // linkClaimToDeposit
  // ─────────────────────────────────────────────────────────

  describe('linkClaimToDeposit', () => {
    const mockClaim = {
      id: 'claim-001',
      tenancyId: 'tenancy-001',
      claimNumber: 'CLM-20260222-0001',
      type: 'DAMAGE',
      status: ClaimStatus.APPROVED,
      title: 'Wall damage',
      claimedAmount: new Decimal(500),
      approvedAmount: new Decimal(500),
    };

    it('should link an approved claim to a collected deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findFirst.mockResolvedValue(mockClaim);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.HELD,
        deductions: 500,
        refundableAmount: 2500,
      });

      const result = await service.linkClaimToDeposit('dep-001', 'claim-001');

      expect(mockPrisma.claim.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'claim-001', tenancy: { partnerId: 'partner-001' } },
        }),
      );
      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deductions: 500,
            refundableAmount: 2500,
            status: DepositStatus.HELD,
          }),
        }),
      );
    });

    it('should link a partially approved claim using approvedAmount', async () => {
      const partialClaim = {
        ...mockClaim,
        status: ClaimStatus.PARTIALLY_APPROVED,
        approvedAmount: new Decimal(300),
      };
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findFirst.mockResolvedValue(partialClaim);
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.HELD,
        deductions: 300,
        refundableAmount: 2700,
      });

      await service.linkClaimToDeposit('dep-001', 'claim-001');

      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deductions: 300,
            refundableAmount: 2700,
          }),
        }),
      );
    });

    it('should reject linking claim to PENDING deposit', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.PENDING });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.linkClaimToDeposit('dep-001', 'claim-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-approved claim', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.COLLECTED });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findFirst.mockResolvedValue({
        ...mockClaim,
        status: ClaimStatus.SUBMITTED,
      });

      await expect(
        service.linkClaimToDeposit('dep-001', 'claim-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject claim not found', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.COLLECTED });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findFirst.mockResolvedValue(null);

      await expect(
        service.linkClaimToDeposit('dep-001', 'claim-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject claim from different tenancy', async () => {
      const deposit = createMockDeposit({ status: DepositStatus.COLLECTED });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findFirst.mockResolvedValue({
        ...mockClaim,
        tenancyId: 'other-tenancy',
      });

      await expect(
        service.linkClaimToDeposit('dep-001', 'claim-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject already-linked claim', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.HELD,
        deductionClaims: [
          { claimId: 'claim-001', description: 'Already linked', amount: 500, addedAt: new Date() },
        ],
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findFirst.mockResolvedValue(mockClaim);

      await expect(
        service.linkClaimToDeposit('dep-001', 'claim-001'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─────────────────────────────────────────────────────────
  // calculateDeductions
  // ─────────────────────────────────────────────────────────

  describe('calculateDeductions', () => {
    it('should calculate deductions from approved claims', async () => {
      mockPrisma.claim.findMany.mockResolvedValue([
        {
          id: 'claim-001',
          claimNumber: 'CLM-20260222-0001',
          type: 'DAMAGE',
          title: 'Wall damage',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(500),
          claimedAmount: new Decimal(500),
          submittedAt: new Date(),
        },
        {
          id: 'claim-002',
          claimNumber: 'CLM-20260222-0002',
          type: 'CLEANING',
          title: 'Deep cleaning',
          status: ClaimStatus.PARTIALLY_APPROVED,
          approvedAmount: new Decimal(200),
          claimedAmount: new Decimal(400),
          submittedAt: new Date(),
        },
      ]);
      mockPrisma.deposit.findMany.mockResolvedValue([
        {
          id: 'dep-001',
          type: 'SECURITY',
          amount: new Decimal(3000),
          deductions: null,
        },
        {
          id: 'dep-002',
          type: 'UTILITY',
          amount: new Decimal(500),
          deductions: new Decimal(100),
        },
      ]);

      const result = await service.calculateDeductions('tenancy-001');

      expect(result.tenancyId).toBe('tenancy-001');
      expect(result.claims).toHaveLength(2);
      expect(result.totalDeductions).toBe(700); // 500 + 200
      expect(result.deposits).toHaveLength(2);
      expect(result.deposits[0].availableForDeduction).toBe(3000);
      expect(result.deposits[1].availableForDeduction).toBe(400); // 500 - 100
      expect(result.shortfall).toBe(0); // 700 < 3400
    });

    it('should calculate shortfall when claims exceed deposits', async () => {
      mockPrisma.claim.findMany.mockResolvedValue([
        {
          id: 'claim-001',
          claimNumber: 'CLM-001',
          type: 'DAMAGE',
          title: 'Major damage',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(5000),
          claimedAmount: new Decimal(5000),
          submittedAt: new Date(),
        },
      ]);
      mockPrisma.deposit.findMany.mockResolvedValue([
        {
          id: 'dep-001',
          type: 'SECURITY',
          amount: new Decimal(3000),
          deductions: null,
        },
      ]);

      const result = await service.calculateDeductions('tenancy-001');

      expect(result.totalDeductions).toBe(5000);
      expect(result.shortfall).toBe(2000); // 5000 - 3000
    });

    it('should return zero deductions when no approved claims', async () => {
      mockPrisma.claim.findMany.mockResolvedValue([]);
      mockPrisma.deposit.findMany.mockResolvedValue([
        { id: 'dep-001', type: 'SECURITY', amount: new Decimal(3000), deductions: null },
      ]);

      const result = await service.calculateDeductions('tenancy-001');

      expect(result.totalDeductions).toBe(0);
      expect(result.shortfall).toBe(0);
      expect(result.claims).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────
  // finalizeRefund
  // ─────────────────────────────────────────────────────────

  describe('finalizeRefund', () => {
    const terminatedTenancy = {
      id: 'tenancy-001',
      partnerId: 'partner-001',
      status: TenancyStatus.TERMINATED,
      listing: { id: 'l', title: 'U' },
      owner: { id: 'o', name: 'O' },
      tenant: { id: 'oc', user: { fullName: 'J', email: 'j@t' } },
    };

    it('should finalize deposit with claims and partial refund', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: terminatedTenancy,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findMany.mockResolvedValue([
        {
          id: 'claim-001',
          claimNumber: 'CLM-20260222-0001',
          type: 'DAMAGE',
          title: 'Wall damage',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(500),
          claimedAmount: new Decimal(500),
          reviewNotes: 'Approved by admin',
          submittedAt: new Date('2026-02-20'),
        },
        {
          id: 'claim-002',
          claimNumber: 'CLM-20260222-0002',
          type: 'CLEANING',
          title: 'Deep cleaning',
          status: ClaimStatus.PARTIALLY_APPROVED,
          approvedAmount: new Decimal(200),
          claimedAmount: new Decimal(400),
          reviewNotes: null,
          submittedAt: new Date('2026-02-21'),
        },
      ]);
      mockPrisma.claim.update.mockResolvedValue({});
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.PARTIALLY_REFUNDED,
        deductions: 700,
        refundableAmount: 2300,
        refundedAmount: 2300,
      });

      const result = await service.finalizeRefund('dep-001', {
        refundRef: 'REF-FINAL-001',
        notes: 'End of tenancy finalization',
      }, 'admin-001');

      // Verify claims were settled
      expect(mockPrisma.claim.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'claim-001' },
          data: expect.objectContaining({
            status: ClaimStatus.SETTLED,
            settlementMethod: 'DEPOSIT_DEDUCTION',
          }),
        }),
      );

      // Verify deposit updated
      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deductions: 700,
            refundableAmount: 2300,
            status: DepositStatus.PARTIALLY_REFUNDED,
            refundedAmount: 2300,
            refundRef: 'REF-FINAL-001',
          }),
        }),
      );

      expect(result.claimsApplied).toHaveLength(2);
      expect(result.totalDeductions).toBe(700);
      expect(result.refundedAmount).toBe(2300);

      // Verify event emitted
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'deposit.finalized',
        expect.objectContaining({
          depositId: 'dep-001',
          totalDeductions: 700,
          refundedAmount: 2300,
          claimsApplied: 2,
        }),
      );
    });

    it('should finalize deposit with no claims (full refund)', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: terminatedTenancy,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findMany.mockResolvedValue([]); // No approved claims
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.FULLY_REFUNDED,
        refundedAmount: 3000,
      });

      const result = await service.finalizeRefund('dep-001', {
        refundRef: 'REF-FULL-001',
      }, 'admin-001');

      expect(result.claimsApplied).toHaveLength(0);
      expect(result.totalDeductions).toBe(0);
      expect(result.refundedAmount).toBe(3000);
      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DepositStatus.FULLY_REFUNDED,
            refundedAmount: 3000,
          }),
        }),
      );
    });

    it('should forfeit deposit when claims consume entire amount', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: terminatedTenancy,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findMany.mockResolvedValue([
        {
          id: 'claim-big',
          claimNumber: 'CLM-BIG',
          type: 'DAMAGE',
          title: 'Major damage',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(3000),
          claimedAmount: new Decimal(3000),
          reviewNotes: null,
          submittedAt: new Date(),
        },
      ]);
      mockPrisma.claim.update.mockResolvedValue({});
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.FORFEITED,
        deductions: 3000,
        refundableAmount: 0,
        refundedAmount: 0,
      });

      const result = await service.finalizeRefund('dep-001', {}, 'admin-001');

      expect(result.refundedAmount).toBe(0);
      expect(result.totalDeductions).toBe(3000);
      expect(mockPrisma.deposit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DepositStatus.FORFEITED,
            refundedAmount: 0,
          }),
        }),
      );
    });

    it('should cap deductions at deposit amount when claims exceed it', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        deductionClaims: null,
        tenancy: terminatedTenancy,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findMany.mockResolvedValue([
        {
          id: 'claim-1',
          claimNumber: 'CLM-1',
          type: 'DAMAGE',
          title: 'Damage 1',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(2000),
          claimedAmount: new Decimal(2000),
          reviewNotes: null,
          submittedAt: new Date('2026-02-20'),
        },
        {
          id: 'claim-2',
          claimNumber: 'CLM-2',
          type: 'CLEANING',
          title: 'Cleaning',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(2000),
          claimedAmount: new Decimal(2000),
          reviewNotes: null,
          submittedAt: new Date('2026-02-21'),
        },
      ]);
      mockPrisma.claim.update.mockResolvedValue({});
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.FORFEITED,
      });

      const result = await service.finalizeRefund('dep-001', {}, 'admin-001');

      // First claim: 2000 deducted, second claim: only 1000 (deposit is 3000)
      expect(result.claimsApplied).toHaveLength(2);
      expect(result.claimsApplied[0].amount).toBe(2000);
      expect(result.claimsApplied[1].amount).toBe(1000); // capped
      expect(result.totalDeductions).toBe(3000);
      expect(mockPrisma.claim.update).toHaveBeenCalledTimes(2);
    });

    it('should skip already-linked claims', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.HELD,
        deductionClaims: [
          { claimId: 'claim-old', description: 'Old', amount: 200, addedAt: new Date() },
        ],
        tenancy: terminatedTenancy,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);
      mockPrisma.claim.findMany.mockResolvedValue([
        {
          id: 'claim-old', // already linked
          claimNumber: 'CLM-OLD',
          type: 'DAMAGE',
          title: 'Old damage',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(200),
          claimedAmount: new Decimal(200),
          reviewNotes: null,
          submittedAt: new Date('2026-02-19'),
        },
        {
          id: 'claim-new',
          claimNumber: 'CLM-NEW',
          type: 'CLEANING',
          title: 'New cleaning',
          status: ClaimStatus.APPROVED,
          approvedAmount: new Decimal(300),
          claimedAmount: new Decimal(300),
          reviewNotes: null,
          submittedAt: new Date('2026-02-21'),
        },
      ]);
      mockPrisma.claim.update.mockResolvedValue({});
      mockPrisma.deposit.update.mockResolvedValue({
        ...deposit,
        status: DepositStatus.PARTIALLY_REFUNDED,
      });

      const result = await service.finalizeRefund('dep-001', {}, 'admin-001');

      // Only the new claim should be applied
      expect(result.claimsApplied).toHaveLength(1);
      expect(result.claimsApplied[0].claimId).toBe('claim-new');
      // Only new claim settled (old one already settled)
      expect(mockPrisma.claim.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'claim-new' },
        }),
      );
    });

    it('should reject finalize on PENDING deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.PENDING,
        tenancy: terminatedTenancy,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.finalizeRefund('dep-001', {}, 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject finalize when tenancy not TERMINATED', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.COLLECTED,
        tenancy: {
          ...terminatedTenancy,
          status: TenancyStatus.ACTIVE,
        },
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.finalizeRefund('dep-001', {}, 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject finalize on already refunded deposit', async () => {
      const deposit = createMockDeposit({
        status: DepositStatus.FULLY_REFUNDED,
        tenancy: terminatedTenancy,
      });
      mockPrisma.deposit.findFirst.mockResolvedValue(deposit);

      await expect(
        service.finalizeRefund('dep-001', {}, 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
