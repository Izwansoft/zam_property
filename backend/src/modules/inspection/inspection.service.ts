import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { S3Service } from '@infrastructure/storage';
import {
  CreateInspectionDto,
  UpdateChecklistDto,
  CompleteInspectionDto,
  InspectionQueryDto,
  RequestVideoDto,
  SubmitVideoDto,
  ReviewVideoDto,
} from './dto';
import * as PDFDocument from 'pdfkit';

// ============================================
// VIEW INTERFACES
// ============================================

interface InspectionItemView {
  id: string;
  category: string;
  item: string;
  condition: string | null;
  notes: string | null;
  photoUrls: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface TenancyView {
  id: string;
  listing?: {
    id: string;
    title: string;
  };
  owner?: {
    id: string;
    name: string;
  };
  tenant?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
    };
  };
}

interface InspectionView {
  id: string;
  tenancyId: string;
  type: string;
  status: string;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  videoRequested: boolean;
  videoRequestedAt: Date | null;
  videoUrl: string | null;
  videoSubmittedAt: Date | null;
  onsiteRequired: boolean;
  onsiteDate: Date | null;
  onsiteInspector: string | null;
  reportUrl: string | null;
  overallRating: number | null;
  notes: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  checklist: InspectionItemView[];
  tenancy?: TenancyView;
}

// ============================================
// EVENTS
// ============================================

export class InspectionCreatedEvent {
  constructor(
    public readonly inspection: InspectionView,
    public readonly partnerId: string,
  ) {}
}

export class InspectionCompletedEvent {
  constructor(
    public readonly inspection: InspectionView,
    public readonly partnerId: string,
  ) {}
}

export class InspectionReportGeneratedEvent {
  constructor(
    public readonly inspectionId: string,
    public readonly reportUrl: string,
    public readonly partnerId: string,
  ) {}
}

export class VideoRequestedEvent {
  constructor(
    public readonly inspectionId: string,
    public readonly partnerId: string,
    public readonly message?: string,
  ) {}
}

export class VideoSubmittedEvent {
  constructor(
    public readonly inspectionId: string,
    public readonly videoUrl: string,
    public readonly partnerId: string,
  ) {}
}

export class VideoReviewedEvent {
  constructor(
    public readonly inspectionId: string,
    public readonly decision: string,
    public readonly partnerId: string,
  ) {}
}

// ============================================
// CONSTANTS
// ============================================

const includeRelations = {
  checklist: true,
  tenancy: {
    include: {
      listing: true,
      owner: true,
      tenant: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  },
};

@Injectable()
export class InspectionService {
  private readonly logger = new Logger(InspectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // SCHEDULE INSPECTION
  // ============================================

  async scheduleInspection(
    dto: CreateInspectionDto,
    userId: string,
  ): Promise<InspectionView> {
    const { partnerId } = this.PartnerContext.getContext();
    this.logger.log(`Scheduling ${dto.type} inspection for tenancy ${dto.tenancyId}`);

    // Verify tenancy belongs to this partner
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: dto.tenancyId, partnerId },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${dto.tenancyId} not found`);
    }

    const inspection = await this.prisma.inspection.create({
      data: {
        tenancyId: dto.tenancyId,
        type: dto.type as any,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        scheduledTime: dto.scheduledTime || null,
        videoRequested: dto.videoRequested || false,
        videoRequestedAt: dto.videoRequested ? new Date() : null,
        onsiteRequired: dto.onsiteRequired || false,
        notes: dto.notes || null,
        createdBy: userId,
      },
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'inspection.created',
      new InspectionCreatedEvent(inspection as InspectionView, partnerId),
    );

    this.logger.log(`Inspection ${inspection.id} scheduled successfully`);
    return inspection as InspectionView;
  }

  // ============================================
  // GET INSPECTION
  // ============================================

  async getInspection(id: string): Promise<InspectionView> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(id, partnerId);
    return inspection;
  }

  // ============================================
  // LIST INSPECTIONS
  // ============================================

  async listInspections(
    query: InspectionQueryDto,
  ): Promise<{ data: InspectionView[]; total: number; page: number; limit: number }> {
    const { partnerId } = this.PartnerContext.getContext();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      tenancy: { partnerId },
    };

    if (query.tenancyId) {
      where.tenancyId = query.tenancyId;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { notes: { contains: query.search, mode: 'insensitive' } },
        { onsiteInspector: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inspection.count({ where }),
    ]);

    return {
      data: data as InspectionView[],
      total,
      page,
      limit,
    };
  }

  // ============================================
  // UPDATE CHECKLIST
  // ============================================

  async updateChecklist(
    inspectionId: string,
    dto: UpdateChecklistDto,
    userId: string,
  ): Promise<InspectionView> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    if (inspection.status === 'COMPLETED' || inspection.status === 'REPORT_GENERATED') {
      throw new BadRequestException('Cannot update checklist on a completed inspection');
    }

    // Use a transaction to upsert all checklist items
    await this.prisma.$transaction(async (tx) => {
      for (const itemDto of dto.items) {
        const photoUrlsValue = itemDto.photoUrls
          ? (itemDto.photoUrls as Prisma.InputJsonValue)
          : Prisma.JsonNull;

        if (itemDto.id) {
          // Update existing item
          await tx.inspectionItem.update({
            where: { id: itemDto.id },
            data: {
              category: itemDto.category,
              item: itemDto.item,
              condition: itemDto.condition || null,
              notes: itemDto.notes || null,
              photoUrls: photoUrlsValue,
            },
          });
        } else {
          // Create new item
          await tx.inspectionItem.create({
            data: {
              inspectionId,
              category: itemDto.category,
              item: itemDto.item,
              condition: itemDto.condition || null,
              notes: itemDto.notes || null,
              photoUrls: photoUrlsValue,
            },
          });
        }
      }
    });

    this.logger.log(`Checklist updated for inspection ${inspectionId} by ${userId}`);

    // Return updated inspection
    return this.findInspectionOrThrow(inspectionId, partnerId);
  }

  // ============================================
  // COMPLETE INSPECTION
  // ============================================

  async completeInspection(
    inspectionId: string,
    dto: CompleteInspectionDto,
    userId: string,
  ): Promise<InspectionView> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    if (inspection.status === 'COMPLETED' || inspection.status === 'REPORT_GENERATED') {
      throw new BadRequestException('Inspection is already completed');
    }

    const updated = await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        status: 'COMPLETED',
        overallRating: dto.overallRating,
        notes: dto.notes || inspection.notes,
        completedAt: new Date(),
        completedBy: userId,
      },
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'inspection.completed',
      new InspectionCompletedEvent(updated as InspectionView, partnerId),
    );

    this.logger.log(`Inspection ${inspectionId} completed by ${userId}`);
    return updated as InspectionView;
  }

  // ============================================
  // GENERATE REPORT (PDF)
  // ============================================

  async generateReport(
    inspectionId: string,
    userId: string,
  ): Promise<{ url: string }> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    if (inspection.status !== 'COMPLETED' && inspection.status !== 'REPORT_GENERATED') {
      throw new BadRequestException('Inspection must be completed before generating a report');
    }

    // If report already exists, return it
    if (inspection.reportUrl) {
      return { url: inspection.reportUrl };
    }

    // Generate PDF
    const pdfBuffer = await this.generatePdfReport(inspection);

    // Upload to S3
    const key = `inspections/${partnerId}/${inspectionId}/report.pdf`;
    await this.s3Service.uploadObject(key, pdfBuffer, 'application/pdf');
    const reportUrl = this.s3Service.getPublicUrl(key);

    // Update inspection with report URL and status
    await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        reportUrl,
        status: 'REPORT_GENERATED',
      },
    });

    this.eventEmitter.emit(
      'inspection.report.generated',
      new InspectionReportGeneratedEvent(inspectionId, reportUrl, partnerId),
    );

    this.logger.log(`Report generated for inspection ${inspectionId}`);
    return { url: reportUrl };
  }

  // ============================================
  // DOWNLOAD REPORT
  // ============================================

  async getReportDownloadUrl(inspectionId: string): Promise<string> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    if (!inspection.reportUrl) {
      throw new NotFoundException('Report has not been generated yet');
    }

    const key = `inspections/${partnerId}/${inspectionId}/report.pdf`;
    return this.s3Service.getPresignedDownloadUrl(key, 3600);
  }

  // ============================================
  // REQUEST VIDEO
  // ============================================

  async requestVideo(
    inspectionId: string,
    dto: RequestVideoDto,
    userId: string,
  ): Promise<InspectionView> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    // Can only request video for SCHEDULED inspections or re-request after review
    if (inspection.status !== 'SCHEDULED' && inspection.status !== 'VIDEO_REQUESTED') {
      throw new BadRequestException(
        `Cannot request video for inspection in ${inspection.status} status`,
      );
    }

    const updated = await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        videoRequested: true,
        videoRequestedAt: new Date(),
        status: 'VIDEO_REQUESTED',
        // Clear previous video data if re-requesting
        videoUrl: null,
        videoSubmittedAt: null,
      },
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'inspection.video.requested',
      new VideoRequestedEvent(inspectionId, partnerId, dto.message),
    );

    this.logger.log(`Video requested for inspection ${inspectionId} by ${userId}`);
    return updated as InspectionView;
  }

  // ============================================
  // SUBMIT VIDEO (presigned upload URL)
  // ============================================

  async submitVideo(
    inspectionId: string,
    dto: SubmitVideoDto,
    userId: string,
  ): Promise<{ uploadUrl: string; expiresAt: Date; inspection: InspectionView }> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    // Can submit video when VIDEO_REQUESTED or re-submit
    if (inspection.status !== 'VIDEO_REQUESTED' && inspection.status !== 'VIDEO_SUBMITTED') {
      throw new BadRequestException(
        `Cannot submit video for inspection in ${inspection.status} status`,
      );
    }

    // Generate S3 key with timestamp for uniqueness
    const storageKey = `inspections/${partnerId}/${inspectionId}/video/${Date.now()}-${dto.fileName}`;

    // Get presigned upload URL (large file support via presigned URL)
    const presigned = await this.s3Service.getPresignedUploadUrl({
      key: storageKey,
      contentType: dto.mimeType,
      expiresIn: 7200, // 2 hours for large video files
    });

    // Update inspection with video URL and status
    const updated = await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        videoUrl: this.s3Service.getPublicUrl(storageKey),
        videoSubmittedAt: new Date(),
        status: 'VIDEO_SUBMITTED',
      },
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'inspection.video.submitted',
      new VideoSubmittedEvent(
        inspectionId,
        this.s3Service.getPublicUrl(storageKey),
        partnerId,
      ),
    );

    this.logger.log(`Video submitted for inspection ${inspectionId} by ${userId}`);

    return {
      uploadUrl: presigned.url,
      expiresAt: presigned.expiresAt,
      inspection: updated as InspectionView,
    };
  }

  // ============================================
  // REVIEW VIDEO (approve or request redo)
  // ============================================

  async reviewVideo(
    inspectionId: string,
    dto: ReviewVideoDto,
    userId: string,
  ): Promise<InspectionView> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    if (inspection.status !== 'VIDEO_SUBMITTED') {
      throw new BadRequestException(
        'Can only review video when status is VIDEO_SUBMITTED',
      );
    }

    let newStatus: string;
    let updateData: any = {};

    if (dto.decision === 'APPROVED') {
      // Move to ONSITE_PENDING (next step) or directly to a reviewable state
      newStatus = 'ONSITE_PENDING';
      updateData = {
        status: newStatus,
        notes: dto.notes
          ? `${inspection.notes ? inspection.notes + '\n' : ''}Video review: ${dto.notes}`
          : inspection.notes,
      };
    } else {
      // REQUEST_REDO - Reset video fields, go back to VIDEO_REQUESTED
      newStatus = 'VIDEO_REQUESTED';
      updateData = {
        status: newStatus,
        videoUrl: null,
        videoSubmittedAt: null,
        videoRequestedAt: new Date(), // Fresh request timestamp
        notes: dto.notes
          ? `${inspection.notes ? inspection.notes + '\n' : ''}Re-upload requested: ${dto.notes}`
          : inspection.notes,
      };
    }

    const updated = await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: updateData,
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'inspection.video.reviewed',
      new VideoReviewedEvent(inspectionId, dto.decision, partnerId),
    );

    this.logger.log(
      `Video for inspection ${inspectionId} reviewed: ${dto.decision} by ${userId}`,
    );
    return updated as InspectionView;
  }

  // ============================================
  // GET VIDEO DOWNLOAD URL
  // ============================================

  async getVideoDownloadUrl(inspectionId: string): Promise<string> {
    const { partnerId } = this.PartnerContext.getContext();
    const inspection = await this.findInspectionOrThrow(inspectionId, partnerId);

    if (!inspection.videoUrl) {
      throw new NotFoundException('No video has been submitted for this inspection');
    }

    // Extract the key from the public URL
    const key = `inspections/${partnerId}/${inspectionId}/video`;
    // Since we store the public URL, we need the actual key. Let's use the videoUrl directly.
    // For presigned download, derive key from the stored public URL pattern
    const storageKey = inspection.videoUrl.split('.com/').pop() || '';
    return this.s3Service.getPresignedDownloadUrl(storageKey, 3600);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async findInspectionOrThrow(
    id: string,
    partnerId: string,
  ): Promise<InspectionView> {
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id,
        tenancy: { partnerId },
      },
      include: includeRelations,
    });

    if (!inspection) {
      throw new NotFoundException(`Inspection ${id} not found`);
    }

    return inspection as InspectionView;
  }

  private async generatePdfReport(inspection: InspectionView): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ---- Header ----
      doc.fontSize(20).font('Helvetica-Bold').text('INSPECTION REPORT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Report ID: ${inspection.id}`, { align: 'center' });
      doc.moveDown(1);

      // ---- Horizontal Rule ----
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(1);

      // ---- Inspection Details ----
      doc.fontSize(14).font('Helvetica-Bold').text('Inspection Details');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const listingTitle = inspection.tenancy?.listing?.title || 'N/A';
      const ownerName = inspection.tenancy?.owner?.name || 'N/A';
      const tenantName = inspection.tenancy?.tenant?.user?.fullName || 'N/A';

      const details = [
        ['Type:', inspection.type.replace(/_/g, ' ')],
        ['Status:', inspection.status.replace(/_/g, ' ')],
        ['Listing:', listingTitle],
        ['Owner:', ownerName],
        ['Tenant:', tenantName],
        ['Scheduled:', inspection.scheduledDate ? new Date(inspection.scheduledDate).toLocaleDateString() : 'N/A'],
        ['Overall Rating:', inspection.overallRating ? `${inspection.overallRating}/5` : 'N/A'],
        ['Completed:', inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString() : 'N/A'],
      ];

      for (const [label, value] of details) {
        doc.font('Helvetica-Bold').text(label, { continued: true });
        doc.font('Helvetica').text(` ${value}`);
      }

      doc.moveDown(1);

      // ---- Notes ----
      if (inspection.notes) {
        doc.fontSize(14).font('Helvetica-Bold').text('Notes');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(inspection.notes);
        doc.moveDown(1);
      }

      // ---- Checklist ----
      if (inspection.checklist && inspection.checklist.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Checklist Items');
        doc.moveDown(0.5);

        // Group items by category
        const grouped: Record<string, InspectionItemView[]> = {};
        for (const item of inspection.checklist) {
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push(item);
        }

        for (const [category, items] of Object.entries(grouped)) {
          doc.fontSize(12).font('Helvetica-Bold').text(category);
          doc.moveDown(0.3);

          for (const item of items) {
            doc.fontSize(10).font('Helvetica');
            const conditionText = item.condition || 'Not assessed';
            doc.text(`  • ${item.item}: ${conditionText}`);
            if (item.notes) {
              doc.fontSize(9).fillColor('#666666').text(`    Notes: ${item.notes}`);
              doc.fillColor('#000000');
            }
          }
          doc.moveDown(0.5);
        }
      }

      // ---- Footer ----
      doc.moveDown(2);
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
      doc.moveDown(0.5);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#999999')
        .text(`Generated on ${new Date().toISOString()}`, { align: 'center' });

      doc.end();
    });
  }
}
