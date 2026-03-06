/**
 * CompanyService
 * Session 8.1 - Company Module
 *
 * Manages company registration, verification, and admin assignment.
 * Company types: PROPERTY_COMPANY, MANAGEMENT_COMPANY, AGENCY
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CompanyStatus, CompanyAdminRole, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  RegisterCompanyDto,
  UpdateCompanyDto,
  AddCompanyAdminDto,
  CompanyQueryDto,
} from './dto';

// ============================================
// VIEW INTERFACES
// ============================================

export interface CompanyView {
  id: string;
  partnerId: string;
  name: string;
  registrationNo: string;
  type: string;
  email: string;
  phone: string;
  address: string | null;
  businessLicense: string | null;
  ssmDocument: string | null;
  status: string;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  admins: CompanyAdminView[];
}

export interface CompanyAdminView {
  id: string;
  companyId: string;
  userId: string;
  role: string;
  isOwner: boolean;
  createdAt: Date;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
}

export interface CompanyListResult {
  data: CompanyView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// EVENT CLASSES
// ============================================

export class CompanyRegisteredEvent {
  constructor(
    public readonly companyId: string,
    public readonly partnerId: string,
    public readonly name: string,
    public readonly type: string,
  ) {}
}

export class CompanyVerifiedEvent {
  constructor(
    public readonly companyId: string,
    public readonly partnerId: string,
    public readonly verifiedBy: string,
  ) {}
}

export class CompanyAdminAddedEvent {
  constructor(
    public readonly companyId: string,
    public readonly userId: string,
    public readonly role: string,
    public readonly partnerId: string,
  ) {}
}

export class CompanyAdminRemovedEvent {
  constructor(
    public readonly companyId: string,
    public readonly userId: string,
    public readonly partnerId: string,
  ) {}
}

// ============================================
// INCLUDE RELATIONS
// ============================================

const includeAdmins = {
  admins: {
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================
  // REGISTER COMPANY
  // ============================================

  async registerCompany(dto: RegisterCompanyDto, userId: string): Promise<CompanyView> {
    const { partnerId } = this.PartnerContext.getContext();

    // Check for duplicate registration number within partner
    const existing = await this.prisma.company.findFirst({
      where: {
        partnerId,
        registrationNo: dto.registrationNo,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Company with registration number ${dto.registrationNo} already exists`,
      );
    }

    // Create company with the registering user as owner admin
    const company = await this.prisma.company.create({
      data: {
        partnerId,
        name: dto.name,
        registrationNo: dto.registrationNo,
        type: dto.type,
        email: dto.email,
        phone: dto.phone,
        address: dto.address || null,
        status: CompanyStatus.PENDING,
        admins: {
          create: {
            userId,
            role: CompanyAdminRole.ADMIN,
            isOwner: true,
          },
        },
      },
      include: includeAdmins,
    });

    this.logger.log(
      `Company registered: ${company.name} (${company.registrationNo}) by user ${userId}`,
    );

    this.eventEmitter.emit(
      'company.registered',
      new CompanyRegisteredEvent(company.id, partnerId, company.name, company.type),
    );

    return company as CompanyView;
  }

  // ============================================
  // GET COMPANY
  // ============================================

  async getCompany(companyId: string): Promise<CompanyView> {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
      include: includeAdmins,
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    return company as CompanyView;
  }

  // ============================================
  // LIST COMPANIES
  // ============================================

  async listCompanies(query: CompanyQueryDto): Promise<CompanyListResult> {
    const { partnerId } = this.PartnerContext.getContext();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      partnerId,
      deletedAt: null,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { registrationNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortDir = query.sortDir || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: includeAdmins,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: data as CompanyView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // UPDATE COMPANY
  // ============================================

  async updateCompany(companyId: string, dto: UpdateCompanyDto): Promise<CompanyView> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify company exists
    const existing = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const updateData: Prisma.CompanyUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.businessLicense !== undefined) updateData.businessLicense = dto.businessLicense;
    if (dto.ssmDocument !== undefined) updateData.ssmDocument = dto.ssmDocument;

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: updateData,
      include: includeAdmins,
    });

    this.logger.log(`Company updated: ${company.name} (${companyId})`);

    return company as CompanyView;
  }

  // ============================================
  // VERIFY COMPANY
  // ============================================

  async verifyCompany(companyId: string, userId: string): Promise<CompanyView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    if (existing.status === CompanyStatus.ACTIVE) {
      throw new BadRequestException('Company is already verified');
    }

    if (existing.status === CompanyStatus.SUSPENDED) {
      throw new BadRequestException('Cannot verify a suspended company');
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        status: CompanyStatus.ACTIVE,
        verifiedAt: new Date(),
        verifiedBy: userId,
      },
      include: includeAdmins,
    });

    this.logger.log(`Company verified: ${company.name} (${companyId}) by ${userId}`);

    this.eventEmitter.emit(
      'company.verified',
      new CompanyVerifiedEvent(companyId, partnerId, userId),
    );

    return company as CompanyView;
  }

  // ============================================
  // SUSPEND COMPANY
  // ============================================

  async suspendCompany(companyId: string): Promise<CompanyView> {
    const { partnerId } = this.PartnerContext.getContext();

    const existing = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    if (existing.status === CompanyStatus.SUSPENDED) {
      throw new BadRequestException('Company is already suspended');
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { status: CompanyStatus.SUSPENDED },
      include: includeAdmins,
    });

    this.logger.log(`Company suspended: ${company.name} (${companyId})`);

    return company as CompanyView;
  }

  // ============================================
  // ADD ADMIN
  // ============================================

  async addAdmin(companyId: string, dto: AddCompanyAdminDto): Promise<CompanyAdminView> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify company exists
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    // Verify user exists in same partner
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, partnerId },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    // Check for duplicate assignment
    const existingAdmin = await this.prisma.companyAdmin.findUnique({
      where: {
        companyId_userId: { companyId, userId: dto.userId },
      },
    });

    if (existingAdmin) {
      throw new ConflictException(
        `User ${dto.userId} is already an admin of company ${companyId}`,
      );
    }

    const admin = await this.prisma.companyAdmin.create({
      data: {
        companyId,
        userId: dto.userId,
        role: dto.role || CompanyAdminRole.ADMIN,
        isOwner: dto.isOwner || false,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
    });

    this.logger.log(
      `Admin added to company ${companyId}: user ${dto.userId} as ${admin.role}`,
    );

    this.eventEmitter.emit(
      'company.admin.added',
      new CompanyAdminAddedEvent(companyId, dto.userId, admin.role, partnerId),
    );

    return admin as CompanyAdminView;
  }

  // ============================================
  // REMOVE ADMIN
  // ============================================

  async removeAdmin(companyId: string, userId: string): Promise<void> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify company exists
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    // Find the admin assignment
    const admin = await this.prisma.companyAdmin.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
    });

    if (!admin) {
      throw new NotFoundException(
        `User ${userId} is not an admin of company ${companyId}`,
      );
    }

    // Prevent removing the owner
    if (admin.isOwner) {
      throw new BadRequestException('Cannot remove the company owner');
    }

    // Ensure at least one admin remains
    const adminCount = await this.prisma.companyAdmin.count({
      where: { companyId },
    });

    if (adminCount <= 1) {
      throw new BadRequestException('Cannot remove the last admin');
    }

    await this.prisma.companyAdmin.delete({
      where: { id: admin.id },
    });

    this.logger.log(`Admin removed from company ${companyId}: user ${userId}`);

    this.eventEmitter.emit(
      'company.admin.removed',
      new CompanyAdminRemovedEvent(companyId, userId, partnerId),
    );
  }

  // ============================================
  // GET COMPANY ADMINS
  // ============================================

  async getAdmins(companyId: string): Promise<CompanyAdminView[]> {
    const { partnerId } = this.PartnerContext.getContext();

    // Verify company exists
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const admins = await this.prisma.companyAdmin.findMany({
      where: { companyId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return admins as CompanyAdminView[];
  }
}
