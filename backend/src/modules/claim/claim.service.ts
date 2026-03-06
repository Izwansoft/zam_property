/**
 * ClaimService
 * Session 7.5 - Claim Management
 *
 * Handles claim submission, evidence upload, review, and dispute workflows.
 * Supports both owner and tenant claims with evidence management.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import { S3Service } from '@infrastructure/storage';
import {
  CreateClaimDto,
  UploadEvidenceDto,
  ReviewClaimDto,
  DisputeClaimDto,
  ClaimQueryDto,
} from './dto';

// ============================================
// VIEW INTERFACES
// ============================================

export interface ClaimView {
  id: string;
  tenancyId: string;
  maintenanceId: string | null;
  claimNumber: string;
  type: string;
  status: string;
  title: string;
  description: string;
  claimedAmount: any;
  approvedAmount: any;
  submittedBy: string;
  submittedRole: string;
  submittedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  settledAt: Date | null;
  settlementMethod: string | null;
  isDisputed: boolean;
  disputeReason: string | null;
  disputedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  evidence: any[];
  tenancy: any;
}

// ============================================
// EVENT CLASSES
// ============================================

export class ClaimSubmittedEvent {
  constructor(
    public readonly claimId: string,
    public readonly claimNumber: string,
    public readonly partnerId: string,
    public readonly type: string,
  ) {}
}

export class ClaimReviewedEvent {
  constructor(
    public readonly claimId: string,
    public readonly decision: string,
    public readonly partnerId: string,
  ) {}
}

export class ClaimDisputedEvent {
  constructor(
    public readonly claimId: string,
    public readonly partnerId: string,
    public readonly reason: string,
  ) {}
}

export class ClaimEvidenceAddedEvent {
  constructor(
    public readonly claimId: string,
    public readonly evidenceId: string,
    public readonly partnerId: string,
  ) {}
}

// ============================================
// INCLUDE RELATIONS
// ============================================

const includeRelations = {
  evidence: true,
  tenancy: {
    include: {
      listing: { select: { id: true, title: true } },
      owner: { select: { id: true, name: true } },
      tenant: {
        select: {
          id: true,
          user: { select: { fullName: true, email: true } },
        },
      },
    },
  },
};

@Injectable()
export class ClaimService {
  private readonly logger = new Logger(ClaimService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // SUBMIT CLAIM
  // ============================================

  async submitClaim(dto: CreateClaimDto, userId: string): Promise<ClaimView> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify tenancy exists and belongs to partner
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: dto.tenancyId, partnerId },
    });
    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${dto.tenancyId} not found`);
    }

    // If linked to maintenance, verify it exists
    if (dto.maintenanceId) {
      const maintenance = await this.prisma.maintenance.findFirst({
        where: { id: dto.maintenanceId, tenancyId: dto.tenancyId },
      });
      if (!maintenance) {
        throw new NotFoundException(`Maintenance ticket ${dto.maintenanceId} not found`);
      }

      // Check if a claim already exists for this maintenance ticket
      const existingClaim = await this.prisma.claim.findFirst({
        where: { maintenanceId: dto.maintenanceId },
      });
      if (existingClaim) {
        throw new BadRequestException(
          `A claim already exists for maintenance ticket ${dto.maintenanceId}`,
        );
      }
    }

    // Generate claim number: CLM-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.claim.count({
      where: {
        tenancy: { partnerId },
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      },
    });
    const claimNumber = `CLM-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const claim = await this.prisma.claim.create({
      data: {
        tenancyId: dto.tenancyId,
        maintenanceId: dto.maintenanceId || null,
        claimNumber,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        claimedAmount: dto.claimedAmount,
        submittedBy: userId,
        submittedRole: dto.submittedRole,
      },
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'claim.submitted',
      new ClaimSubmittedEvent(claim.id, claimNumber, partnerId, dto.type),
    );

    this.logger.log(`Claim ${claimNumber} submitted by ${userId} for tenancy ${dto.tenancyId}`);
    return claim as ClaimView;
  }

  // ============================================
  // GET CLAIM
  // ============================================

  async getClaim(claimId: string): Promise<ClaimView> {
    const { partnerId } = this.PartnerContext.getContext();
    const claim = await this.findClaimOrThrow(claimId, partnerId);
    return claim;
  }

  // ============================================
  // LIST CLAIMS
  // ============================================

  async listClaims(query: ClaimQueryDto): Promise<{
    data: ClaimView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { partnerId } = this.PartnerContext.getContext();
    const { tenancyId, type, status, search, page = 1, limit = 20 } = query;

    const where: Prisma.ClaimWhereInput = {
      tenancy: { partnerId },
      ...(tenancyId && { tenancyId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { claimNumber: { contains: search, mode: 'insensitive' as const } },
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.claim.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.claim.count({ where }),
    ]);

    return { data: data as ClaimView[], total, page, limit };
  }

  // ============================================
  // UPLOAD EVIDENCE
  // ============================================

  async uploadEvidence(
    claimId: string,
    dto: UploadEvidenceDto,
    userId: string,
  ): Promise<{ uploadUrl: string; expiresAt: Date; evidence: any }> {
    const { partnerId } = this.PartnerContext.getContext();
    const claim = await this.findClaimOrThrow(claimId, partnerId);

    // Can only upload evidence for claims that are not settled or rejected
    if (claim.status === 'SETTLED' || claim.status === 'REJECTED') {
      throw new BadRequestException(
        `Cannot add evidence to a ${claim.status} claim`,
      );
    }

    // Generate S3 key
    const storageKey = `claims/${partnerId}/${claimId}/evidence/${Date.now()}-${dto.fileName}`;

    // Get presigned upload URL
    const presigned = await this.s3Service.getPresignedUploadUrl({
      key: storageKey,
      contentType: dto.mimeType,
      expiresIn: 3600,
    });

    // Create evidence record
    const evidence = await this.prisma.claimEvidence.create({
      data: {
        claimId,
        type: dto.type,
        fileName: dto.fileName,
        fileUrl: this.s3Service.getPublicUrl(storageKey),
        fileSize: dto.fileSize || null,
        mimeType: dto.mimeType,
        description: dto.description || null,
        uploadedBy: userId,
      },
    });

    this.eventEmitter.emit(
      'claim.evidence.added',
      new ClaimEvidenceAddedEvent(claimId, evidence.id, partnerId),
    );

    this.logger.log(`Evidence uploaded for claim ${claim.claimNumber} by ${userId}`);

    return {
      uploadUrl: presigned.url,
      expiresAt: presigned.expiresAt,
      evidence,
    };
  }

  // ============================================
  // REVIEW CLAIM (approve/partially_approve/reject)
  // ============================================

  async reviewClaim(
    claimId: string,
    dto: ReviewClaimDto,
    userId: string,
  ): Promise<ClaimView> {
    const { partnerId } = this.PartnerContext.getContext();
    const claim = await this.findClaimOrThrow(claimId, partnerId);

    // Can only review claims in SUBMITTED or UNDER_REVIEW or DISPUTED status
    if (!['SUBMITTED', 'UNDER_REVIEW', 'DISPUTED'].includes(claim.status)) {
      throw new BadRequestException(
        `Cannot review a claim in ${claim.status} status`,
      );
    }

    // Validate approved amount for PARTIALLY_APPROVED
    if (dto.decision === 'PARTIALLY_APPROVED') {
      if (!dto.approvedAmount) {
        throw new BadRequestException(
          'Approved amount is required for partial approval',
        );
      }
      if (dto.approvedAmount >= Number(claim.claimedAmount)) {
        throw new BadRequestException(
          'Partial approval amount must be less than claimed amount',
        );
      }
    }

    let approvedAmount: number | null = null;
    let newStatus: string;

    switch (dto.decision) {
      case 'APPROVED':
        newStatus = 'APPROVED';
        approvedAmount = Number(claim.claimedAmount);
        break;
      case 'PARTIALLY_APPROVED':
        newStatus = 'PARTIALLY_APPROVED';
        approvedAmount = dto.approvedAmount!;
        break;
      case 'REJECTED':
        newStatus = 'REJECTED';
        break;
      default:
        throw new BadRequestException(`Invalid decision: ${dto.decision}`);
    }

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: newStatus as any,
        approvedAmount,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: dto.notes || null,
        // Clear dispute if reviewing a disputed claim
        isDisputed: false,
      },
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'claim.reviewed',
      new ClaimReviewedEvent(claimId, dto.decision, partnerId),
    );

    this.logger.log(`Claim ${claim.claimNumber} reviewed: ${dto.decision} by ${userId}`);
    return updated as ClaimView;
  }

  // ============================================
  // DISPUTE CLAIM
  // ============================================

  async disputeClaim(
    claimId: string,
    dto: DisputeClaimDto,
    userId: string,
  ): Promise<ClaimView> {
    const { partnerId } = this.PartnerContext.getContext();
    const claim = await this.findClaimOrThrow(claimId, partnerId);

    // Can only dispute approved, partially_approved, or rejected claims
    if (!['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'].includes(claim.status)) {
      throw new BadRequestException(
        `Cannot dispute a claim in ${claim.status} status`,
      );
    }

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'DISPUTED',
        isDisputed: true,
        disputeReason: dto.reason,
        disputedAt: new Date(),
      },
      include: includeRelations,
    });

    this.eventEmitter.emit(
      'claim.disputed',
      new ClaimDisputedEvent(claimId, partnerId, dto.reason),
    );

    this.logger.log(`Claim ${claim.claimNumber} disputed by ${userId}: ${dto.reason}`);
    return updated as ClaimView;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async findClaimOrThrow(
    claimId: string,
    partnerId: string,
  ): Promise<ClaimView> {
    const claim = await this.prisma.claim.findFirst({
      where: {
        id: claimId,
        tenancy: { partnerId },
      },
      include: includeRelations,
    });

    if (!claim) {
      throw new NotFoundException(`Claim ${claimId} not found`);
    }

    return claim as ClaimView;
  }
}
