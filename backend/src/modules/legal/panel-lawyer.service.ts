/**
 * PanelLawyerService
 * Session 8.6 - Legal Integration & Finalization
 *
 * Manages panel lawyer CRUD and case assignment.
 * Extracted from LegalService for clean separation of concerns.
 *
 * Methods:
 *   createPanelLawyer(dto) - Register a new panel lawyer
 *   getPanelLawyer(id)     - Get lawyer details
 *   listPanelLawyers()     - List lawyers (filterable by active status)
 *   updatePanelLawyer()    - Update lawyer details
 *   assignToCase()         - Assign a lawyer to a legal case
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LegalCaseStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  CreatePanelLawyerDto,
  UpdatePanelLawyerDto,
  AssignLawyerDto,
} from './dto';

// ============================================
// VIEW INTERFACE
// ============================================

export interface PanelLawyerDetailView {
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

// ============================================
// SERVICE
// ============================================

@Injectable()
export class PanelLawyerService {
  private readonly logger = new Logger(PanelLawyerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a panel lawyer
   */
  async create(dto: CreatePanelLawyerDto): Promise<PanelLawyerDetailView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const lawyer = await this.prisma.panelLawyer.create({
      data: {
        partnerId,
        name: dto.name,
        firm: dto.firm,
        email: dto.email,
        phone: dto.phone,
        specialization: dto.specialization ?? [],
        notes: dto.notes,
      },
      include: { _count: { select: { cases: true } } },
    });

    this.logger.log(`Panel lawyer ${dto.name} created`);
    return this.mapToView(lawyer);
  }

  /**
   * Get a panel lawyer by ID
   */
  async getById(lawyerId: string): Promise<PanelLawyerDetailView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const lawyer = await this.prisma.panelLawyer.findFirst({
      where: { id: lawyerId, partnerId },
      include: { _count: { select: { cases: true } } },
    });

    if (!lawyer) {
      throw new NotFoundException(`Panel lawyer ${lawyerId} not found`);
    }

    return this.mapToView(lawyer);
  }

  /**
   * List panel lawyers
   */
  async list(activeOnly = true): Promise<PanelLawyerDetailView[]> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const where: Prisma.PanelLawyerWhereInput = { partnerId };
    if (activeOnly) where.isActive = true;

    const lawyers = await this.prisma.panelLawyer.findMany({
      where,
      include: { _count: { select: { cases: true } } },
      orderBy: { name: 'asc' },
    });

    return lawyers.map((l) => this.mapToView(l));
  }

  /**
   * Update a panel lawyer
   */
  async update(lawyerId: string, dto: UpdatePanelLawyerDto): Promise<PanelLawyerDetailView> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const existing = await this.prisma.panelLawyer.findFirst({
      where: { id: lawyerId, partnerId },
    });

    if (!existing) {
      throw new NotFoundException(`Panel lawyer ${lawyerId} not found`);
    }

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.firm !== undefined) data.firm = dto.firm;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.specialization !== undefined) data.specialization = dto.specialization;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.panelLawyer.update({
      where: { id: lawyerId },
      data,
      include: { _count: { select: { cases: true } } },
    });

    this.logger.log(`Panel lawyer ${existing.name} updated`);
    return this.mapToView(updated);
  }

  /**
   * Assign a panel lawyer to a legal case
   * Validates both case and lawyer exist, lawyer is active, not closed case.
   */
  async assignToCase(caseId: string, dto: AssignLawyerDto): Promise<{
    caseId: string;
    caseNumber: string;
    lawyerId: string;
    lawyerName: string;
  }> {
    const partnerId = this.PartnerContext.getContext().partnerId;

    const legalCase = await this.prisma.legalCase.findFirst({
      where: { id: caseId, partnerId },
    });

    if (!legalCase) {
      throw new NotFoundException(`Legal case ${caseId} not found`);
    }

    if (legalCase.status === LegalCaseStatus.CLOSED) {
      throw new BadRequestException('Cannot assign lawyer to a closed case');
    }

    // Verify lawyer exists and is active in this partner
    const lawyer = await this.prisma.panelLawyer.findFirst({
      where: { id: dto.lawyerId, partnerId, isActive: true },
    });

    if (!lawyer) {
      throw new NotFoundException(`Panel lawyer ${dto.lawyerId} not found or inactive`);
    }

    await this.prisma.legalCase.update({
      where: { id: caseId },
      data: { lawyerId: dto.lawyerId },
    });

    this.logger.log(`Lawyer ${lawyer.name} assigned to case ${legalCase.caseNumber}`);
    this.eventEmitter.emit('legal.lawyer.assigned', {
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      lawyerId: dto.lawyerId,
      lawyerName: lawyer.name,
    });

    return {
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      lawyerId: dto.lawyerId,
      lawyerName: lawyer.name,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private mapToView(lawyer: any): PanelLawyerDetailView {
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
}
