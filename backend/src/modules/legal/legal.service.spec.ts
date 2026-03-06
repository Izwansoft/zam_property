/**
 * LegalService Unit Tests
 * Session 8.5 - Legal Module Core
 *
 * Tests for legal case management, panel lawyer management,
 * notice generation, status transitions, and event handlers.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { LegalCaseStatus } from '@prisma/client';
import { LegalService } from './legal.service';
import { PanelLawyerService } from './panel-lawyer.service';
import { NoticeGeneratorService } from './notice-generator.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { NoticeType, LegalCaseReason } from './dto';

// ============================================
// MOCK FACTORIES
// ============================================

const mockpartnerId = '550e8400-e29b-41d4-a716-446655440000';

const mockTenancy = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  partnerId: mockpartnerId,
  monthlyRent: 2000,
  leaseStartDate: new Date('2025-01-01'),
  tenant: {
    id: 'occ-1',
    user: { id: 'user-1', fullName: 'John Doe', email: 'john@test.com' },
  },
  listing: { id: 'listing-1', title: '123 Main St, KL' },
  owner: { id: 'vendor-1' },
};

const mockLegalCase = {
  id: 'case-1',
  partnerId: mockpartnerId,
  tenancyId: mockTenancy.id,
  caseNumber: 'LEG12345678',
  status: LegalCaseStatus.NOTICE_SENT,
  reason: 'NON_PAYMENT',
  description: 'Overdue rent',
  amountOwed: { toNumber: () => 5000 },
  lawyerId: null,
  lawyer: null,
  noticeDate: new Date(),
  noticeDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  courtDate: null,
  judgmentDate: null,
  resolvedAt: null,
  resolution: null,
  settlementAmount: null,
  notes: null,
  documents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLawyer = {
  id: 'lawyer-1',
  partnerId: mockpartnerId,
  name: 'Tan Sri Lawyer',
  firm: 'Legal & Co',
  email: 'lawyer@test.com',
  phone: '+60123456789',
  specialization: ['tenancy', 'property'],
  isActive: true,
  notes: null,
  _count: { cases: 2 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTenant = {
  id: mockpartnerId,
  name: 'Test Property Management',
};

// ============================================
// MOCK PRISMA
// ============================================

const mockPrisma = {
  legalCase: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  panelLawyer: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  legalDocument: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  tenancy: {
    findFirst: jest.fn(),
  },
  partner: {
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

describe('LegalService', () => {
  let service: LegalService;
  let panelLawyerService: PanelLawyerService;
  let noticeGenerator: NoticeGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalService,
        PanelLawyerService,
        NoticeGeneratorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PartnerContextService, useValue: mockPartnerContext },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<LegalService>(LegalService);
    panelLawyerService = module.get<PanelLawyerService>(PanelLawyerService);
    noticeGenerator = module.get<NoticeGeneratorService>(NoticeGeneratorService);
    jest.clearAllMocks();
    mockPartnerContext.getContext.mockReturnValue({ partnerId: mockpartnerId });
  });

  // ============================================
  // createCase
  // ============================================

  describe('createCase', () => {
    it('should create a legal case with unique case number', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(mockTenancy);
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);
      mockPrisma.legalCase.create.mockResolvedValue({
        ...mockLegalCase,
        amountOwed: 5000,
      });

      const result = await service.createCase({
        tenancyId: mockTenancy.id,
        reason: LegalCaseReason.NON_PAYMENT,
        description: 'Overdue rent',
        amountOwed: 5000,
      });

      expect(result).toBeDefined();
      expect(result.reason).toBe('NON_PAYMENT');
      expect(mockPrisma.legalCase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partnerId: mockpartnerId,
            tenancyId: mockTenancy.id,
            reason: 'NON_PAYMENT',
            status: LegalCaseStatus.NOTICE_SENT,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'legal.case.created',
        expect.objectContaining({ tenancyId: mockTenancy.id }),
      );
    });

    it('should throw NotFoundException if tenancy not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.createCase({
          tenancyId: 'nonexistent',
          reason: LegalCaseReason.NON_PAYMENT,
          description: 'Test',
          amountOwed: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if active case already exists', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(mockTenancy);
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);

      await expect(
        service.createCase({
          tenancyId: mockTenancy.id,
          reason: LegalCaseReason.NON_PAYMENT,
          description: 'Test',
          amountOwed: 1000,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should support different reasons (BREACH, DAMAGE, OTHER)', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(mockTenancy);
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);
      mockPrisma.legalCase.create.mockResolvedValue({
        ...mockLegalCase,
        reason: 'BREACH',
        amountOwed: 3000,
      });

      const result = await service.createCase({
        tenancyId: mockTenancy.id,
        reason: LegalCaseReason.BREACH,
        description: 'Breach of contract',
        amountOwed: 3000,
      });

      expect(result.reason).toBe('BREACH');
    });
  });

  // ============================================
  // getCase
  // ============================================

  describe('getCase', () => {
    it('should return case details with documents', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        amountOwed: 5000,
        documents: [
          {
            id: 'doc-1',
            caseId: 'case-1',
            type: 'FIRST_REMINDER',
            title: 'First Payment Reminder',
            fileName: 'notice.txt',
            fileUrl: '/legal-documents/test.txt',
            generatedBy: 'system',
            notes: null,
            createdAt: new Date(),
          },
        ],
      });

      const result = await service.getCase('case-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('case-1');
      expect(result.documents).toHaveLength(1);
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(service.getCase('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // listCases
  // ============================================

  describe('listCases', () => {
    it('should return paginated list of cases', async () => {
      mockPrisma.legalCase.findMany.mockResolvedValue([
        { ...mockLegalCase, amountOwed: 5000 },
      ]);
      mockPrisma.legalCase.count.mockResolvedValue(1);

      const result = await service.listCases({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.legalCase.findMany.mockResolvedValue([]);
      mockPrisma.legalCase.count.mockResolvedValue(0);

      await service.listCases({ status: LegalCaseStatus.COURT_FILED });

      expect(mockPrisma.legalCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            partnerId: mockpartnerId,
            status: LegalCaseStatus.COURT_FILED,
          }),
        }),
      );
    });

    it('should filter by reason and tenancyId', async () => {
      mockPrisma.legalCase.findMany.mockResolvedValue([]);
      mockPrisma.legalCase.count.mockResolvedValue(0);

      await service.listCases({
        reason: 'NON_PAYMENT',
        tenancyId: mockTenancy.id,
      });

      expect(mockPrisma.legalCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            partnerId: mockpartnerId,
            reason: 'NON_PAYMENT',
            tenancyId: mockTenancy.id,
          }),
        }),
      );
    });
  });

  // ============================================
  // updateCase
  // ============================================

  describe('updateCase', () => {
    it('should update case details', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);
      mockPrisma.legalCase.update.mockResolvedValue({
        ...mockLegalCase,
        amountOwed: 6000,
        description: 'Updated description',
      });

      const result = await service.updateCase('case-1', {
        description: 'Updated description',
        amountOwed: 6000,
      });

      expect(result).toBeDefined();
      expect(mockPrisma.legalCase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'Updated description',
            amountOwed: 6000,
          }),
        }),
      );
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCase('nonexistent', { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for closed case', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
      });

      await expect(
        service.updateCase('case-1', { description: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // assignLawyer
  // ============================================

  describe('assignLawyer', () => {
    it('should assign a lawyer to a case', async () => {
      const caseWithLawyer = {
        ...mockLegalCase,
        lawyerId: 'lawyer-1',
        lawyer: mockLawyer,
        amountOwed: 5000,
      };
      // First call: PanelLawyerService.assignToCase finds case
      // Second call: LegalService.getCase finds updated case
      mockPrisma.legalCase.findFirst
        .mockResolvedValueOnce(mockLegalCase)
        .mockResolvedValueOnce(caseWithLawyer);
      mockPrisma.panelLawyer.findFirst.mockResolvedValue(mockLawyer);
      mockPrisma.legalCase.update.mockResolvedValue(caseWithLawyer);

      const result = await service.assignLawyer('case-1', {
        lawyerId: 'lawyer-1',
      });

      expect(result.lawyerId).toBe('lawyer-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'legal.lawyer.assigned',
        expect.objectContaining({
          caseId: 'case-1',
          lawyerId: 'lawyer-1',
        }),
      );
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(
        service.assignLawyer('nonexistent', { lawyerId: 'lawyer-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if lawyer not found or inactive', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);
      mockPrisma.panelLawyer.findFirst.mockResolvedValue(null);

      await expect(
        service.assignLawyer('case-1', { lawyerId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for closed case', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
      });

      await expect(
        service.assignLawyer('case-1', { lawyerId: 'lawyer-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // generateNotice
  // ============================================

  describe('generateNotice', () => {
    it('should generate a FIRST_REMINDER notice', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        tenancy: mockTenancy,
        amountOwed: 5000,
      });
      mockPrisma.partner.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.legalDocument.create.mockResolvedValue({
        id: 'doc-1',
        caseId: 'case-1',
        type: NoticeType.FIRST_REMINDER,
        title: 'First Payment Reminder',
        fileName: 'first_reminder_LEG12345678_123.txt',
        fileUrl: '/legal-documents/test.txt',
        generatedBy: 'system',
        notes: null,
        createdAt: new Date(),
      });

      const result = await service.generateNotice('case-1', {
        type: NoticeType.FIRST_REMINDER,
      });

      expect(result).toBeDefined();
      expect(result.type).toBe(NoticeType.FIRST_REMINDER);
      expect(result.title).toBe('First Payment Reminder');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'legal.notice.generated',
        expect.objectContaining({
          noticeType: NoticeType.FIRST_REMINDER,
        }),
      );
    });

    it('should generate a LEGAL_NOTICE', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        lawyer: mockLawyer,
        tenancy: mockTenancy,
        amountOwed: 5000,
      });
      mockPrisma.partner.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.legalDocument.create.mockResolvedValue({
        id: 'doc-2',
        caseId: 'case-1',
        type: NoticeType.LEGAL_NOTICE,
        title: 'Formal Legal Notice',
        fileName: 'legal_notice_LEG12345678_456.txt',
        fileUrl: '/legal-documents/test.txt',
        generatedBy: 'system',
        notes: null,
        createdAt: new Date(),
      });

      const result = await service.generateNotice('case-1', {
        type: NoticeType.LEGAL_NOTICE,
      });

      expect(result.type).toBe(NoticeType.LEGAL_NOTICE);
      expect(result.title).toBe('Formal Legal Notice');
    });

    it('should generate a TERMINATION_NOTICE', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        lawyer: mockLawyer,
        tenancy: mockTenancy,
        amountOwed: 5000,
      });
      mockPrisma.partner.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.legalDocument.create.mockResolvedValue({
        id: 'doc-3',
        caseId: 'case-1',
        type: NoticeType.TERMINATION_NOTICE,
        title: 'Tenancy Termination Notice',
        fileName: 'termination_notice_LEG12345678_789.txt',
        fileUrl: '/legal-documents/test.txt',
        generatedBy: 'system',
        notes: null,
        createdAt: new Date(),
      });

      const result = await service.generateNotice('case-1', {
        type: NoticeType.TERMINATION_NOTICE,
      });

      expect(result.type).toBe(NoticeType.TERMINATION_NOTICE);
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(
        service.generateNotice('nonexistent', { type: NoticeType.FIRST_REMINDER }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for closed case', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
      });

      await expect(
        service.generateNotice('case-1', { type: NoticeType.FIRST_REMINDER }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // updateCaseStatus
  // ============================================

  describe('updateCaseStatus', () => {
    it('should transition NOTICE_SENT → RESPONSE_PENDING', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);
      mockPrisma.legalCase.update.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.RESPONSE_PENDING,
        amountOwed: 5000,
      });

      const result = await service.updateCaseStatus('case-1', LegalCaseStatus.RESPONSE_PENDING);

      expect(result.status).toBe(LegalCaseStatus.RESPONSE_PENDING);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'legal.case.status.changed',
        expect.objectContaining({
          previousStatus: LegalCaseStatus.NOTICE_SENT,
          newStatus: LegalCaseStatus.RESPONSE_PENDING,
        }),
      );
    });

    it('should transition RESPONSE_PENDING → MEDIATION', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.RESPONSE_PENDING,
      });
      mockPrisma.legalCase.update.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.MEDIATION,
        amountOwed: 5000,
      });

      const result = await service.updateCaseStatus('case-1', LegalCaseStatus.MEDIATION);
      expect(result.status).toBe(LegalCaseStatus.MEDIATION);
    });

    it('should transition to CLOSED from any status and set resolvedAt', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.ENFORCING,
      });
      mockPrisma.legalCase.update.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
        resolvedAt: new Date(),
        amountOwed: 5000,
      });

      const result = await service.updateCaseStatus('case-1', LegalCaseStatus.CLOSED);

      expect(result.status).toBe(LegalCaseStatus.CLOSED);
      expect(mockPrisma.legalCase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: LegalCaseStatus.CLOSED,
            resolvedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid transition', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase); // NOTICE_SENT

      await expect(
        service.updateCaseStatus('case-1', LegalCaseStatus.JUDGMENT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for CLOSED case (no transitions)', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
      });

      await expect(
        service.updateCaseStatus('case-1', LegalCaseStatus.NOTICE_SENT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCaseStatus('nonexistent', LegalCaseStatus.RESPONSE_PENDING),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // resolveCase
  // ============================================

  describe('resolveCase', () => {
    it('should resolve a case with settlement', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);
      mockPrisma.legalCase.update.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
        resolvedAt: new Date(),
        resolution: 'Settled out of court',
        settlementAmount: 3000,
        amountOwed: 5000,
      });

      const result = await service.resolveCase('case-1', {
        resolution: 'Settled out of court',
        settlementAmount: 3000,
      });

      expect(result.status).toBe(LegalCaseStatus.CLOSED);
      expect(result.resolution).toBe('Settled out of court');
      expect(result.settlementAmount).toBe(3000);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'legal.case.resolved',
        expect.objectContaining({
          resolution: 'Settled out of court',
          settlementAmount: 3000,
        }),
      );
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveCase('nonexistent', { resolution: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already closed', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
      });

      await expect(
        service.resolveCase('case-1', { resolution: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // getCaseDocuments
  // ============================================

  describe('getCaseDocuments', () => {
    it('should return documents for a case', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);
      mockPrisma.legalDocument.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          caseId: 'case-1',
          type: 'FIRST_REMINDER',
          title: 'First Payment Reminder',
          fileName: 'notice.txt',
          fileUrl: '/legal-documents/test.txt',
          generatedBy: 'system',
          notes: null,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getCaseDocuments('case-1');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('FIRST_REMINDER');
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(service.getCaseDocuments('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // Panel Lawyer Management
  // ============================================

  describe('createPanelLawyer', () => {
    it('should create a panel lawyer', async () => {
      mockPrisma.panelLawyer.create.mockResolvedValue(mockLawyer);

      const result = await service.createPanelLawyer({
        name: 'Tan Sri Lawyer',
        firm: 'Legal & Co',
        email: 'lawyer@test.com',
        phone: '+60123456789',
        specialization: ['tenancy', 'property'],
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Tan Sri Lawyer');
      expect(result.firm).toBe('Legal & Co');
      expect(result.activeCaseCount).toBe(2);
    });
  });

  describe('getPanelLawyer', () => {
    it('should return lawyer details', async () => {
      mockPrisma.panelLawyer.findFirst.mockResolvedValue(mockLawyer);

      const result = await service.getPanelLawyer('lawyer-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('lawyer-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.panelLawyer.findFirst.mockResolvedValue(null);

      await expect(service.getPanelLawyer('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listPanelLawyers', () => {
    it('should list active lawyers', async () => {
      mockPrisma.panelLawyer.findMany.mockResolvedValue([mockLawyer]);

      const result = await service.listPanelLawyers(true);

      expect(result).toHaveLength(1);
      expect(mockPrisma.panelLawyer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            partnerId: mockpartnerId,
            isActive: true,
          }),
        }),
      );
    });

    it('should list all lawyers when activeOnly is false', async () => {
      mockPrisma.panelLawyer.findMany.mockResolvedValue([mockLawyer]);

      await service.listPanelLawyers(false);

      expect(mockPrisma.panelLawyer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { partnerId: mockpartnerId },
        }),
      );
    });
  });

  describe('updatePanelLawyer', () => {
    it('should update lawyer details', async () => {
      mockPrisma.panelLawyer.findFirst.mockResolvedValue(mockLawyer);
      mockPrisma.panelLawyer.update.mockResolvedValue({
        ...mockLawyer,
        firm: 'New Firm',
      });

      const result = await service.updatePanelLawyer('lawyer-1', {
        firm: 'New Firm',
      });

      expect(result.firm).toBe('New Firm');
    });

    it('should deactivate a lawyer', async () => {
      mockPrisma.panelLawyer.findFirst.mockResolvedValue(mockLawyer);
      mockPrisma.panelLawyer.update.mockResolvedValue({
        ...mockLawyer,
        isActive: false,
      });

      const result = await service.updatePanelLawyer('lawyer-1', {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.panelLawyer.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePanelLawyer('nonexistent', { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // Event Handlers
  // ============================================

  describe('handleBillingEscalation', () => {
    it('should auto-create a legal case from billing escalation', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);
      mockPrisma.legalCase.create.mockResolvedValue({
        ...mockLegalCase,
        reason: 'NON_PAYMENT',
        amountOwed: 3000,
      });

      await service.handleBillingEscalation({
        tenancyId: mockTenancy.id,
        billingId: 'billing-1',
        amountOwed: 3000,
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.legalCase.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partnerId: mockpartnerId,
            tenancyId: mockTenancy.id,
            reason: 'NON_PAYMENT',
            amountOwed: 3000,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'legal.case.created',
        expect.objectContaining({ autoCreated: true }),
      );
    });

    it('should skip if case already exists for tenancy', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);

      await service.handleBillingEscalation({
        tenancyId: mockTenancy.id,
        billingId: 'billing-1',
        amountOwed: 3000,
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.legalCase.create).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.legalCase.findFirst.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await service.handleBillingEscalation({
        tenancyId: mockTenancy.id,
        billingId: 'billing-1',
        amountOwed: 3000,
        partnerId: mockpartnerId,
      });

      expect(mockPrisma.legalCase.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // uploadDocument
  // ============================================

  describe('uploadDocument', () => {
    it('should upload a document to a case', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(mockLegalCase);
      const mockDoc = {
        id: 'doc-new',
        caseId: 'case-1',
        type: 'EVIDENCE',
        title: 'Damage Evidence Photo',
        fileName: 'evidence.pdf',
        fileUrl: '/legal-documents/partner/evidence.pdf',
        generatedBy: null,
        notes: 'Photo of property damage',
        createdAt: new Date(),
      };
      mockPrisma.legalDocument.create.mockResolvedValue(mockDoc);

      const result = await service.uploadDocument('case-1', {
        type: 'EVIDENCE' as any,
        title: 'Damage Evidence Photo',
        fileName: 'evidence.pdf',
        fileUrl: '/legal-documents/partner/evidence.pdf',
        notes: 'Photo of property damage',
      });

      expect(result.id).toBe('doc-new');
      expect(result.type).toBe('EVIDENCE');
      expect(result.fileName).toBe('evidence.pdf');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'legal.document.uploaded',
        expect.objectContaining({
          caseId: 'case-1',
          documentId: 'doc-new',
          type: 'EVIDENCE',
        }),
      );
    });

    it('should throw NotFoundException if case not found', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadDocument('nonexistent', {
          type: 'EVIDENCE' as any,
          title: 'Test',
          fileName: 'test.pdf',
          fileUrl: '/test.pdf',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for closed case', async () => {
      mockPrisma.legalCase.findFirst.mockResolvedValue({
        ...mockLegalCase,
        status: LegalCaseStatus.CLOSED,
      });

      await expect(
        service.uploadDocument('case-1', {
          type: 'EVIDENCE' as any,
          title: 'Test',
          fileName: 'test.pdf',
          fileUrl: '/test.pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
