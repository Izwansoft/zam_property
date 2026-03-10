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
import { RegisterCompanyDto, UpdateCompanyDto, AddCompanyAdminDto, CompanyQueryDto } from './dto';

// ============================================
// VIEW INTERFACES
// ============================================

export interface CompanyView {
  id: string;
  partnerId: string;
  name: string;
  registrationNo: string;
  type: string;
  verticalTypes: string[];
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

    if (query.verticalType) {
      where.verticalTypes = { has: query.verticalType };
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
      throw new ConflictException(`User ${dto.userId} is already an admin of company ${companyId}`);
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

    this.logger.log(`Admin added to company ${companyId}: user ${dto.userId} as ${admin.role}`);

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
      throw new NotFoundException(`User ${userId} is not an admin of company ${companyId}`);
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

  // ============================================
  // COMPANY PROFILE
  // ============================================

  async getProfile(companyId: string) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
      include: { profile: true },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    return (
      company.profile || {
        bio: null,
        website: null,
        established: null,
        teamSize: null,
        specialties: [],
        serviceAreas: [],
        facebookUrl: null,
        instagramUrl: null,
        linkedinUrl: null,
        youtubeUrl: null,
        tiktokUrl: null,
      }
    );
  }

  async updateProfile(
    companyId: string,
    data: {
      bio?: string;
      website?: string;
      established?: number;
      teamSize?: number;
      specialties?: string[];
      serviceAreas?: string[];
      facebookUrl?: string;
      instagramUrl?: string;
      linkedinUrl?: string;
      youtubeUrl?: string;
      tiktokUrl?: string;
    },
  ) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const profile = await this.prisma.companyProfile.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    });

    this.logger.log(`Company profile updated: ${companyId}`);
    return profile;
  }

  // ============================================
  // COMPANY BRANDING
  // ============================================

  async getBranding(companyId: string) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
      include: { branding: true },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    return (
      company.branding || {
        logo: null,
        logoIcon: null,
        logoDark: null,
        favicon: null,
        primaryColor: null,
      }
    );
  }

  async updateBranding(
    companyId: string,
    data: {
      logo?: string;
      logoIcon?: string;
      logoDark?: string;
      favicon?: string;
      primaryColor?: string;
    },
  ) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const branding = await this.prisma.companyBranding.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    });

    this.logger.log(`Company branding updated: ${companyId}`);
    return branding;
  }

  // ============================================
  // COMPANY SETTINGS
  // ============================================

  async getSettings(companyId: string) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
      include: { settings: true },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    return (
      company.settings || {
        defaultCommissionRate: null,
        commissionSplit: null,
        notificationEmail: null,
        enableEmailAlerts: true,
        enableSmsAlerts: false,
        bankName: null,
        bankAccount: null,
        bankAccountName: null,
        bankSwiftCode: null,
      }
    );
  }

  async updateSettings(
    companyId: string,
    data: {
      defaultCommissionRate?: number;
      commissionSplit?: number;
      notificationEmail?: string;
      enableEmailAlerts?: boolean;
      enableSmsAlerts?: boolean;
      bankName?: string;
      bankAccount?: string;
      bankAccountName?: string;
      bankSwiftCode?: string;
    },
  ) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const settings = await this.prisma.companySettings.upsert({
      where: { companyId },
      create: { companyId, ...data },
      update: data,
    });

    this.logger.log(`Company settings updated: ${companyId}`);
    return settings;
  }

  // ============================================
  // COMPANY DOCUMENTS
  // ============================================

  async getDocuments(companyId: string) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    return this.prisma.companyDocument.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addDocument(
    companyId: string,
    data: {
      type:
        | 'SSM_CERTIFICATE'
        | 'BOVAEA_LICENSE'
        | 'INSURANCE_CERTIFICATE'
        | 'TAX_CERTIFICATE'
        | 'BANK_STATEMENT'
        | 'OTHER';
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      expiresAt?: Date;
    },
  ) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const document = await this.prisma.companyDocument.create({
      data: { ...data, companyId },
    });

    this.logger.log(`Document added to company ${companyId}: ${data.type}`);
    return document;
  }

  async deleteDocument(companyId: string, documentId: string) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const document = await this.prisma.companyDocument.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    await this.prisma.companyDocument.delete({
      where: { id: documentId },
    });

    this.logger.log(`Document deleted from company ${companyId}: ${documentId}`);
  }

  async verifyDocument(
    companyId: string,
    documentId: string,
    verified: boolean,
    verifiedBy: string,
  ) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const document = await this.prisma.companyDocument.update({
      where: { id: documentId },
      data: {
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? verifiedBy : null,
      },
    });

    this.logger.log(`Document ${documentId} verification status: ${verified}`);
    return document;
  }

  // ============================================
  // CUSTOM ROLES
  // ============================================

  async getCustomRoles(companyId: string) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    return this.prisma.companyCustomRole.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCustomRole(
    companyId: string,
    data: { name: string; description?: string; permissions: string[] },
  ) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    // Check for duplicate role name
    const existing = await this.prisma.companyCustomRole.findFirst({
      where: { companyId, name: data.name },
    });

    if (existing) {
      throw new ConflictException(`Role "${data.name}" already exists`);
    }

    const role = await this.prisma.companyCustomRole.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      },
    });

    this.logger.log(`Custom role created for company ${companyId}: ${data.name}`);
    return role;
  }

  async updateCustomRole(
    companyId: string,
    roleId: string,
    data: { name?: string; description?: string; permissions?: string[] },
  ) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const role = await this.prisma.companyCustomRole.findFirst({
      where: { id: roleId, companyId },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    if (role.isDefault) {
      throw new BadRequestException('Cannot modify default roles');
    }

    // Check for name conflict if updating name
    if (data.name && data.name !== role.name) {
      const existing = await this.prisma.companyCustomRole.findFirst({
        where: { companyId, name: data.name, id: { not: roleId } },
      });

      if (existing) {
        throw new ConflictException(`Role "${data.name}" already exists`);
      }
    }

    const updatedRole = await this.prisma.companyCustomRole.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      },
    });

    this.logger.log(`Custom role updated for company ${companyId}: ${roleId}`);
    return updatedRole;
  }

  async deleteCustomRole(companyId: string, roleId: string) {
    const { partnerId } = this.PartnerContext.getContext();

    const company = await this.prisma.company.findFirst({
      where: { id: companyId, partnerId, deletedAt: null },
    });

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`);
    }

    const role = await this.prisma.companyCustomRole.findFirst({
      where: { id: roleId, companyId },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    if (role.isDefault) {
      throw new BadRequestException('Cannot delete default roles');
    }

    // Check if role is in use
    const inUse = await this.prisma.companyAdminCustomRole.findFirst({
      where: { customRoleId: roleId },
    });

    if (inUse) {
      throw new BadRequestException('Cannot delete role that is assigned to users');
    }

    await this.prisma.companyCustomRole.delete({
      where: { id: roleId },
    });

    this.logger.log(`Custom role deleted for company ${companyId}: ${roleId}`);
  }

  async assignCustomRole(companyAdminId: string, customRoleId: string) {
    const assignment = await this.prisma.companyAdminCustomRole.create({
      data: {
        companyAdminId,
        customRoleId,
      },
    });

    this.logger.log(`Custom role ${customRoleId} assigned to admin ${companyAdminId}`);
    return assignment;
  }

  async unassignCustomRole(companyAdminId: string, customRoleId: string) {
    await this.prisma.companyAdminCustomRole.delete({
      where: {
        companyAdminId_customRoleId: {
          companyAdminId,
          customRoleId,
        },
      },
    });

    this.logger.log(`Custom role ${customRoleId} unassigned from admin ${companyAdminId}`);
  }
}
