/**
 * InspectionService Unit Tests
 * Session 7.3 - Inspection Core
 *
 * Tests inspection business logic: scheduling, checklist updates,
 * completion, report generation, and listing.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InspectionService } from './inspection.service';

describe('InspectionService', () => {
  let service: InspectionService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockS3Service: any;
  let mockEventEmitter: any;

  // Helper: create a mock inspection object
  const createMockInspection = (overrides: Partial<any> = {}) => ({
    id: 'insp-001',
    tenancyId: 'tenancy-001',
    type: 'PERIODIC',
    status: 'SCHEDULED',
    scheduledDate: new Date('2025-03-15'),
    scheduledTime: '10:00-12:00',
    videoRequested: false,
    videoRequestedAt: null,
    videoUrl: null,
    videoSubmittedAt: null,
    onsiteRequired: false,
    onsiteDate: null,
    onsiteInspector: null,
    reportUrl: null,
    overallRating: null,
    notes: null,
    completedAt: null,
    completedBy: null,
    createdBy: 'user-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    checklist: [],
    tenancy: {
      id: 'tenancy-001',
      listing: { id: 'listing-001', title: 'Unit 101' },
      owner: { id: 'owner-001', name: 'John Owner' },
      tenant: {
        id: 'occ-001',
        user: {
          fullName: 'Jane Doe',
          email: 'jane@test.com',
        },
      },
    },
    ...overrides,
  });

  const createMockChecklistItem = (overrides: Partial<any> = {}) => ({
    id: 'item-001',
    inspectionId: 'insp-001',
    category: 'BEDROOM',
    item: 'Wall condition',
    condition: 'GOOD',
    notes: null,
    photoUrls: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      inspection: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      inspectionItem: {
        create: jest.fn(),
        update: jest.fn(),
      },
      tenancy: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((fn) => fn(mockPrisma)),
    };

    mockPartnerContext = {
      getContext: jest.fn().mockReturnValue({ partnerId: 'partner-001' }),
    };

    mockS3Service = {
      uploadObject: jest.fn().mockResolvedValue(undefined),
      getPublicUrl: jest.fn().mockReturnValue('https://s3.example.com/report.pdf'),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/download?signed=true'),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new InspectionService(
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
  // scheduleInspection
  // ============================================

  describe('scheduleInspection', () => {
    it('should schedule an inspection successfully', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        type: 'PERIODIC' as const,
        scheduledDate: '2025-03-15',
        scheduledTime: '10:00-12:00',
        notes: 'Regular inspection',
      };
      const mockTenancy = { id: 'tenancy-001', partnerId: 'partner-001' };
      const mockResult = createMockInspection({ notes: 'Regular inspection' });

      mockPrisma.tenancy.findFirst.mockResolvedValue(mockTenancy);
      mockPrisma.inspection.create.mockResolvedValue(mockResult);

      const result = await service.scheduleInspection(dto, 'user-001');

      expect(result).toEqual(mockResult);
      expect(mockPrisma.tenancy.findFirst).toHaveBeenCalledWith({
        where: { id: 'tenancy-001', partnerId: 'partner-001' },
      });
      expect(mockPrisma.inspection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenancyId: 'tenancy-001',
            type: 'PERIODIC',
            createdBy: 'user-001',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.created',
        expect.anything(),
      );
    });

    it('should throw NotFoundException if tenancy not found', async () => {
      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(
        service.scheduleInspection(
          { tenancyId: 'bad-id', type: 'PERIODIC' as const },
          'user-001',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should schedule with video requested', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        type: 'MOVE_IN' as const,
        videoRequested: true,
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue({ id: 'tenancy-001', partnerId: 'partner-001' });
      mockPrisma.inspection.create.mockResolvedValue(
        createMockInspection({ type: 'MOVE_IN', videoRequested: true }),
      );

      const result = await service.scheduleInspection(dto, 'user-001');

      expect(result.videoRequested).toBe(true);
      expect(mockPrisma.inspection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            videoRequested: true,
            videoRequestedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // ============================================
  // getInspection
  // ============================================

  describe('getInspection', () => {
    it('should return an inspection by ID', async () => {
      const mockResult = createMockInspection();
      mockPrisma.inspection.findFirst.mockResolvedValue(mockResult);

      const result = await service.getInspection('insp-001');

      expect(result).toEqual(mockResult);
      expect(mockPrisma.inspection.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'insp-001', tenancy: { partnerId: 'partner-001' } },
        }),
      );
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(service.getInspection('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // listInspections
  // ============================================

  describe('listInspections', () => {
    it('should return paginated list of inspections', async () => {
      const mockList = [createMockInspection(), createMockInspection({ id: 'insp-002' })];
      mockPrisma.inspection.findMany.mockResolvedValue(mockList);
      mockPrisma.inspection.count.mockResolvedValue(2);

      const result = await service.listInspections({ page: 1, limit: 20 });

      expect(result).toEqual({
        data: mockList,
        total: 2,
        page: 1,
        limit: 20,
      });
    });

    it('should filter by type', async () => {
      mockPrisma.inspection.findMany.mockResolvedValue([]);
      mockPrisma.inspection.count.mockResolvedValue(0);

      await service.listInspections({ type: 'MOVE_IN' });

      expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'MOVE_IN' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.inspection.findMany.mockResolvedValue([]);
      mockPrisma.inspection.count.mockResolvedValue(0);

      await service.listInspections({ status: 'COMPLETED' });

      expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('should filter by tenancyId', async () => {
      mockPrisma.inspection.findMany.mockResolvedValue([]);
      mockPrisma.inspection.count.mockResolvedValue(0);

      await service.listInspections({ tenancyId: 'tenancy-001' });

      expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenancyId: 'tenancy-001' }),
        }),
      );
    });

    it('should support search', async () => {
      mockPrisma.inspection.findMany.mockResolvedValue([]);
      mockPrisma.inspection.count.mockResolvedValue(0);

      await service.listInspections({ search: 'water' });

      expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ notes: { contains: 'water', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  // ============================================
  // updateChecklist
  // ============================================

  describe('updateChecklist', () => {
    it('should create new checklist items', async () => {
      const mockInspection = createMockInspection();
      mockPrisma.inspection.findFirst
        .mockResolvedValueOnce(mockInspection) // first call: status check
        .mockResolvedValueOnce({ ...mockInspection, checklist: [createMockChecklistItem()] }); // second call: return updated

      const dto = {
        items: [
          {
            category: 'BEDROOM' as const,
            item: 'Wall condition',
            condition: 'GOOD' as const,
            notes: 'Minor scuff marks',
          },
        ],
      };

      const result = await service.updateChecklist('insp-001', dto, 'user-001');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.checklist).toHaveLength(1);
    });

    it('should update existing checklist items by ID', async () => {
      const existingItem = createMockChecklistItem();
      const mockInspection = createMockInspection({ checklist: [existingItem] });
      mockPrisma.inspection.findFirst
        .mockResolvedValueOnce(mockInspection)
        .mockResolvedValueOnce(mockInspection);

      const dto = {
        items: [
          {
            id: 'item-001',
            category: 'BEDROOM' as const,
            item: 'Wall condition',
            condition: 'FAIR' as const,
          },
        ],
      };

      await service.updateChecklist('insp-001', dto, 'user-001');

      expect(mockPrisma.inspectionItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-001' },
          data: expect.objectContaining({ condition: 'FAIR' }),
        }),
      );
    });

    it('should reject checklist update on completed inspection', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'COMPLETED' }),
      );

      await expect(
        service.updateChecklist(
          'insp-001',
          { items: [{ category: 'BEDROOM' as const, item: 'Test' }] },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject checklist update on report_generated inspection', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'REPORT_GENERATED' }),
      );

      await expect(
        service.updateChecklist(
          'insp-001',
          { items: [{ category: 'KITCHEN' as const, item: 'Sink' }] },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if inspection not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChecklist(
          'bad-id',
          { items: [{ category: 'BEDROOM' as const, item: 'Test' }] },
          'user-001',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // completeInspection
  // ============================================

  describe('completeInspection', () => {
    it('should complete an inspection with rating', async () => {
      const mockInspection = createMockInspection();
      const mockCompleted = createMockInspection({
        status: 'COMPLETED',
        overallRating: 4,
        completedAt: new Date(),
        completedBy: 'user-001',
      });

      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);
      mockPrisma.inspection.update.mockResolvedValue(mockCompleted);

      const result = await service.completeInspection(
        'insp-001',
        { overallRating: 4, notes: 'Good condition' },
        'user-001',
      );

      expect(result.status).toBe('COMPLETED');
      expect(result.overallRating).toBe(4);
      expect(mockPrisma.inspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'insp-001' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            overallRating: 4,
            completedBy: 'user-001',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.completed',
        expect.anything(),
      );
    });

    it('should reject completing already completed inspection', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'COMPLETED' }),
      );

      await expect(
        service.completeInspection(
          'insp-001',
          { overallRating: 3 },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject completing report_generated inspection', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'REPORT_GENERATED' }),
      );

      await expect(
        service.completeInspection(
          'insp-001',
          { overallRating: 5 },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.completeInspection('bad-id', { overallRating: 4 }, 'user-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // generateReport
  // ============================================

  describe('generateReport', () => {
    it('should generate a PDF report and upload to S3', async () => {
      const mockInspection = createMockInspection({
        status: 'COMPLETED',
        overallRating: 4,
        notes: 'All good',
        checklist: [
          createMockChecklistItem(),
          createMockChecklistItem({
            id: 'item-002',
            category: 'KITCHEN',
            item: 'Sink condition',
            condition: 'FAIR',
          }),
        ],
      });

      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);
      mockPrisma.inspection.update.mockResolvedValue({
        ...mockInspection,
        status: 'REPORT_GENERATED',
        reportUrl: 'https://s3.example.com/report.pdf',
      });

      const result = await service.generateReport('insp-001', 'user-001');

      expect(result.url).toBe('https://s3.example.com/report.pdf');
      expect(mockS3Service.uploadObject).toHaveBeenCalledWith(
        'inspections/partner-001/insp-001/report.pdf',
        expect.any(Buffer),
        'application/pdf',
      );
      expect(mockPrisma.inspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reportUrl: 'https://s3.example.com/report.pdf',
            status: 'REPORT_GENERATED',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.report.generated',
        expect.anything(),
      );
    });

    it('should return existing report URL if already generated', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({
          status: 'REPORT_GENERATED',
          reportUrl: 'https://s3.example.com/existing-report.pdf',
        }),
      );

      const result = await service.generateReport('insp-001', 'user-001');

      expect(result.url).toBe('https://s3.example.com/existing-report.pdf');
      expect(mockS3Service.uploadObject).not.toHaveBeenCalled();
    });

    it('should reject report generation for non-completed inspection', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'SCHEDULED' }),
      );

      await expect(
        service.generateReport('insp-001', 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.generateReport('bad-id', 'user-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // getReportDownloadUrl
  // ============================================

  describe('getReportDownloadUrl', () => {
    it('should return presigned download URL', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({
          status: 'REPORT_GENERATED',
          reportUrl: 'https://s3.example.com/report.pdf',
        }),
      );

      const result = await service.getReportDownloadUrl('insp-001');

      expect(result).toBe('https://s3.example.com/download?signed=true');
      expect(mockS3Service.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'inspections/partner-001/insp-001/report.pdf',
        3600,
      );
    });

    it('should throw NotFoundException if report not generated', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ reportUrl: null }),
      );

      await expect(
        service.getReportDownloadUrl('insp-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if inspection not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.getReportDownloadUrl('bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // requestVideo (Session 7.4)
  // ============================================

  describe('requestVideo', () => {
    it('should request video for a scheduled inspection', async () => {
      const mockInspection = createMockInspection({ status: 'SCHEDULED' });
      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);

      const updatedInspection = createMockInspection({
        status: 'VIDEO_REQUESTED',
        videoRequested: true,
        videoRequestedAt: new Date(),
      });
      mockPrisma.inspection.update.mockResolvedValue(updatedInspection);

      const result = await service.requestVideo(
        'insp-001',
        { message: 'Please record walkthrough' },
        'user-001',
      );

      expect(result.status).toBe('VIDEO_REQUESTED');
      expect(result.videoRequested).toBe(true);
      expect(mockPrisma.inspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'insp-001' },
          data: expect.objectContaining({
            videoRequested: true,
            status: 'VIDEO_REQUESTED',
            videoUrl: null,
            videoSubmittedAt: null,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.video.requested',
        expect.objectContaining({
          inspectionId: 'insp-001',
          partnerId: 'partner-001',
          message: 'Please record walkthrough',
        }),
      );
    });

    it('should allow re-requesting video for VIDEO_REQUESTED status', async () => {
      const mockInspection = createMockInspection({ status: 'VIDEO_REQUESTED' });
      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);
      mockPrisma.inspection.update.mockResolvedValue(
        createMockInspection({ status: 'VIDEO_REQUESTED', videoRequested: true }),
      );

      const result = await service.requestVideo('insp-001', {}, 'user-001');
      expect(result.status).toBe('VIDEO_REQUESTED');
    });

    it('should throw BadRequestException for completed inspection', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'COMPLETED' }),
      );

      await expect(
        service.requestVideo('insp-001', {}, 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if inspection not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.requestVideo('bad-id', {}, 'user-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // submitVideo (Session 7.4)
  // ============================================

  describe('submitVideo', () => {
    it('should return presigned upload URL and update inspection', async () => {
      const mockInspection = createMockInspection({
        status: 'VIDEO_REQUESTED',
        videoRequested: true,
      });
      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);

      mockS3Service.getPresignedUploadUrl = jest.fn().mockResolvedValue({
        url: 'https://s3.example.com/upload?signed=true',
        key: 'inspections/partner-001/insp-001/video/123-walkthrough.mp4',
        expiresAt: new Date('2025-06-01T02:00:00Z'),
      });

      const updatedInspection = createMockInspection({
        status: 'VIDEO_SUBMITTED',
        videoUrl: 'https://s3.example.com/video.mp4',
        videoSubmittedAt: new Date(),
      });
      mockPrisma.inspection.update.mockResolvedValue(updatedInspection);

      const result = await service.submitVideo(
        'insp-001',
        { fileName: 'walkthrough.mp4', mimeType: 'video/mp4', fileSize: 50000000 },
        'user-002',
      );

      expect(result.uploadUrl).toBe('https://s3.example.com/upload?signed=true');
      expect(result.expiresAt).toEqual(new Date('2025-06-01T02:00:00Z'));
      expect(result.inspection.status).toBe('VIDEO_SUBMITTED');
      expect(mockS3Service.getPresignedUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'video/mp4',
          expiresIn: 7200,
        }),
      );
      expect(mockPrisma.inspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'VIDEO_SUBMITTED',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.video.submitted',
        expect.objectContaining({
          inspectionId: 'insp-001',
          partnerId: 'partner-001',
        }),
      );
    });

    it('should allow re-submission for VIDEO_SUBMITTED status', async () => {
      const mockInspection = createMockInspection({ status: 'VIDEO_SUBMITTED' });
      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);

      mockS3Service.getPresignedUploadUrl = jest.fn().mockResolvedValue({
        url: 'https://s3.example.com/upload?signed=true',
        key: 'key',
        expiresAt: new Date(),
      });
      mockPrisma.inspection.update.mockResolvedValue(
        createMockInspection({ status: 'VIDEO_SUBMITTED' }),
      );

      const result = await service.submitVideo(
        'insp-001',
        { fileName: 'retry.mp4', mimeType: 'video/mp4' },
        'user-002',
      );

      expect(result.uploadUrl).toBeDefined();
    });

    it('should throw BadRequestException for SCHEDULED status', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'SCHEDULED' }),
      );

      await expect(
        service.submitVideo(
          'insp-001',
          { fileName: 'vid.mp4', mimeType: 'video/mp4' },
          'user-002',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if inspection not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.submitVideo(
          'bad-id',
          { fileName: 'vid.mp4', mimeType: 'video/mp4' },
          'user-002',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // reviewVideo (Session 7.4)
  // ============================================

  describe('reviewVideo', () => {
    it('should approve video and transition to ONSITE_PENDING', async () => {
      const mockInspection = createMockInspection({
        status: 'VIDEO_SUBMITTED',
        videoUrl: 'https://s3.example.com/video.mp4',
        videoSubmittedAt: new Date(),
      });
      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);

      const updatedInspection = createMockInspection({
        status: 'ONSITE_PENDING',
        videoUrl: 'https://s3.example.com/video.mp4',
      });
      mockPrisma.inspection.update.mockResolvedValue(updatedInspection);

      const result = await service.reviewVideo(
        'insp-001',
        { decision: 'APPROVED', notes: 'Looks good' },
        'user-001',
      );

      expect(result.status).toBe('ONSITE_PENDING');
      expect(mockPrisma.inspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ONSITE_PENDING',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.video.reviewed',
        expect.objectContaining({
          inspectionId: 'insp-001',
          decision: 'APPROVED',
          partnerId: 'partner-001',
        }),
      );
    });

    it('should request redo and reset video fields', async () => {
      const mockInspection = createMockInspection({
        status: 'VIDEO_SUBMITTED',
        videoUrl: 'https://s3.example.com/video.mp4',
        videoSubmittedAt: new Date(),
        notes: 'Previous notes',
      });
      mockPrisma.inspection.findFirst.mockResolvedValue(mockInspection);

      const updatedInspection = createMockInspection({
        status: 'VIDEO_REQUESTED',
        videoUrl: null,
        videoSubmittedAt: null,
      });
      mockPrisma.inspection.update.mockResolvedValue(updatedInspection);

      const result = await service.reviewVideo(
        'insp-001',
        { decision: 'REQUEST_REDO', notes: 'Please record in better light' },
        'user-001',
      );

      expect(result.status).toBe('VIDEO_REQUESTED');
      expect(result.videoUrl).toBeNull();
      expect(mockPrisma.inspection.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'VIDEO_REQUESTED',
            videoUrl: null,
            videoSubmittedAt: null,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.video.reviewed',
        expect.objectContaining({
          decision: 'REQUEST_REDO',
        }),
      );
    });

    it('should throw BadRequestException if not VIDEO_SUBMITTED', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ status: 'SCHEDULED' }),
      );

      await expect(
        service.reviewVideo(
          'insp-001',
          { decision: 'APPROVED' },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if inspection not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.reviewVideo(
          'bad-id',
          { decision: 'APPROVED' },
          'user-001',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // getVideoDownloadUrl (Session 7.4)
  // ============================================

  describe('getVideoDownloadUrl', () => {
    it('should return presigned download URL for video', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({
          videoUrl: 'https://s3.example.com/inspections/partner-001/insp-001/video/123-walkthrough.mp4',
        }),
      );

      const result = await service.getVideoDownloadUrl('insp-001');

      expect(result).toBe('https://s3.example.com/download?signed=true');
      expect(mockS3Service.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'inspections/partner-001/insp-001/video/123-walkthrough.mp4',
        3600,
      );
    });

    it('should throw NotFoundException if no video submitted', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(
        createMockInspection({ videoUrl: null }),
      );

      await expect(
        service.getVideoDownloadUrl('insp-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if inspection not found', async () => {
      mockPrisma.inspection.findFirst.mockResolvedValue(null);

      await expect(
        service.getVideoDownloadUrl('bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
