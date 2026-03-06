/**
 * AffiliateService Unit Tests
 * Session 8.4 - Affiliate Module
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateService } from './affiliate.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

// ============================================
// MOCK SETUP
// ============================================

const mockpartnerId = 'partner-001';

const mockUser = {
  id: 'user-001',
  partnerId: mockpartnerId,
  fullName: 'John Doe',
  email: 'john@test.com',
};

const mockAffiliate = {
  id: 'affiliate-001',
  partnerId: mockpartnerId,
  userId: 'user-001',
  code: 'REFABC12345',
  type: 'INDIVIDUAL',
  bankName: 'Maybank',
  bankAccount: '1234567890',
  bankAccountName: 'John Doe',
  totalReferrals: 3,
  totalEarnings: new Prisma.Decimal(500),
  unpaidEarnings: new Prisma.Decimal(200),
  status: 'ACTIVE',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'user-001', fullName: 'John Doe', email: 'john@test.com' },
};

const mockReferral = {
  id: 'referral-001',
  affiliateId: 'affiliate-001',
  referralType: 'OWNER_REGISTRATION',
  referredId: 'vendor-001',
  commissionRate: new Prisma.Decimal(0),
  commissionAmount: new Prisma.Decimal(200),
  status: 'PENDING',
  confirmedAt: null,
  paidAt: null,
  notes: null,
  createdAt: new Date(),
};

const mockConfirmedReferral = {
  ...mockReferral,
  status: 'CONFIRMED',
  confirmedAt: new Date(),
};

const mockPayout = {
  id: 'payout-001',
  affiliateId: 'affiliate-001',
  amount: new Prisma.Decimal(200),
  status: 'PROCESSING',
  processedAt: null,
  reference: null,
  notes: null,
  createdAt: new Date(),
};

// ============================================
// PRISMA MOCK
// ============================================

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
  },
  affiliate: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  affiliateReferral: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  affiliatePayout: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tenancy: {
    findUnique: jest.fn(),
  },
};

const mockPartnerContext = {
  getContext: jest.fn().mockReturnValue({ partnerId: mockpartnerId }),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

// ============================================
// TEST SUITE
// ============================================

describe('AffiliateService', () => {
  let service: AffiliateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffiliateService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PartnerContextService, useValue: mockPartnerContext },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AffiliateService>(AffiliateService);
    jest.clearAllMocks();
    mockPartnerContext.getContext.mockReturnValue({ partnerId: mockpartnerId });
  });

  // ============================================
  // createAffiliate
  // ============================================

  describe('createAffiliate', () => {
    it('should create an affiliate with unique code', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.affiliate.findUnique
        .mockResolvedValueOnce(null) // partnerId_userId
        .mockResolvedValueOnce(null); // code check
      mockPrisma.affiliate.create.mockResolvedValue(mockAffiliate);

      const result = await service.createAffiliate({
        userId: 'user-001',
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-001');
      expect(mockPrisma.affiliate.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'affiliate.created',
        expect.objectContaining({ userId: 'user-001' }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.createAffiliate({ userId: 'user-999' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already an affiliate', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.affiliate.findUnique.mockResolvedValue(mockAffiliate);

      await expect(
        service.createAffiliate({ userId: 'user-001' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create with COMPANY type when specified', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.affiliate.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.affiliate.create.mockResolvedValue({
        ...mockAffiliate,
        type: 'COMPANY',
      });

      const result = await service.createAffiliate({
        userId: 'user-001',
        type: 'COMPANY' as any,
      });

      expect(result.type).toBe('COMPANY');
    });
  });

  // ============================================
  // getAffiliate
  // ============================================

  describe('getAffiliate', () => {
    it('should return affiliate by id', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);

      const result = await service.getAffiliate('affiliate-001');

      expect(result).toBeDefined();
      expect(result.id).toBe('affiliate-001');
      expect(result.code).toBe('REFABC12345');
    });

    it('should throw NotFoundException if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(service.getAffiliate('affiliate-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // getAffiliateByCode
  // ============================================

  describe('getAffiliateByCode', () => {
    it('should return affiliate by code', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);

      const result = await service.getAffiliateByCode('REFABC12345');

      expect(result).toBeDefined();
      expect(result.code).toBe('REFABC12345');
    });

    it('should throw NotFoundException if code not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(service.getAffiliateByCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // listAffiliates
  // ============================================

  describe('listAffiliates', () => {
    it('should return paginated list of affiliates', async () => {
      mockPrisma.affiliate.findMany.mockResolvedValue([mockAffiliate]);
      mockPrisma.affiliate.count.mockResolvedValue(1);

      const result = await service.listAffiliates({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.affiliate.findMany.mockResolvedValue([]);
      mockPrisma.affiliate.count.mockResolvedValue(0);

      await service.listAffiliates({ status: 'ACTIVE' as any });

      expect(mockPrisma.affiliate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
    });
  });

  // ============================================
  // updateAffiliate
  // ============================================

  describe('updateAffiliate', () => {
    it('should update affiliate bank details', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliate.update.mockResolvedValue({
        ...mockAffiliate,
        bankName: 'CIMB',
      });

      const result = await service.updateAffiliate('affiliate-001', {
        bankName: 'CIMB',
      });

      expect(result.bankName).toBe('CIMB');
    });

    it('should throw NotFoundException if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAffiliate('affiliate-999', { bankName: 'CIMB' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // deactivateAffiliate
  // ============================================

  describe('deactivateAffiliate', () => {
    it('should deactivate an active affiliate', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliate.update.mockResolvedValue({
        ...mockAffiliate,
        status: 'INACTIVE',
      });

      const result = await service.deactivateAffiliate('affiliate-001');

      expect(result.status).toBe('INACTIVE');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'affiliate.deactivated',
        expect.objectContaining({ affiliateId: 'affiliate-001' }),
      );
    });

    it('should throw BadRequestException if already inactive', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue({
        ...mockAffiliate,
        status: 'INACTIVE',
      });

      await expect(
        service.deactivateAffiliate('affiliate-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.deactivateAffiliate('affiliate-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // trackReferral
  // ============================================

  describe('trackReferral', () => {
    it('should track an OWNER_REGISTRATION referral with flat amount', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(null);
      mockPrisma.affiliateReferral.create.mockResolvedValue(mockReferral);
      mockPrisma.affiliate.update.mockResolvedValue(mockAffiliate);

      const result = await service.trackReferral({
        affiliateId: 'affiliate-001',
        referralType: 'OWNER_REGISTRATION' as any,
        referredId: 'vendor-001',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.affiliateReferral.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referralType: 'OWNER_REGISTRATION',
            commissionAmount: 200, // flat amount
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'affiliate.referral.created',
        expect.any(Object),
      );
    });

    it('should track a TENANT_BOOKING referral with percentage', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(null);
      mockPrisma.tenancy.findUnique.mockResolvedValue({
        id: 'tenancy-001',
        monthlyRent: new Prisma.Decimal(2000),
      });
      mockPrisma.affiliateReferral.create.mockResolvedValue({
        ...mockReferral,
        referralType: 'TENANT_BOOKING',
        commissionAmount: new Prisma.Decimal(100),
      });
      mockPrisma.affiliate.update.mockResolvedValue(mockAffiliate);

      const result = await service.trackReferral({
        affiliateId: 'affiliate-001',
        referralType: 'TENANT_BOOKING' as any,
        referredId: 'tenancy-001',
      });

      expect(result).toBeDefined();
      // 5% of 2000 = 100
      expect(mockPrisma.affiliateReferral.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referralType: 'TENANT_BOOKING',
            commissionAmount: 100,
          }),
        }),
      );
    });

    it('should throw NotFoundException if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.trackReferral({
          affiliateId: 'affiliate-999',
          referralType: 'OWNER_REGISTRATION' as any,
          referredId: 'vendor-001',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if affiliate is not active', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue({
        ...mockAffiliate,
        status: 'INACTIVE',
      });

      await expect(
        service.trackReferral({
          affiliateId: 'affiliate-001',
          referralType: 'OWNER_REGISTRATION' as any,
          referredId: 'vendor-001',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if referral already exists', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);

      await expect(
        service.trackReferral({
          affiliateId: 'affiliate-001',
          referralType: 'OWNER_REGISTRATION' as any,
          referredId: 'vendor-001',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should use custom commission amount when provided', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(null);
      mockPrisma.affiliateReferral.create.mockResolvedValue({
        ...mockReferral,
        commissionAmount: new Prisma.Decimal(500),
      });
      mockPrisma.affiliate.update.mockResolvedValue(mockAffiliate);

      await service.trackReferral({
        affiliateId: 'affiliate-001',
        referralType: 'OWNER_REGISTRATION' as any,
        referredId: 'vendor-001',
        commissionAmount: 500,
      });

      expect(mockPrisma.affiliateReferral.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commissionAmount: 500,
          }),
        }),
      );
    });
  });

  // ============================================
  // confirmReferral
  // ============================================

  describe('confirmReferral', () => {
    it('should confirm a pending referral', async () => {
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);
      mockPrisma.affiliateReferral.update.mockResolvedValue(mockConfirmedReferral);
      mockPrisma.affiliate.update.mockResolvedValue(mockAffiliate);

      const result = await service.confirmReferral('referral-001');

      expect(result.status).toBe('CONFIRMED');
      expect(mockPrisma.affiliate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unpaidEarnings: { increment: 200 },
            totalEarnings: { increment: 200 },
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'affiliate.referral.confirmed',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if referral not found', async () => {
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(null);

      await expect(service.confirmReferral('referral-999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if referral is not PENDING', async () => {
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(mockConfirmedReferral);

      await expect(service.confirmReferral('referral-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================
  // listReferrals
  // ============================================

  describe('listReferrals', () => {
    it('should return paginated referrals for affiliate', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findMany.mockResolvedValue([mockReferral]);
      mockPrisma.affiliateReferral.count.mockResolvedValue(1);

      const result = await service.listReferrals('affiliate-001', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by referral type', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findMany.mockResolvedValue([]);
      mockPrisma.affiliateReferral.count.mockResolvedValue(0);

      await service.listReferrals('affiliate-001', {
        referralType: 'OWNER_REGISTRATION' as any,
      });

      expect(mockPrisma.affiliateReferral.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            referralType: 'OWNER_REGISTRATION',
          }),
        }),
      );
    });

    it('should throw NotFoundException if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.listReferrals('affiliate-999', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // calculateEarnings
  // ============================================

  describe('calculateEarnings', () => {
    it('should return earnings summary', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.count
        .mockResolvedValueOnce(2) // PENDING
        .mockResolvedValueOnce(1) // CONFIRMED
        .mockResolvedValueOnce(3); // PAID
      mockPrisma.affiliateReferral.groupBy.mockResolvedValue([
        {
          referralType: 'OWNER_REGISTRATION',
          _count: 3,
          _sum: { commissionAmount: new Prisma.Decimal(600) },
        },
        {
          referralType: 'TENANT_BOOKING',
          _count: 1,
          _sum: { commissionAmount: new Prisma.Decimal(100) },
        },
      ]);

      const result = await service.calculateEarnings('affiliate-001');

      expect(result.totalEarnings).toEqual(new Prisma.Decimal(500));
      expect(result.unpaidEarnings).toEqual(new Prisma.Decimal(200));
      expect(result.pendingReferrals).toBe(2);
      expect(result.confirmedReferrals).toBe(1);
      expect(result.paidReferrals).toBe(3);
      expect(result.byType).toHaveLength(2);
    });

    it('should throw NotFoundException if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.calculateEarnings('affiliate-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // processPayout
  // ============================================

  describe('processPayout', () => {
    it('should create payout and mark referrals as paid', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliatePayout.create.mockResolvedValue(mockPayout);
      mockPrisma.affiliateReferral.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.affiliate.update.mockResolvedValue({
        ...mockAffiliate,
        unpaidEarnings: new Prisma.Decimal(0),
      });

      const result = await service.processPayout('affiliate-001', {
        reference: 'BANK-REF-001',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.affiliatePayout.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            affiliateId: 'affiliate-001',
            amount: 200, // unpaidEarnings
            status: 'PROCESSING',
          }),
        }),
      );
      expect(mockPrisma.affiliateReferral.updateMany).toHaveBeenCalled();
      expect(mockPrisma.affiliate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { unpaidEarnings: 0 },
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'affiliate.payout.created',
        expect.any(Object),
      );
    });

    it('should throw BadRequestException if no unpaid earnings', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue({
        ...mockAffiliate,
        unpaidEarnings: new Prisma.Decimal(0),
      });

      await expect(
        service.processPayout('affiliate-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(
        service.processPayout('affiliate-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // completePayout
  // ============================================

  describe('completePayout', () => {
    it('should complete a processing payout', async () => {
      mockPrisma.affiliatePayout.findFirst.mockResolvedValue(mockPayout);
      mockPrisma.affiliatePayout.update.mockResolvedValue({
        ...mockPayout,
        status: 'COMPLETED',
        processedAt: new Date(),
      });

      const result = await service.completePayout('payout-001', {
        reference: 'BANK-REF-001',
      });

      expect(result.status).toBe('COMPLETED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'affiliate.payout.completed',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if payout not found', async () => {
      mockPrisma.affiliatePayout.findFirst.mockResolvedValue(null);

      await expect(
        service.completePayout('payout-999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payout is not PROCESSING', async () => {
      mockPrisma.affiliatePayout.findFirst.mockResolvedValue({
        ...mockPayout,
        status: 'COMPLETED',
      });

      await expect(
        service.completePayout('payout-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // listPayouts
  // ============================================

  describe('listPayouts', () => {
    it('should return list of payouts', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliatePayout.findMany.mockResolvedValue([mockPayout]);

      const result = await service.listPayouts('affiliate-001');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('payout-001');
    });

    it('should throw NotFoundException if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await expect(service.listPayouts('affiliate-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // handleVendorApproved (Event Handler)
  // ============================================

  describe('handleVendorApproved', () => {
    it('should auto-track OWNER_REGISTRATION referral', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(null);
      mockPrisma.affiliateReferral.create.mockResolvedValue(mockReferral);
      mockPrisma.affiliate.update.mockResolvedValue(mockAffiliate);

      await service.handleVendorApproved({
        vendorId: 'vendor-001',
        referralCode: 'REFABC12345',
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.affiliateReferral.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referralType: 'OWNER_REGISTRATION',
            referredId: 'vendor-001',
            commissionAmount: 200,
          }),
        }),
      );
    });

    it('should skip if no referral code', async () => {
      await service.handleVendorApproved({
        vendorId: 'vendor-001',
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.affiliate.findFirst).not.toHaveBeenCalled();
    });

    it('should skip if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await service.handleVendorApproved({
        vendorId: 'vendor-001',
        referralCode: 'INVALID',
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.affiliateReferral.create).not.toHaveBeenCalled();
    });

    it('should skip if referral already exists', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(mockReferral);

      await service.handleVendorApproved({
        vendorId: 'vendor-001',
        referralCode: 'REFABC12345',
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.affiliateReferral.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // handleTenancyActivated (Event Handler)
  // ============================================

  describe('handleTenancyActivated', () => {
    it('should auto-track TENANT_BOOKING referral', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(mockAffiliate);
      mockPrisma.affiliateReferral.findFirst.mockResolvedValue(null);
      mockPrisma.tenancy.findUnique.mockResolvedValue({
        id: 'tenancy-001',
        monthlyRent: new Prisma.Decimal(2000),
      });
      mockPrisma.affiliateReferral.create.mockResolvedValue({
        ...mockReferral,
        referralType: 'TENANT_BOOKING',
        commissionAmount: new Prisma.Decimal(100),
      });
      mockPrisma.affiliate.update.mockResolvedValue(mockAffiliate);

      await service.handleTenancyActivated({
        tenancyId: 'tenancy-001',
        referralCode: 'REFABC12345',
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.affiliateReferral.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referralType: 'TENANT_BOOKING',
            referredId: 'tenancy-001',
            commissionAmount: 100, // 5% of 2000
          }),
        }),
      );
    });

    it('should skip if no referral code', async () => {
      await service.handleTenancyActivated({
        tenancyId: 'tenancy-001',
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.affiliate.findFirst).not.toHaveBeenCalled();
    });

    it('should skip if affiliate not found', async () => {
      mockPrisma.affiliate.findFirst.mockResolvedValue(null);

      await service.handleTenancyActivated({
        tenancyId: 'tenancy-001',
        referralCode: 'INVALID',
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.affiliateReferral.create).not.toHaveBeenCalled();
    });
  });
});
