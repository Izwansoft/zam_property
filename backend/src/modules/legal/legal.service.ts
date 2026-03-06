/**
 * LegalService
 * Session 8.5 - Legal Module Core
 * Session 8.6 - Legal Integration & Finalization
 *
 * Manages legal case creation (from overdue billing), case status transitions,
 * resolution, and document management.
 *
 * Delegates to:
 *   PanelLawyerService - Panel lawyer CRUD and case assignment
 *   NoticeGeneratorService - Notice template generation
 *
 * Legal case flow:
 *   Overdue billing → Case created (NOTICE_SENT) → Lawyer assigned →
 *   Notices generated → RESPONSE_PENDING → MEDIATION → COURT_FILED →
 *   HEARING_SCHEDULED → JUDGMENT → ENFORCING → CLOSED
 *
 * Status transitions:
 *   NOTICE_SENT → RESPONSE_PENDING → MEDIATION → COURT_FILED →
 *   HEARING_SCHEDULED → JUDGMENT → ENFORCING → CLOSED
 *   (Any status can transition to CLOSED via resolution)
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { LegalCaseStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  CreateLegalCaseDto,
  UpdateLegalCaseDto,
  AssignLawyerDto,
  GenerateNoticeDto,
  LegalCaseQueryDto,
  CreatePanelLawyerDto,
  UpdatePanelLawyerDto,
  ResolveCaseDto,
  UploadLegalDocumentDto,
} from './dto';
import { PanelLawyerService } from './panel-lawyer.service';
import { NoticeGeneratorService } from './notice-generator.service';

// ============================================
// VIEW INTERFACES
// ============================================

export interface LegalCaseView {
  id: string;
  tenancyId: string;
  caseNumber: string;
  status: LegalCaseStatus;
  reason: string;
  description: string;
  amountOwed: number;
  lawyerId: string | null;
  lawyer?: PanelLawyerView | null;
  noticeDate: Date | null;
  noticeDeadline: Date | null;
  courtDate: Date | null;
  judgmentDate: Date | null;
  resolvedAt: Date | null;
  resolution: string | null;
  settlementAmount: number | null;
  notes: string | null;
  documents?: LegalDocumentView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PanelLawyerView {
  id: string;
  partnerId: string;
  name: string;
  firm: string | null;
  email: string;
  phone: string;
  specialization: string[];
  isActive: boolean;
  notes: string | null;
  activeCaseCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalDocumentView {
  id: string;
  caseId: string;
  type: string;
  title: string;
  fileName: string;
  fileUrl: string;
  generatedBy: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface LegalCaseListResult {
  data: LegalCaseView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// VALID STATUS TRANSITIONS
// ============================================

const VALID_TRANSITIONS: Record<LegalCaseStatus, LegalCaseStatus[]> = {
  [LegalCaseStatus.NOTICE_SENT]: [LegalCaseStatus.RESPONSE_PENDING, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.RESPONSE_PENDING]: [LegalCaseStatus.MEDIATION, LegalCaseStatus.COURT_FILED, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.MEDIATION]: [LegalCaseStatus.COURT_FILED, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.COURT_FILED]: [LegalCaseStatus.HEARING_SCHEDULED, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.HEARING_SCHEDULED]: [LegalCaseStatus.JUDGMENT, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.JUDGMENT]: [LegalCaseStatus.ENFORCING, LegalCaseStatus.CLOSED],
  [LegalCaseStatus.ENFORCING]: [LegalCaseStatus.CLOSED],
  [LegalCaseStatus.CLOSED]: [],
};

// ============================================
// SERVICE
// ============================================

@Injectable()
export class LegalService {
  private readonly logger = new Logger(LegalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
    private readonly panelLawyerService: PanelLawyerService,
    private readonly noticeGenerator: NoticeGeneratorService,
  ) {}

  // ============================================
  // LEGAL CASE MANAGEMENT
  // ============================================

  /**
   * Create a new legal case (typically from overdue billing escalation)
   */
  async createCase(dto: CreateLegalCaseDto): Promise<LegalCaseView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    // Verify tenancy exists in this partner
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: dto.tenancyId, partnerId },
      include: {
        tenant: { include: { user: true } },
        listing: true,
        owner: true,
      },
    });

    if (!tenancy) {
      throw new NotFoundException(`Tenancy ${dto.tenancyId} not found`);
    }

    // Check for existing active case on this tenancy
    const existingCase = await this.prisma.legalCase.findFirst({
      where: {
        tenancyId: dto.tenancyId,
        partnerId,
        status: { not: LegalCaseStatus.CLOSED },
      },
    });

    if (existingCase) {
      throw new ConflictException(
        `Active legal case ${existingCase.caseNumber} already exists for this tenancy`,
      );
    }

    const caseNumber = generateCaseNumber();
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 14); // 14-day deadline

    const legalCase = await this.prisma.legalCase.create({
      data: {
        partnerId,
        tenancyId: dto.tenancyId,
        caseNumber,
        status: LegalCaseStatus.NOTICE_SENT,
        reason: dto.reason,
        description: dto.description,
        amountOwed: dto.amountOwed,
        noticeDate: now,
        noticeDeadline: deadline,
        notes: dto.notes,
      },
      include: { lawyer: true, documents: true },
    });

    this.logger.log(`Legal case ${caseNumber} created for tenancy ${dto.tenancyId}`);
    this.eventEmitter.emit('legal.case.created', {
      caseId: legalCase.id,
      tenancyId: dto.tenancyId,
      caseNumber,
      reason: dto.reason,
      amountOwed: dto.amountOwed,
    });

    return this.mapCaseToView(legalCase);
  }

  /**
   * Get a legal case by ID
   */
  async getCase(caseId: string): Promise<LegalCaseView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const legalCase = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
      include: { lawyer: true, documents: true },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    return this.mapCaseToView(legalCase);
  }

  /**
   * List legal cases with pagination and filters
   */
  async listCases(query: LegalCaseQueryDto): Promise<LegalCaseListResult> {
    const partnerId = this.PartnerContext.getContext().partnerId;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LegalCaseWhereInput = { partnerId };
    if (query.status) where.status = query.status;
    if (query.reason) where.reason = query.reason;
    if (query.tenancyId) where.tenancyId = query.tenancyId;

    const orderBy: Record<string, string> = {};
    orderBy[query.sortBy ?? 'createdAt'] = query.sortDir ?? 'desc';

    const [cases, total] = await Promise.all([
      this.prisma.legalCase.findMany({
        where,
        include: { lawyer: true, documents: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.legalCase.count({ where }),
    ]);

    return {
      data: cases.map((c) => this.mapCaseToView(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update legal case details
   */
  async updateCase(caseId: string, dto: UpdateLegalCaseDto): Promise<LegalCaseView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const existing = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
    });

    if (!existing) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    if (existing.status === LegalCaseStatus.CLOSED) {
      throw new BadRequestException('Cannot update a closed case');
    }

    const data: Record<string, any> = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amountOwed !== undefined) data.amountOwed = dto.amountOwed;
    if (dto.courtDate !== undefined) data.courtDate = new Date(dto.courtDate);
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.legalCase.update({
      where: { id: caseId },
      data,
      include: { lawyer: true, documents: true },
    });

    this.logger.log(`Legal case ${existing.caseNumber} updated`);
    return this.mapCaseToView(updated);
  }

  /**
   * Assign a panel lawyer to a legal case
   * Delegates to PanelLawyerService for validation and assignment.
   */
  async assignLawyer(caseId: string, dto: AssignLawyerDto): Promise<LegalCaseView> {
    await this.panelLawyerService.assignToCase(caseId, dto);
    return this.getCase(caseId);
  }

  /**
   * Generate a notice document for a legal case.
   * Delegates to NoticeGeneratorService for template processing.
   */
  async generateNotice(caseId: string, dto: GenerateNoticeDto): Promise<LegalDocumentView> {
    const result = await this.noticeGenerator.generateNotice(caseId, dto);
    return result;
  }

  /**
   * Transition a legal case to a new status
   */
  async updateCaseStatus(caseId: string, newStatus: LegalCaseStatus): Promise<LegalCaseView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const legalCase = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    const allowedStatuses = VALID_TRANSITIONS[legalCase.status];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${legalCase.status} to ${newStatus}. Allowed: ${allowedStatuses.join(', ')}`,
      );
    }

    const data: Record<string, any> = { status: newStatus };

    // Set relevant timestamps based on status
    if (newStatus === LegalCaseStatus.CLOSED) {
      data.resolvedAt = new Date();
    }

    const updated = await this.prisma.legalCase.update({
      where: { id: caseId },
      data,
      include: { lawyer: true, documents: true },
    });

    this.logger.log(
      `Legal case ${legalCase.caseNumber} transitioned: ${legalCase.status} → ${newStatus}`,
    );
    this.eventEmitter.emit('legal.case.status.changed', {
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      previousStatus: legalCase.status,
      newStatus,
    });

    return this.mapCaseToView(updated);
  }

  /**
   * Resolve a legal case (transition to CLOSED)
   */
  async resolveCase(caseId: string, dto: ResolveCaseDto): Promise<LegalCaseView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const legalCase = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    if (legalCase.status === LegalCaseStatus.CLOSED) {
      throw new BadRequestException('Case is already closed');
    }

    const updated = await this.prisma.legalCase.update({
      where: { id: caseId },
      data: {
        status: LegalCaseStatus.CLOSED,
        resolvedAt: new Date(),
        resolution: dto.resolution,
        settlementAmount: dto.settlementAmount,
        notes: dto.notes ?? legalCase.notes,
      },
      include: { lawyer: true, documents: true },
    });

    this.logger.log(`Legal case ${legalCase.caseNumber} resolved`);
    this.eventEmitter.emit('legal.case.resolved', {
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      resolution: dto.resolution,
      settlementAmount: dto.settlementAmount,
    });

    return this.mapCaseToView(updated);
  }

  /**
   * Get case documents
   */
  async getCaseDocuments(caseId: string): Promise<LegalDocumentView[]> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const legalCase = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    const documents = await this.prisma.legalDocument.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((d) => this.mapDocumentToView(d));
  }

  /**
   * Upload/attach a document to a legal case
   */
  async uploadDocument(caseId: string, dto: UploadLegalDocumentDto): Promise<LegalDocumentView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const legalCase = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    if (legalCase.status === LegalCaseStatus.CLOSED) {
      throw new BadRequestException('Cannot upload documents to a closed case');
    }

    const document = await this.prisma.legalDocument.create({
      data: {
        caseId,
        type: dto.type,
        title: dto.title,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
      },
    });

    this.logger.log(`Document uploaded to case ${legalCase.caseNumber}: ${dto.fileName}`);
    this.eventEmitter.emit('legal.document.uploaded', {
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      documentId: document.id,
      type: dto.type,
      fileName: dto.fileName,
    });

    return this.mapDocumentToView(document);
  }

  // ============================================
  // PANEL LAWYER MANAGEMENT (delegates to PanelLawyerService)
  // ============================================

  /**
   * Create a panel lawyer
   */
  async createPanelLawyer(dto: CreatePanelLawyerDto): Promise<PanelLawyerView> {
    return this.panelLawyerService.create(dto);
  }

  /**
   * Get a panel lawyer by ID
   */
  async getPanelLawyer(lawyerId: string): Promise<PanelLawyerView> {
    return this.panelLawyerService.getById(lawyerId);
  }

  /**
   * List panel lawyers
   */
  async listPanelLawyers(activeOnly = true): Promise<PanelLawyerView[]> {
    return this.panelLawyerService.list(activeOnly);
  }

  /**
   * Update a panel lawyer
   */
  async updatePanelLawyer(lawyerId: string, dto: UpdatePanelLawyerDto): Promise<PanelLawyerView> {
    return this.panelLawyerService.update(lawyerId, dto);
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Auto-create legal case when billing escalates to legal
   * Triggered by reminder system after 3rd reminder
   */
  @OnEvent('billing.escalated.legal')
  async handleBillingEscalation(payload: {
    tenancyId: string;
    billingId: string;
    amountOwed: number;
    partnerId: string;
  }): Promise<void> {
    try {
      this.logger.log(`Billing escalation received for tenancy ${payload.tenancyId}`);

      // Check if case already exists
      const existing = await this.prisma.legalCase.findFirst({
        where: {
          tenancyId: payload.tenancyId,
          partnerId: payload.partnerId,
          status: { not: LegalCaseStatus.CLOSED },
        },
      });

      if (existing) {
        this.logger.log(`Legal case already exists for tenancy ${payload.tenancyId}, skipping`);
        return;
      }

      const caseNumber = generateCaseNumber();
      const now = new Date();
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + 14);

      const legalCase = await this.prisma.legalCase.create({
        data: {
          partnerId: payload.partnerId,
          tenancyId: payload.tenancyId,
          caseNumber,
          status: LegalCaseStatus.NOTICE_SENT,
          reason: 'NON_PAYMENT',
          description: `Auto-created from billing escalation. Billing ID: ${payload.billingId}. Amount owed: RM ${payload.amountOwed}`,
          amountOwed: payload.amountOwed,
          noticeDate: now,
          noticeDeadline: deadline,
        },
      });

      this.logger.log(`Auto-created legal case ${caseNumber} from billing escalation`);
      this.eventEmitter.emit('legal.case.created', {
        caseId: legalCase.id,
        tenancyId: payload.tenancyId,
        caseNumber,
        reason: 'NON_PAYMENT',
        amountOwed: payload.amountOwed,
        autoCreated: true,
      });
    } catch (error) {
      this.logger.error(`Failed to auto-create legal case: ${error}`);
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private mapCaseToView(legalCase: any): LegalCaseView {
    return {
      id: legalCase.id,
      tenancyId: legalCase.tenancyId,
      caseNumber: legalCase.caseNumber,
      status: legalCase.status,
      reason: legalCase.reason,
      description: legalCase.description,
      amountOwed: Number(legalCase.amountOwed),
      lawyerId: legalCase.lawyerId,
      lawyer: legalCase.lawyer ? this.mapLawyerToView(legalCase.lawyer) : null,
      noticeDate: legalCase.noticeDate,
      noticeDeadline: legalCase.noticeDeadline,
      courtDate: legalCase.courtDate,
      judgmentDate: legalCase.judgmentDate,
      resolvedAt: legalCase.resolvedAt,
      resolution: legalCase.resolution,
      settlementAmount: legalCase.settlementAmount ? Number(legalCase.settlementAmount) : null,
      notes: legalCase.notes,
      documents: legalCase.documents?.map((d: any) => this.mapDocumentToView(d)),
      createdAt: legalCase.createdAt,
      updatedAt: legalCase.updatedAt,
    };
  }

  private mapLawyerToView(lawyer: any): PanelLawyerView {
    return {
      id: lawyer.id,
      partnerId: lawyer.partnerId,
      name: lawyer.name,
      firm: lawyer.firm,
      email: lawyer.email,
      phone: lawyer.phone,
      specialization: lawyer.specialization,
      isActive: lawyer.isActive,
      notes: lawyer.notes,
      activeCaseCount: lawyer._count?.cases ?? undefined,
      createdAt: lawyer.createdAt,
      updatedAt: lawyer.updatedAt,
    };
  }

  private mapDocumentToView(doc: any): LegalDocumentView {
    return {
      id: doc.id,
      caseId: doc.caseId,
      type: doc.type,
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      generatedBy: doc.generatedBy,
      notes: doc.notes,
      createdAt: doc.createdAt,
    };
  }
}

// ============================================
// UTILITIES
// ============================================

function generateCaseNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LEG${code}`;
}
