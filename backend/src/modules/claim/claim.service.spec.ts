/**
 * ClaimService Unit Tests
 * Session 7.5 - Claim Management
 *
 * Tests claim submission, evidence upload, review workflow (approve/partial/reject),
 * and dispute handling.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClaimService } from './claim.service';

describe('ClaimService', () => {
  let service: ClaimService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockS3Service: any;
  let mockEventEmitter: any;

  // Helper: dynamic date string for claim numbers (matches service logic)
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // Helper: create a mock claim object
  const createMockClaim = (overrides: Partial<any> = {}) => ({
    id: 'claim-001',
    tenancyId: 'tenancy-001',
    maintenanceId: null,
    claimNumber: `CLM-${todayStr}-0001`,
    type: 'DAMAGE',
    status: 'SUBMITTED',
    title: 'Wall damage in bedroom',
    description: 'Large crack in the bedroom wall',
    claimedAmount: 500.0,
    approvedAmount: null,
    submittedBy: 'user-001',
    submittedRole: 'OWNER',
    submittedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    settledAt: null,
    settlementMethod: null,
    isDisputed: false,
    disputeReason: null,
    disputedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    evidence: [],
    tenancy: {
      id: 'tenancy-001',
      listing: { id: 'listing-001', title: 'Unit 101' },
      owner: { id: 'owner-001', name: 'John Owner' },
      tenant: {
        id: 'occ-001',
        user: { fullName: 'Jane Doe', email: 'jane@test.com' },
      },
    },
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      claim: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      claimEvidence: {
        create: jest.fn(),
      },
      tenancy: {
        findFirst: jest.fn(),
      },
      maintenance: {
        findFirst: jest.fn(),
      },
    };

    mockPartnerContext = {
      getContext: jest.fn().mockReturnValue({ partnerId: 'partner-001' }),
    };

    mockS3Service = {
      getPresignedUploadUrl: jest.fn().mockResolvedValue({
        url: 'https://s3.example.com/upload?signed=true',
        key: 'claims/partner-001/claim-001/evidence/123-photo.jpg',
        expiresAt: new Date('2025-06-01T01:00:00Z'),
      }),
      getPublicUrl: jest.fn().mockReturnValue('https://s3.example.com/evidence/photo.jpg'),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new ClaimService(
      mockPrisma,
      mockPartnerContext,
      mockS3Service,
      mockEventEmitter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // submitClaim
  // ============================================

  describe('submitClaim', () => {
    it('should submit a claim successfully', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        type: 'DAMAGE' as const,
        title: 'Wall damage in bedroom',
        description: 'Large crack in the bedroom wall',
        claimedAmount: 500.0,
        submittedRole: 'OWNER',
      };
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });
      mockPrisma.claim.create.mockResolvedValue(createMockClaim());

      const result = await service.submitClaim(dto, 'user-001');

      expect(result.claimNumber).toBe(`CLM-${todayStr}-0001`);
      expect(result.type).toBe('DAMAGE');
      expect(result.status).toBe('SUBMITTED');
      expect(mockPrisma.claim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenancyId: 'tenancy-001',
            type: 'DAMAGE',
            title: 'Wall damage in bedroom',
            submittedBy: 'user-001',
            submittedRole: 'OWNER',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'claim.submitted',
        expect.objectContaining({
          claimNumber: `CLM-${todayStr}-0001`,
          partnerId: 'partner-001',
          type: 'DAMAGE',
        }),
      );
    });

    it('should submit a claim linked to maintenance ticket', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        maintenanceId: 'maint-001',
        type: 'UTILITY' as const,
        title: 'Plumbing repair cost',
        description: 'Reimbursement for emergency plumbing repair',
        claimedAmount: 200.0,
        submittedRole: 'TENANT',
      };
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });
      mockPrisma.maintenance.findFirst.mockResolvedValue({ id: 'maint-001', tenancyId: 'tenancy-001' });
      mockPrisma.claim.findFirst.mockResolvedValue(null); // No existing claim for this maintenance ticket
      mockPrisma.claim.create.mockResolvedValue(
        createMockClaim({
          maintenanceId: 'maint-001',
          type: 'UTILITY',
          submittedRole: 'TENANT',
        }),
      );

      const result = await service.submitClaim(dto, 'user-002');

      expect(result.maintenanceId).toBe('maint-001');
      expect(mockPrisma.claim.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            maintenanceId: 'maint-001',
          }),
        }),
      );
    });

    it('should throw NotFoundException if tenancy not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.submitClaim(
          {
            tenancyId: 'bad-id',
            type: 'DAMAGE' as const,
            title: 'Test',
            description: 'Test',
            claimedAmount: 100,
            submittedRole: 'OWNER',
          },
          'user-001',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if maintenance ticket not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });
      mockPrisma.maintenance.findFirst.mockResolvedValue(null);

      await expect(
        service.submitClaim(
          {
            tenancyId: 'tenancy-001',
            maintenanceId: 'bad-maint-id',
            type: 'UTILITY' as const,
            title: 'Test',
            description: 'Test',
            claimedAmount: 100,
            submittedRole: 'TENANT',
          },
          'user-001',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if claim already exists for maintenance ticket', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });
      mockPrisma.maintenance.findFirst.mockResolvedValue({ id: 'maint-001', tenancyId: 'tenancy-001' });
      mockPrisma.claim.findFirst.mockResolvedValue(createMockClaim()); // Existing claim

      await expect(
        service.submitClaim(
          {
            tenancyId: 'tenancy-001',
            maintenanceId: 'maint-001',
            type: 'DAMAGE' as const,
            title: 'Test',
            description: 'Test',
            claimedAmount: 100,
            submittedRole: 'OWNER',
          },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // getClaim
  // ============================================

  describe('getClaim', () => {
    it('should return a claim by ID', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(createMockClaim());

      const result = await service.getClaim('claim-001');

      expect(result.id).toBe('claim-001');
      expect(result.claimNumber).toBe(`CLM-${todayStr}-0001`);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(null);

      await expect(service.getClaim('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // listClaims
  // ============================================

  describe('listClaims', () => {
    it('should return paginated list of claims', async () => {
      const mockClaims = [createMockClaim()];
      mockPrisma.claim.findMany.mockResolvedValue(mockClaims);
      mockPrisma.claim.count.mockResolvedValue(1);

      const result = await service.listClaims({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by type', async () => {
      mockPrisma.claim.findMany.mockResolvedValue([]);
      mockPrisma.claim.count.mockResolvedValue(0);

      await service.listClaims({ type: 'DAMAGE' as any, page: 1, limit: 20 });

      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'DAMAGE' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.claim.findMany.mockResolvedValue([]);
      mockPrisma.claim.count.mockResolvedValue(0);

      await service.listClaims({ status: 'SUBMITTED' as any, page: 1, limit: 20 });

      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SUBMITTED' }),
        }),
      );
    });

    it('should support search', async () => {
      mockPrisma.claim.findMany.mockResolvedValue([]);
      mockPrisma.claim.count.mockResolvedValue(0);

      await service.listClaims({ search: 'wall', page: 1, limit: 20 });

      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ claimNumber: expect.any(Object) }),
              expect.objectContaining({ title: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });
  });

  // ============================================
  // uploadEvidence
  // ============================================

  describe('uploadEvidence', () => {
    it('should return presigned upload URL and create evidence record', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(createMockClaim());
      mockPrisma.claimEvidence.create.mockResolvedValue({
        id: 'ev-001',
        claimId: 'claim-001',
        type: 'PHOTO',
        fileName: 'damage.jpg',
        fileUrl: 'https://s3.example.com/evidence/photo.jpg',
        uploadedBy: 'user-001',
      });

      const result = await service.uploadEvidence(
        'claim-001',
        { type: 'PHOTO', fileName: 'damage.jpg', mimeType: 'image/jpeg' },
        'user-001',
      );

      expect(result.uploadUrl).toBe('https://s3.example.com/upload?signed=true');
      expect(result.evidence.type).toBe('PHOTO');
      expect(mockS3Service.getPresignedUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'image/jpeg',
          expiresIn: 3600,
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'claim.evidence.added',
        expect.objectContaining({
          claimId: 'claim-001',
          evidenceId: 'ev-001',
        }),
      );
    });

    it('should throw BadRequestException for settled claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SETTLED' }),
      );

      await expect(
        service.uploadEvidence(
          'claim-001',
          { type: 'PHOTO', fileName: 'photo.jpg', mimeType: 'image/jpeg' },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for rejected claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'REJECTED' }),
      );

      await expect(
        service.uploadEvidence(
          'claim-001',
          { type: 'RECEIPT', fileName: 'receipt.pdf', mimeType: 'application/pdf' },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if claim not found', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadEvidence(
          'bad-id',
          { type: 'PHOTO', fileName: 'x.jpg', mimeType: 'image/jpeg' },
          'user-001',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // reviewClaim
  // ============================================

  describe('reviewClaim', () => {
    it('should approve a claim and set full approved amount', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SUBMITTED', claimedAmount: 500 }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        createMockClaim({ status: 'APPROVED', approvedAmount: 500 }),
      );

      const result = await service.reviewClaim(
        'claim-001',
        { decision: 'APPROVED', notes: 'Approved in full' },
        'admin-001',
      );

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'APPROVED',
            approvedAmount: 500,
            reviewedBy: 'admin-001',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'claim.reviewed',
        expect.objectContaining({ decision: 'APPROVED' }),
      );
    });

    it('should partially approve a claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SUBMITTED', claimedAmount: 500 }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        createMockClaim({ status: 'PARTIALLY_APPROVED', approvedAmount: 250 }),
      );

      const result = await service.reviewClaim(
        'claim-001',
        { decision: 'PARTIALLY_APPROVED', approvedAmount: 250, notes: 'Partial damage' },
        'admin-001',
      );

      expect(result.status).toBe('PARTIALLY_APPROVED');
      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PARTIALLY_APPROVED',
            approvedAmount: 250,
          }),
        }),
      );
    });

    it('should reject a claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'UNDER_REVIEW' }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        createMockClaim({ status: 'REJECTED' }),
      );

      const result = await service.reviewClaim(
        'claim-001',
        { decision: 'REJECTED', notes: 'Insufficient evidence' },
        'admin-001',
      );

      expect(result.status).toBe('REJECTED');
    });

    it('should review a disputed claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'DISPUTED', isDisputed: true }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        createMockClaim({ status: 'APPROVED', approvedAmount: 500 }),
      );

      const result = await service.reviewClaim(
        'claim-001',
        { decision: 'APPROVED' },
        'admin-001',
      );

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDisputed: false,
          }),
        }),
      );
    });

    it('should throw BadRequestException for PARTIALLY_APPROVED without amount', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SUBMITTED' }),
      );

      await expect(
        service.reviewClaim(
          'claim-001',
          { decision: 'PARTIALLY_APPROVED' },
          'admin-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if partial amount >= claimed amount', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SUBMITTED', claimedAmount: 500 }),
      );

      await expect(
        service.reviewClaim(
          'claim-001',
          { decision: 'PARTIALLY_APPROVED', approvedAmount: 500 },
          'admin-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already-settled claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SETTLED' }),
      );

      await expect(
        service.reviewClaim(
          'claim-001',
          { decision: 'APPROVED' },
          'admin-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if claim not found', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(null);

      await expect(
        service.reviewClaim('bad-id', { decision: 'APPROVED' }, 'admin-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // disputeClaim
  // ============================================

  describe('disputeClaim', () => {
    it('should dispute an approved claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'APPROVED' }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        createMockClaim({ status: 'DISPUTED', isDisputed: true, disputeReason: 'I disagree' }),
      );

      const result = await service.disputeClaim(
        'claim-001',
        { reason: 'I disagree with the assessment' },
        'user-002',
      );

      expect(result.status).toBe('DISPUTED');
      expect(result.isDisputed).toBe(true);
      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DISPUTED',
            isDisputed: true,
            disputeReason: 'I disagree with the assessment',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'claim.disputed',
        expect.objectContaining({
          claimId: 'claim-001',
          reason: 'I disagree with the assessment',
        }),
      );
    });

    it('should dispute a rejected claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'REJECTED' }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        createMockClaim({ status: 'DISPUTED', isDisputed: true }),
      );

      const result = await service.disputeClaim(
        'claim-001',
        { reason: 'Evidence was not properly reviewed' },
        'user-002',
      );

      expect(result.status).toBe('DISPUTED');
    });

    it('should dispute a partially approved claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'PARTIALLY_APPROVED' }),
      );
      mockPrisma.claim.update.mockResolvedValue(
        createMockClaim({ status: 'DISPUTED', isDisputed: true }),
      );

      const result = await service.disputeClaim(
        'claim-001',
        { reason: 'Full amount should be approved' },
        'user-002',
      );

      expect(result.status).toBe('DISPUTED');
    });

    it('should throw BadRequestException for SUBMITTED claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SUBMITTED' }),
      );

      await expect(
        service.disputeClaim(
          'claim-001',
          { reason: 'Test' },
          'user-002',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for SETTLED claim', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(
        createMockClaim({ status: 'SETTLED' }),
      );

      await expect(
        service.disputeClaim(
          'claim-001',
          { reason: 'Test' },
          'user-002',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if claim not found', async () => {
      mockPrisma.claim.findFirst.mockResolvedValue(null);

      await expect(
        service.disputeClaim('bad-id', { reason: 'Test' }, 'user-002'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
