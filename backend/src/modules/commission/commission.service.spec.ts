/**
 * CommissionService Unit Tests
 * Session 8.3 - Agent Commission
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from './commission.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// ============================================
// MOCK SETUP
// ============================================

const mockpartnerId = 'partner-001';

const mockAgent = {
  id: 'agent-001',
  companyId: 'company-001',
  userId: 'user-001',
  renNumber: 'REN12345',
  deletedAt: null,
  company: { partnerId: mockpartnerId },
};

const mockTenancy = {
  id: 'tenancy-001',
  partnerId: mockpartnerId,
  listingId: 'listing-001',
  monthlyRent: new Prisma.Decimal(2000),
  status: 'ACTIVE',
  listing: { id: 'listing-001', title: 'Unit A-01' },
};

const mockCommission = {
  id: 'commission-001',
  agentId: 'agent-001',
  tenancyId: 'tenancy-001',
  type: 'BOOKING',
  dealValue: new Prisma.Decimal(2000),
  rate: new Prisma.Decimal(1),
  amount: new Prisma.Decimal(2000),
  status: 'PENDING',
  approvedBy: null,
  approvedAt: null,
  paidAt: null,
  paidRef: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  agent: {
    id: 'agent-001',
    renNumber: 'REN12345',
    user: { id: 'user-001', fullName: 'John Agent', email: 'john@test.com' },
    company: { id: 'company-001', name: 'ABC Realty' },
  },
  tenancy: {
    id: 'tenancy-001',
    status: 'ACTIVE',
    monthlyRent: new Prisma.Decimal(2000),
    listing: { id: 'listing-001', title: 'Unit A-01' },
  },
};

const mockApprovedCommission = {
  ...mockCommission,
  status: 'APPROVED',
  approvedBy: 'admin-001',
  approvedAt: new Date(),
};

const mockPaidCommission = {
  ...mockApprovedCommission,
  status: 'PAID',
  paidAt: new Date(),
  paidRef: 'PAY-001',
};

const mockPrismaService = {
  agent: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  tenancy: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  agentCommission: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  agentListing: {
    findFirst: jest.fn(),
  },
};

const mockPartnerContext = {
  getContext: jest.fn().mockReturnValue({ partnerId: mockpartnerId }),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

describe('CommissionService', () => {
  let service: CommissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PartnerContextService, useValue: mockPartnerContext },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);

    // Reset all mocks
    jest.clearAllMocks();
    mockPartnerContext.getContext.mockReturnValue({ partnerId: mockpartnerId });
  });

  // ============================================
  // calculateCommission
  // ============================================

  describe('calculateCommission', () => {
    it('should create a new commission with default BOOKING rate', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.tenancy.findFirst.mockResolvedValue(mockTenancy);
      mockPrismaService.agentCommission.create.mockResolvedValue(mockCommission);

      const result = await service.calculateCommission({
        agentId: 'agent-001',
        tenancyId: 'tenancy-001',
        type: 'BOOKING' as any,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('commission-001');
      expect(mockPrismaService.agentCommission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'agent-001',
            tenancyId: 'tenancy-001',
            type: 'BOOKING',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'commission.created',
        expect.any(Object),
      );
    });

    it('should create a commission with custom rate', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.tenancy.findFirst.mockResolvedValue(mockTenancy);
      mockPrismaService.agentCommission.create.mockResolvedValue({
        ...mockCommission,
        rate: new Prisma.Decimal(1.5),
        amount: new Prisma.Decimal(3000),
      });

      const result = await service.calculateCommission({
        agentId: 'agent-001',
        tenancyId: 'tenancy-001',
        type: 'BOOKING' as any,
        rate: 1.5,
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.agentCommission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rate: new Prisma.Decimal(1.5),
            amount: new Prisma.Decimal(3000),
          }),
        }),
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.calculateCommission({
          agentId: 'nonexistent',
          tenancyId: 'tenancy-001',
          type: 'BOOKING' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if tenancy not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.calculateCommission({
          agentId: 'agent-001',
          tenancyId: 'nonexistent',
          type: 'BOOKING' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use RENEWAL default rate for RENEWAL type', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.tenancy.findFirst.mockResolvedValue(mockTenancy);
      mockPrismaService.agentCommission.create.mockResolvedValue({
        ...mockCommission,
        type: 'RENEWAL',
        rate: new Prisma.Decimal(0.5),
        amount: new Prisma.Decimal(1000),
      });

      await service.calculateCommission({
        agentId: 'agent-001',
        tenancyId: 'tenancy-001',
        type: 'RENEWAL' as any,
      });

      expect(mockPrismaService.agentCommission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RENEWAL',
            rate: new Prisma.Decimal(0.5),
            amount: new Prisma.Decimal(1000),
          }),
        }),
      );
    });
  });

  // ============================================
  // getCommission
  // ============================================

  describe('getCommission', () => {
    it('should return commission by ID', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockCommission);

      const result = await service.getCommission('commission-001');

      expect(result).toBeDefined();
      expect(result.id).toBe('commission-001');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(null);

      await expect(service.getCommission('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // listCommissions
  // ============================================

  describe('listCommissions', () => {
    it('should return paginated list of commissions', async () => {
      mockPrismaService.agentCommission.findMany.mockResolvedValue([mockCommission]);
      mockPrismaService.agentCommission.count.mockResolvedValue(1);

      const result = await service.listCommissions({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply agentId filter', async () => {
      mockPrismaService.agentCommission.findMany.mockResolvedValue([]);
      mockPrismaService.agentCommission.count.mockResolvedValue(0);

      await service.listCommissions({ agentId: 'agent-001' });

      expect(mockPrismaService.agentCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ agentId: 'agent-001' }),
        }),
      );
    });

    it('should apply status filter', async () => {
      mockPrismaService.agentCommission.findMany.mockResolvedValue([]);
      mockPrismaService.agentCommission.count.mockResolvedValue(0);

      await service.listCommissions({ status: 'PENDING' as any });

      expect(mockPrismaService.agentCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('should apply type filter', async () => {
      mockPrismaService.agentCommission.findMany.mockResolvedValue([]);
      mockPrismaService.agentCommission.count.mockResolvedValue(0);

      await service.listCommissions({ type: 'BOOKING' as any });

      expect(mockPrismaService.agentCommission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'BOOKING' }),
        }),
      );
    });
  });

  // ============================================
  // listAgentCommissions
  // ============================================

  describe('listAgentCommissions', () => {
    it('should return commissions for a specific agent', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.agentCommission.findMany.mockResolvedValue([mockCommission]);
      mockPrismaService.agentCommission.count.mockResolvedValue(1);

      const result = await service.listAgentCommissions('agent-001', {});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.listAgentCommissions('nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // approveCommission
  // ============================================

  describe('approveCommission', () => {
    it('should approve a pending commission', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockCommission);
      mockPrismaService.agentCommission.update.mockResolvedValue({
        ...mockCommission,
        status: 'APPROVED',
        approvedBy: 'admin-001',
        approvedAt: new Date(),
      });

      const result = await service.approveCommission('commission-001', 'admin-001');

      expect(result.status).toBe('APPROVED');
      expect(mockPrismaService.agentCommission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'commission-001' },
          data: expect.objectContaining({
            status: 'APPROVED',
            approvedBy: 'admin-001',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'commission.approved',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if commission not found', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(null);

      await expect(
        service.approveCommission('nonexistent', 'admin-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not PENDING', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockApprovedCommission);

      await expect(
        service.approveCommission('commission-001', 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should append approval notes', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockCommission);
      mockPrismaService.agentCommission.update.mockResolvedValue({
        ...mockCommission,
        status: 'APPROVED',
        notes: '[Approval] Good performance',
      });

      await service.approveCommission('commission-001', 'admin-001', {
        notes: 'Good performance',
      });

      expect(mockPrismaService.agentCommission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: '[Approval] Good performance',
          }),
        }),
      );
    });
  });

  // ============================================
  // markPaid
  // ============================================

  describe('markPaid', () => {
    it('should mark an approved commission as paid', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockApprovedCommission);
      mockPrismaService.agentCommission.update.mockResolvedValue(mockPaidCommission);
      mockPrismaService.agent.update.mockResolvedValue({});

      const result = await service.markPaid('commission-001', { paidRef: 'PAY-001' });

      expect(result.status).toBe('PAID');
      expect(mockPrismaService.agentCommission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PAID',
            paidRef: 'PAY-001',
          }),
        }),
      );
      // Should update agent stats
      expect(mockPrismaService.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'agent-001' },
          data: expect.objectContaining({
            totalRevenue: { increment: expect.anything() },
            totalDeals: { increment: 1 },
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'commission.paid',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if commission not found', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(null);

      await expect(service.markPaid('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if not APPROVED', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockCommission); // PENDING

      await expect(service.markPaid('commission-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================
  // cancelCommission
  // ============================================

  describe('cancelCommission', () => {
    it('should cancel a pending commission', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockCommission);
      mockPrismaService.agentCommission.update.mockResolvedValue({
        ...mockCommission,
        status: 'CANCELLED',
      });

      const result = await service.cancelCommission('commission-001');

      expect(result.status).toBe('CANCELLED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'commission.cancelled',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(null);

      await expect(service.cancelCommission('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if already PAID', async () => {
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockPaidCommission);

      await expect(service.cancelCommission('commission-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================
  // getAgentCommissionSummary
  // ============================================

  describe('getAgentCommissionSummary', () => {
    it('should return commission summary for agent', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.agentCommission.findMany.mockResolvedValue([
        { status: 'PENDING', amount: new Prisma.Decimal(2000) },
        { status: 'APPROVED', amount: new Prisma.Decimal(1500) },
        { status: 'PAID', amount: new Prisma.Decimal(3000) },
        { status: 'PAID', amount: new Prisma.Decimal(1000) },
      ]);

      const result = await service.getAgentCommissionSummary('agent-001');

      expect(result.totalCommissions).toBe(4);
      expect(result.totalAmount).toBe(7500);
      expect(result.pendingCount).toBe(1);
      expect(result.pendingAmount).toBe(2000);
      expect(result.approvedCount).toBe(1);
      expect(result.approvedAmount).toBe(1500);
      expect(result.paidCount).toBe(2);
      expect(result.paidAmount).toBe(4000);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.getAgentCommissionSummary('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // EVENT HANDLERS
  // ============================================

  describe('handleTenancyActivated', () => {
    it('should auto-create BOOKING commission when tenancy activated', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.agentListing.findFirst.mockResolvedValue({ agentId: 'agent-001' });
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(null);
      mockPrismaService.agentCommission.create.mockResolvedValue(mockCommission);

      await service.handleTenancyActivated({
        tenancyId: 'tenancy-001',
        partnerId: mockpartnerId,
      });

      expect(mockPrismaService.agentCommission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'agent-001',
            tenancyId: 'tenancy-001',
            type: 'BOOKING',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'commission.created',
        expect.any(Object),
      );
    });

    it('should skip if no agent assigned to listing', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.agentListing.findFirst.mockResolvedValue(null);

      await service.handleTenancyActivated({
        tenancyId: 'tenancy-001',
        partnerId: mockpartnerId,
      });

      expect(mockPrismaService.agentCommission.create).not.toHaveBeenCalled();
    });

    it('should skip if commission already exists', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.agentListing.findFirst.mockResolvedValue({ agentId: 'agent-001' });
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(mockCommission);

      await service.handleTenancyActivated({
        tenancyId: 'tenancy-001',
        partnerId: mockpartnerId,
      });

      expect(mockPrismaService.agentCommission.create).not.toHaveBeenCalled();
    });
  });

  describe('handleContractRenewed', () => {
    it('should auto-create RENEWAL commission when contract renewed', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.agentListing.findFirst.mockResolvedValue({ agentId: 'agent-001' });
      mockPrismaService.agentCommission.findFirst.mockResolvedValue(null);
      mockPrismaService.agentCommission.create.mockResolvedValue({
        ...mockCommission,
        type: 'RENEWAL',
        rate: new Prisma.Decimal(0.5),
        amount: new Prisma.Decimal(1000),
      });

      await service.handleContractRenewed({
        contractId: 'contract-001',
        tenancyId: 'tenancy-001',
        partnerId: mockpartnerId,
      });

      expect(mockPrismaService.agentCommission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RENEWAL',
            rate: new Prisma.Decimal(0.5),
          }),
        }),
      );
    });

    it('should skip if no agent assigned to listing', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.agentListing.findFirst.mockResolvedValue(null);

      await service.handleContractRenewed({
        contractId: 'contract-001',
        tenancyId: 'tenancy-001',
        partnerId: mockpartnerId,
      });

      expect(mockPrismaService.agentCommission.create).not.toHaveBeenCalled();
    });
  });
});
