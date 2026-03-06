/**
 * AgentService Unit Tests
 * Session 8.2 - Agent Module
 *
 * Tests agent registration, profile updates, listing assignment/unassignment,
 * referral code generation, suspend/reactivate.
 */

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AgentStatus } from '@prisma/client';
import { AgentService } from './agent.service';

describe('AgentService', () => {
  let service: AgentService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockEventEmitter: any;

  // Helper: create a mock agent
  const createMockAgent = (overrides: Partial<any> = {}) => ({
    id: 'agent-001',
    companyId: 'company-001',
    userId: 'user-001',
    renNumber: 'REN-12345',
    renExpiry: new Date('2027-12-31'),
    totalListings: 5,
    totalDeals: 3,
    totalRevenue: 150000,
    referralCode: 'ABC12345',
    referredBy: null,
    status: AgentStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    company: { id: 'company-001', name: 'ABC Realty', type: 'AGENCY' },
    user: {
      id: 'user-001',
      fullName: 'Ali Agent',
      email: 'ali@test.com',
      phone: '+60123456789',
    },
    agentListings: [],
    ...overrides,
  });

  // Helper: create a mock agent listing
  const createMockAgentListing = (overrides: Partial<any> = {}) => ({
    id: 'al-001',
    agentId: 'agent-001',
    listingId: 'listing-001',
    assignedAt: new Date(),
    removedAt: null,
    listing: {
      id: 'listing-001',
      title: 'Beautiful Condo',
      status: 'PUBLISHED',
      price: 500000,
    },
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      agent: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      agentListing: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      company: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      listing: {
        findFirst: jest.fn(),
      },
    };

    mockPartnerContext = {
      getContext: jest.fn().mockReturnValue({ partnerId: 'partner-001' }),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new AgentService(
      mockPrisma,
      mockPartnerContext,
      mockEventEmitter,
    );
  });

  // ========================================
  // registerAgent
  // ========================================

  describe('registerAgent', () => {
    const dto = {
      companyId: 'company-001',
      userId: 'user-001',
      renNumber: 'REN-12345',
      renExpiry: '2027-12-31',
    };

    it('should register a new agent with referral code', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-001', partnerId: 'partner-001' });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-001', partnerId: 'partner-001', fullName: 'Ali' });
      mockPrisma.agent.findFirst.mockResolvedValue(null); // no duplicate
      const mockAgent = createMockAgent();
      mockPrisma.agent.create.mockResolvedValue(mockAgent);

      const result = await service.registerAgent(dto);

      expect(result).toEqual(mockAgent);
      expect(mockPrisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: 'company-001',
            userId: 'user-001',
            renNumber: 'REN-12345',
            status: AgentStatus.ACTIVE,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'agent.registered',
        expect.objectContaining({
          agentId: 'agent-001',
          companyId: 'company-001',
          userId: 'user-001',
        }),
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(service.registerAgent(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-001' });
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.registerAgent(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate agent', async () => {
      mockPrisma.company.findFirst.mockResolvedValue({ id: 'company-001' });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-001', fullName: 'Ali' });
      mockPrisma.agent.findFirst
        .mockResolvedValueOnce(createMockAgent()) // duplicate check
        ;

      await expect(service.registerAgent(dto)).rejects.toThrow(ConflictException);
    });

    it('should register an independent agent (no companyId)', async () => {
      const independentDto = {
        userId: 'user-002',
        renNumber: 'REN-SOLO',
      };
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: 'partner-001', fullName: 'Solo' });
      mockPrisma.agent.findFirst.mockResolvedValue(null); // no duplicate
      const mockAgent = createMockAgent({ companyId: null, company: null, userId: 'user-002' });
      mockPrisma.agent.create.mockResolvedValue(mockAgent);

      const result = await service.registerAgent(independentDto);

      expect(result.companyId).toBeNull();
      expect(mockPrisma.company.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: null,
            userId: 'user-002',
          }),
        }),
      );
    });
  });

  // ========================================
  // getAgent
  // ========================================

  describe('getAgent', () => {
    it('should return agent by ID within partner scope', async () => {
      const mockAgent = createMockAgent();
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);

      const result = await service.getAgent('agent-001');

      expect(result).toEqual(mockAgent);
      expect(mockPrisma.agent.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'agent-001',
          deletedAt: null,
          user: { partnerId: 'partner-001' },
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.getAgent('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // listAgents
  // ========================================

  describe('listAgents', () => {
    it('should return paginated list of agents', async () => {
      const agents = [createMockAgent()];
      mockPrisma.agent.findMany.mockResolvedValue(agents);
      mockPrisma.agent.count.mockResolvedValue(1);

      const result = await service.listAgents({ page: 1, limit: 20 });

      expect(result.data).toEqual(agents);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply companyId filter', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await service.listAgents({ companyId: 'company-001', page: 1, limit: 20 });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-001',
          }),
        }),
      );
    });

    it('should apply status filter', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await service.listAgents({
        status: AgentStatus.ACTIVE,
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AgentStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should apply isIndependent=true filter', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await service.listAgents({ isIndependent: true, page: 1, limit: 20 });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: null,
          }),
        }),
      );
    });

    it('should apply isIndependent=false filter', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await service.listAgents({ isIndependent: false, page: 1, limit: 20 });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: { not: null },
          }),
        }),
      );
    });

    it('should apply search filter', async () => {
      mockPrisma.agent.findMany.mockResolvedValue([]);
      mockPrisma.agent.count.mockResolvedValue(0);

      await service.listAgents({ search: 'Ali', page: 1, limit: 20 });

      expect(mockPrisma.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { user: { fullName: { contains: 'Ali', mode: 'insensitive' } } },
              { renNumber: { contains: 'Ali', mode: 'insensitive' } },
              { referralCode: { contains: 'Ali', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  // ========================================
  // updateAgentProfile
  // ========================================

  describe('updateAgentProfile', () => {
    it('should update agent REN number', async () => {
      const mockAgent = createMockAgent();
      mockPrisma.agent.findFirst.mockResolvedValue(mockAgent);
      const updated = createMockAgent({ renNumber: 'REN-99999' });
      mockPrisma.agent.update.mockResolvedValue(updated);

      const result = await service.updateAgentProfile('agent-001', {
        renNumber: 'REN-99999',
      });

      expect(result.renNumber).toBe('REN-99999');
      expect(mockPrisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'agent-001' },
          data: expect.objectContaining({ renNumber: 'REN-99999' }),
        }),
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAgentProfile('nonexistent', { renNumber: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // assignToListing
  // ========================================

  describe('assignToListing', () => {
    const dto = { listingId: 'listing-001' };

    it('should assign agent to listing', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(createMockAgent());
      mockPrisma.listing.findFirst.mockResolvedValue({ id: 'listing-001', partnerId: 'partner-001' });
      mockPrisma.agentListing.findFirst.mockResolvedValue(null); // no existing
      const mockAssignment = createMockAgentListing();
      mockPrisma.agentListing.create.mockResolvedValue(mockAssignment);
      mockPrisma.agent.update.mockResolvedValue(createMockAgent({ totalListings: 6 }));

      const result = await service.assignToListing('agent-001', dto);

      expect(result).toEqual(mockAssignment);
      expect(mockPrisma.agentListing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { agentId: 'agent-001', listingId: 'listing-001' },
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'agent.listing.assigned',
        expect.objectContaining({
          agentId: 'agent-001',
          listingId: 'listing-001',
        }),
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.assignToListing('nonexistent', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if listing not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(createMockAgent());
      mockPrisma.listing.findFirst.mockResolvedValue(null);

      await expect(service.assignToListing('agent-001', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already assigned', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(createMockAgent());
      mockPrisma.listing.findFirst.mockResolvedValue({ id: 'listing-001' });
      mockPrisma.agentListing.findFirst.mockResolvedValue(createMockAgentListing());

      await expect(service.assignToListing('agent-001', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ========================================
  // unassignFromListing
  // ========================================

  describe('unassignFromListing', () => {
    it('should soft-remove a listing assignment', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(createMockAgent());
      mockPrisma.agentListing.findFirst.mockResolvedValue(createMockAgentListing());
      mockPrisma.agentListing.update.mockResolvedValue({});
      mockPrisma.agent.update.mockResolvedValue(createMockAgent({ totalListings: 4 }));

      await service.unassignFromListing('agent-001', 'listing-001');

      expect(mockPrisma.agentListing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'al-001' },
          data: { removedAt: expect.any(Date) },
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'agent.listing.unassigned',
        expect.objectContaining({
          agentId: 'agent-001',
          listingId: 'listing-001',
        }),
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.unassignFromListing('nonexistent', 'listing-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(createMockAgent());
      mockPrisma.agentListing.findFirst.mockResolvedValue(null);

      await expect(
        service.unassignFromListing('agent-001', 'listing-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // getAgentListings
  // ========================================

  describe('getAgentListings', () => {
    it('should return active listing assignments', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(createMockAgent());
      const listings = [
        createMockAgentListing(),
        createMockAgentListing({ id: 'al-002', listingId: 'listing-002' }),
      ];
      mockPrisma.agentListing.findMany.mockResolvedValue(listings);

      const result = await service.getAgentListings('agent-001');

      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.getAgentListings('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ========================================
  // suspendAgent
  // ========================================

  describe('suspendAgent', () => {
    it('should suspend an active agent', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(
        createMockAgent({ status: AgentStatus.ACTIVE }),
      );
      mockPrisma.agent.update.mockResolvedValue(
        createMockAgent({ status: AgentStatus.SUSPENDED }),
      );

      const result = await service.suspendAgent('agent-001');

      expect(result.status).toBe(AgentStatus.SUSPENDED);
    });

    it('should throw BadRequestException if already suspended', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(
        createMockAgent({ status: AgentStatus.SUSPENDED }),
      );

      await expect(service.suspendAgent('agent-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.suspendAgent('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ========================================
  // reactivateAgent
  // ========================================

  describe('reactivateAgent', () => {
    it('should reactivate a suspended agent', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(
        createMockAgent({ status: AgentStatus.SUSPENDED }),
      );
      mockPrisma.agent.update.mockResolvedValue(
        createMockAgent({ status: AgentStatus.ACTIVE }),
      );

      const result = await service.reactivateAgent('agent-001');

      expect(result.status).toBe(AgentStatus.ACTIVE);
    });

    it('should throw BadRequestException if already active', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(
        createMockAgent({ status: AgentStatus.ACTIVE }),
      );

      await expect(service.reactivateAgent('agent-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.reactivateAgent('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ========================================
  // generateReferralCode
  // ========================================

  describe('generateReferralCode', () => {
    it('should generate a unique 8-char hex code', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null); // unique

      const code = await service.generateReferralCode();

      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[0-9A-F]{8}$/);
    });

    it('should retry on collision', async () => {
      mockPrisma.agent.findFirst
        .mockResolvedValueOnce(createMockAgent()) // first collision
        .mockResolvedValueOnce(null); // second attempt is unique

      const code = await service.generateReferralCode();

      expect(code).toHaveLength(8);
      expect(mockPrisma.agent.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  // ========================================
  // regenerateReferralCode
  // ========================================

  describe('regenerateReferralCode', () => {
    it('should regenerate the referral code for an existing agent', async () => {
      mockPrisma.agent.findFirst
        .mockResolvedValueOnce(createMockAgent()) // exists check
        .mockResolvedValueOnce(null); // unique code check
      const updated = createMockAgent({ referralCode: 'NEWCODE1' });
      mockPrisma.agent.update.mockResolvedValue(updated);

      const result = await service.regenerateReferralCode('agent-001');

      expect(result.referralCode).toBe('NEWCODE1');
      expect(mockPrisma.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'agent-001' },
          data: expect.objectContaining({ referralCode: expect.any(String) }),
        }),
      );
    });

    it('should throw NotFoundException if agent not found', async () => {
      mockPrisma.agent.findFirst.mockResolvedValue(null);

      await expect(service.regenerateReferralCode('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
