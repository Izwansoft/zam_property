import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TenantStatus } from '@prisma/client';

import { PartnerContextService } from '@core/partner-context';
import { S3Service } from '@infrastructure/storage/s3.service';
import { PrismaService } from '@infrastructure/database';

import {
  TenantRepository,
  TenantView,
  TenantDetailView,
  TenantDocumentView,
} from './tenant.repository';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantQueryDto,
  RequestDocumentUploadDto,
  VerifyDocumentDto,
  RunScreeningDto,
  UpdateScreeningResultDto,
} from './dto';

export interface TenantListResult {
  items: TenantView[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface DocumentUploadResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
  documentId: string;
}

// Events
export class TenantCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly partnerId: string,
  ) {}
}

export class TenantStatusChangedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly previousStatus: TenantStatus,
    public readonly newStatus: TenantStatus,
    public readonly partnerId: string,
  ) {}
}

export class TenantDocumentUploadedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly documentId: string,
    public readonly documentType: string,
    public readonly partnerId: string,
  ) {}
}

export class TenantScreenedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly screeningScore: number,
    public readonly partnerId: string,
  ) {}
}

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  // Allowed document MIME types
  private readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  // Max file size: 10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * List tenants with pagination and filtering
   */
  async listTenants(params: TenantQueryDto): Promise<TenantListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [items, totalItems] = await Promise.all([
      this.tenantRepository.list({
        skip: (page - 1) * pageSize,
        take: pageSize,
        status: params.status,
        search: params.search,
        icVerified: params.icVerified,
        incomeVerified: params.incomeVerified,
      }),
      this.tenantRepository.count({
        status: params.status,
        search: params.search,
        icVerified: params.icVerified,
        incomeVerified: params.incomeVerified,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items,
      pagination: { page, pageSize, totalItems, totalPages },
    };
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(id: string): Promise<TenantView> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  /**
   * Get tenant with full details (documents, tenancies)
   */
  async getTenantByIdWithDetails(id: string): Promise<TenantDetailView> {
    const tenant = await this.tenantRepository.findByIdWithDetails(id);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  /**
   * Get tenant by user ID
   */
  async getTenantByUserId(userId: string): Promise<TenantView | null> {
    return this.tenantRepository.findByUserId(userId);
  }

  /**
   * Create new tenant profile
   */
  async createTenant(dto: CreateTenantDto): Promise<TenantView> {
    const partner = this.PartnerContext.getContext();

    // Check if user exists
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, partnerId: partner.partnerId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if tenant profile already exists for this user
    const existing = await this.tenantRepository.findByUserId(dto.userId);
    if (existing) {
      throw new ConflictException('Tenant profile already exists for this user');
    }

    // Create tenant
    const tenant = await this.tenantRepository.create({
      userId: dto.userId,
      employmentType: dto.employmentType,
      monthlyIncome: dto.monthlyIncome,
      employer: dto.employer,
      icNumber: dto.icNumber,
      passportNumber: dto.passportNumber,
      emergencyName: dto.emergencyName,
      emergencyPhone: dto.emergencyPhone,
      emergencyRelation: dto.emergencyRelation,
    });

    this.logger.log(`Tenant created: ${tenant.id} for user ${dto.userId}`);

    // Emit event
    this.eventEmitter.emit(
      'tenant.created',
      new TenantCreatedEvent(tenant.id, dto.userId, partner.partnerId),
    );

    return tenant;
  }

  /**
   * Update tenant profile
   */
  async updateTenant(id: string, dto: UpdateTenantDto): Promise<TenantView> {
    // Verify tenant exists
    const existing = await this.tenantRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Tenant not found');
    }

    const tenant = await this.tenantRepository.update(id, {
      employmentType: dto.employmentType,
      monthlyIncome: dto.monthlyIncome,
      employer: dto.employer,
      icNumber: dto.icNumber,
      passportNumber: dto.passportNumber,
      emergencyName: dto.emergencyName,
      emergencyPhone: dto.emergencyPhone,
      emergencyRelation: dto.emergencyRelation,
    });

    this.logger.log(`Tenant updated: ${id}`);

    return tenant;
  }

  /**
   * Update tenant status
   */
  async updateTenantStatus(id: string, status: TenantStatus): Promise<TenantView> {
    const existing = await this.tenantRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Tenant not found');
    }

    const previousStatus = existing.status;

    // Validate status transition
    this.validateStatusTransition(previousStatus, status);

    const tenant = await this.tenantRepository.updateStatus(id, status);

    this.logger.log(`Tenant status changed: ${id} from ${previousStatus} to ${status}`);

    // Emit event
    const partner = this.PartnerContext.getContext();
    this.eventEmitter.emit(
      'tenant.status_changed',
      new TenantStatusChangedEvent(id, previousStatus, status, partner.partnerId),
    );

    return tenant;
  }

  /**
   * Request presigned URL for document upload
   */
  async requestDocumentUpload(
    tenantId: string,
    dto: RequestDocumentUploadDto,
  ): Promise<DocumentUploadResponse> {
    const partner = this.PartnerContext.getContext();

    // Verify tenant exists
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Validate MIME type
    if (!this.ALLOWED_DOCUMENT_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.ALLOWED_DOCUMENT_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (dto.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Generate storage key
    const timestamp = Date.now();
    const sanitizedFilename = dto.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `tenants/${partner.partnerId}/tenants/${tenantId}/documents/${dto.type}/${timestamp}_${sanitizedFilename}`;

    // Create document record in pending state (without fileUrl)
    const document = await this.tenantRepository.createDocument({
      tenantId,
      type: dto.type,
      fileName: dto.filename,
      fileUrl: storageKey, // Temporary, will be updated after upload confirmation
      fileSize: dto.size,
      mimeType: dto.mimeType,
    });

    // Generate presigned URL
    const { url, expiresAt } = await this.s3Service.getPresignedUploadUrl({
      key: storageKey,
      contentType: dto.mimeType,
      expiresIn: 3600, // 1 hour
    });

    this.logger.log(`Document upload URL generated for tenant ${tenantId}, type: ${dto.type}`);

    return {
      uploadUrl: url,
      storageKey,
      expiresAt,
      documentId: document.id,
    };
  }

  /**
   * Confirm document upload and update URL
   */
  async confirmDocumentUpload(documentId: string, storageKey: string): Promise<TenantDocumentView> {
    const document = await this.tenantRepository.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Verify the storage key matches
    if (document.fileUrl !== storageKey) {
      throw new BadRequestException('Storage key mismatch');
    }

    // Get the public URL for the document
    const publicUrl = await this.s3Service.getPublicUrl(storageKey);

    // Update document with final URL
    const updatedDocument = await this.prisma.tenantDocument.update({
      where: { id: documentId },
      data: { fileUrl: publicUrl },
      select: {
        id: true,
        tenantId: true,
        type: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        verified: true,
        verifiedAt: true,
        verifiedBy: true,
        createdAt: true,
      },
    });

    // Emit event
    const tenant = await this.tenantRepository.findById(document.tenantId);
    const partner = this.PartnerContext.getContext();
    this.eventEmitter.emit(
      'tenant.document_uploaded',
      new TenantDocumentUploadedEvent(
        document.tenantId,
        documentId,
        document.type,
        partner.partnerId,
      ),
    );

    this.logger.log(`Document upload confirmed: ${documentId}`);

    return updatedDocument;
  }

  /**
   * Get documents for an tenant
   */
  async getTenantDocuments(tenantId: string): Promise<TenantDocumentView[]> {
    // Verify tenant exists
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantRepository.findDocumentsByTenantId(tenantId);
  }

  /**
   * Verify a document
   */
  async verifyDocument(
    documentId: string,
    dto: VerifyDocumentDto,
    verifierId: string,
  ): Promise<TenantDocumentView> {
    const document = await this.tenantRepository.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const updatedDocument = await this.tenantRepository.updateDocument(documentId, {
      verified: dto.verified,
      verifiedAt: dto.verified ? new Date() : undefined,
      verifiedBy: dto.verified ? verifierId : undefined,
    });

    this.logger.log(
      `Document ${documentId} ${dto.verified ? 'verified' : 'unverified'} by ${verifierId}`,
    );

    // Update tenant verification status based on document type
    await this.updateVerificationStatus(document.tenantId);

    return updatedDocument;
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.tenantRepository.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from S3
    try {
      await this.s3Service.deleteObject(document.fileUrl);
    } catch (error) {
      this.logger.warn(`Failed to delete S3 object: ${document.fileUrl}`, error);
    }

    // Delete from database
    await this.tenantRepository.deleteDocument(documentId);

    this.logger.log(`Document deleted: ${documentId}`);
  }

  /**
   * Run screening for an tenant (mock implementation)
   */
  async runScreening(
    tenantId: string,
    dto: RunScreeningDto,
    screenerId: string,
  ): Promise<TenantView> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Mock screening logic - in production, integrate with screening provider
    const screeningScore = this.calculateMockScreeningScore(tenant);
    const screeningNotes = this.generateMockScreeningNotes(tenant, screeningScore, dto.notes);

    const updatedTenant = await this.tenantRepository.update(tenantId, {
      screeningScore,
      screeningNotes,
      screenedAt: new Date(),
      screenedBy: screenerId,
      status: this.determineStatusFromScore(screeningScore),
    });

    this.logger.log(`Screening completed for tenant ${tenantId}, score: ${screeningScore}`);

    // Emit event
    const partner = this.PartnerContext.getContext();
    this.eventEmitter.emit(
      'tenant.screened',
      new TenantScreenedEvent(tenantId, screeningScore, partner.partnerId),
    );

    return updatedTenant;
  }

  /**
   * Update screening result (admin override)
   */
  async updateScreeningResult(
    tenantId: string,
    dto: UpdateScreeningResultDto,
    adminId: string,
  ): Promise<TenantView> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedTenant = await this.tenantRepository.update(tenantId, {
      screeningScore: dto.screeningScore,
      screeningNotes: dto.screeningNotes,
      screenedAt: new Date(),
      screenedBy: adminId,
      status: this.determineStatusFromScore(dto.screeningScore),
    });

    this.logger.log(
      `Screening result updated for tenant ${tenantId}, score: ${dto.screeningScore}`,
    );

    return updatedTenant;
  }

  /**
   * Get tenants by vendor (property owner)
   */
  async getTenantsByVendorId(vendorId: string): Promise<TenantView[]> {
    return this.tenantRepository.findByVendorId(vendorId);
  }

  /**
   * Get tenants by listing
   */
  async getTenantsByListingId(listingId: string): Promise<TenantView[]> {
    return this.tenantRepository.findByListingId(listingId);
  }

  // Private helper methods

  private validateStatusTransition(from: TenantStatus, to: TenantStatus): void {
    const validTransitions: Record<TenantStatus, TenantStatus[]> = {
      PENDING: ['SCREENING', 'REJECTED'],
      SCREENING: ['APPROVED', 'REJECTED'],
      APPROVED: ['ACTIVE', 'REJECTED'],
      REJECTED: ['PENDING'], // Allow reapplication
      ACTIVE: ['NOTICE_GIVEN', 'VACATED'],
      NOTICE_GIVEN: ['VACATED'],
      VACATED: ['PENDING'], // Allow new tenancy
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  private async updateVerificationStatus(tenantId: string): Promise<void> {
    const documents = await this.tenantRepository.findDocumentsByTenantId(tenantId);

    // Check IC verification (IC_FRONT and IC_BACK both verified)
    const icFrontVerified = documents.some(
      (d) => d.type === 'IC_FRONT' && d.verified,
    );
    const icBackVerified = documents.some(
      (d) => d.type === 'IC_BACK' && d.verified,
    );
    const icVerified = icFrontVerified && icBackVerified;

    // Check income verification (any income document verified)
    const incomeVerified = documents.some(
      (d) =>
        ['PAYSLIP', 'BANK_STATEMENT', 'EMPLOYMENT_LETTER'].includes(d.type) &&
        d.verified,
    );

    await this.tenantRepository.update(tenantId, {
      icVerified,
      incomeVerified,
    });

    this.logger.log(
      `Verification status updated for tenant ${tenantId}: IC=${icVerified}, Income=${incomeVerified}`,
    );
  }

  private calculateMockScreeningScore(tenant: TenantView): number {
    let score = 50; // Base score

    // IC verified: +15
    if (tenant.icVerified) score += 15;

    // Income verified: +15
    if (tenant.incomeVerified) score += 15;

    // Has emergency contact: +5
    if (tenant.emergencyName && tenant.emergencyPhone) score += 5;

    // Employment type bonus
    if (tenant.employmentType === 'EMPLOYED') score += 10;
    else if (tenant.employmentType === 'SELF_EMPLOYED') score += 5;

    // Random factor (-5 to +5)
    score += Math.floor(Math.random() * 11) - 5;

    return Math.min(100, Math.max(0, score));
  }

  private generateMockScreeningNotes(
    tenant: TenantView,
    score: number,
    additionalNotes?: string,
  ): string {
    const notes: string[] = [];

    if (score >= 80) {
      notes.push('Excellent candidate with strong verification.');
    } else if (score >= 60) {
      notes.push('Good candidate with acceptable verification.');
    } else if (score >= 40) {
      notes.push('Average candidate, additional verification recommended.');
    } else {
      notes.push('Below average score, manual review required.');
    }

    if (!tenant.icVerified) {
      notes.push('IC not verified - pending document review.');
    }

    if (!tenant.incomeVerified) {
      notes.push('Income not verified - pending document review.');
    }

    if (additionalNotes) {
      notes.push(`Notes: ${additionalNotes}`);
    }

    return notes.join(' ');
  }

  private determineStatusFromScore(score: number): TenantStatus {
    if (score >= 60) {
      return TenantStatus.APPROVED;
    } else if (score >= 40) {
      return TenantStatus.SCREENING; // Needs manual review
    } else {
      return TenantStatus.REJECTED;
    }
  }
}
