/**
 * PropertyMemberService
 * Property-level access control — CRUD for PropertyMember records.
 *
 * Manages who has access to a specific property/listing and with what role.
 * Works alongside the existing Role system (not a replacement).
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PropertyRole, Prisma, Role } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  AddPropertyMemberDto,
  UpdatePropertyMemberDto,
  PropertyMemberQueryDto,
} from './dto';

// ============================================
// VIEW INTERFACES
// ============================================

export interface PropertyMemberView {
  id: string;
  partnerId: string;
  listingId: string;
  userId: string;
  role: PropertyRole;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  removedAt: Date | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  listing?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface PropertyMemberListResult {
  data: PropertyMemberView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyPropertyView {
  id: string;
  listingId: string;
  role: PropertyRole;
  listing: {
    id: string;
    title: string;
    status: string;
    price: any;
    vendor?: {
      id: string;
      companyName: string;
    };
  };
}

// ============================================
// INCLUDE RELATIONS
// ============================================

const includeMemberRelations = {
  user: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
};

const includeMyPropertyRelations = {
  listing: {
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      vendor: {
        select: { id: true, companyName: true },
      },
    },
  },
};

@Injectable()
export class PropertyMemberService {
  private readonly logger = new Logger(PropertyMemberService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly partnerContext: PartnerContextService,
  ) {}

  // ============================================
  // ADD MEMBER TO PROPERTY
  // ============================================

  async addMember(
    listingId: string,
    dto: AddPropertyMemberDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<PropertyMemberView> {
    const { partnerId } = this.partnerContext.getContext();

    // Verify listing belongs to partner
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, partnerId, deletedAt: null },
      include: { vendor: { select: { id: true } } },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    // Authorization: check if requester can manage members on this property
    await this.assertCanManageMembers(listingId, requestUserId, requestUserRole, listing.vendor?.id);

    // Verify user exists in same partner
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, partnerId },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    // Check for existing active member
    const existing = await this.prisma.propertyMember.findFirst({
      where: { listingId, userId: dto.userId, removedAt: null },
    });

    if (existing) {
      throw new ConflictException(
        `User ${dto.userId} is already a member of property ${listingId} with role ${existing.role}`,
      );
    }

    const member = await this.prisma.propertyMember.create({
      data: {
        partnerId,
        listingId,
        userId: dto.userId,
        role: dto.role,
        notes: dto.notes || null,
      },
      include: includeMemberRelations,
    });

    this.logger.log(
      `Property member added: user ${dto.userId} → listing ${listingId} as ${dto.role}`,
    );

    return member as PropertyMemberView;
  }

  // ============================================
  // LIST PROPERTY MEMBERS
  // ============================================

  async listMembers(
    listingId: string,
    query: PropertyMemberQueryDto,
  ): Promise<PropertyMemberListResult> {
    const { partnerId } = this.partnerContext.getContext();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Verify listing belongs to partner
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, partnerId, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    const where: Prisma.PropertyMemberWhereInput = {
      listingId,
      partnerId,
      removedAt: null,
    };

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.user = {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.propertyMember.findMany({
        where,
        include: includeMemberRelations,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.propertyMember.count({ where }),
    ]);

    return {
      data: data as PropertyMemberView[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // UPDATE MEMBER ROLE
  // ============================================

  async updateMember(
    listingId: string,
    memberId: string,
    dto: UpdatePropertyMemberDto,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<PropertyMemberView> {
    const { partnerId } = this.partnerContext.getContext();

    // Verify listing
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, partnerId, deletedAt: null },
      include: { vendor: { select: { id: true } } },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    // Authorization
    await this.assertCanManageMembers(listingId, requestUserId, requestUserRole, listing.vendor?.id);

    // Find the member record
    const existing = await this.prisma.propertyMember.findFirst({
      where: { id: memberId, listingId, removedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Property member ${memberId} not found`);
    }

    // Prevent self-escalation: cannot change own role
    if (existing.userId === requestUserId) {
      throw new BadRequestException('Cannot change your own property role');
    }

    const updateData: Prisma.PropertyMemberUpdateInput = {};
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const member = await this.prisma.propertyMember.update({
      where: { id: memberId },
      data: updateData,
      include: includeMemberRelations,
    });

    this.logger.log(
      `Property member updated: ${memberId} on listing ${listingId} → role ${member.role}`,
    );

    return member as PropertyMemberView;
  }

  // ============================================
  // REMOVE MEMBER (SOFT DELETE)
  // ============================================

  async removeMember(
    listingId: string,
    memberId: string,
    requestUserId: string,
    requestUserRole: Role,
  ): Promise<void> {
    const { partnerId } = this.partnerContext.getContext();

    // Verify listing
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, partnerId, deletedAt: null },
      include: { vendor: { select: { id: true } } },
    });

    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    // Authorization
    await this.assertCanManageMembers(listingId, requestUserId, requestUserRole, listing.vendor?.id);

    // Find the member record
    const existing = await this.prisma.propertyMember.findFirst({
      where: { id: memberId, listingId, removedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Property member ${memberId} not found`);
    }

    // Prevent removing self if only PROPERTY_ADMIN
    if (existing.userId === requestUserId && existing.role === PropertyRole.PROPERTY_ADMIN) {
      const otherAdmins = await this.prisma.propertyMember.count({
        where: {
          listingId,
          role: PropertyRole.PROPERTY_ADMIN,
          removedAt: null,
          id: { not: memberId },
        },
      });

      if (otherAdmins === 0) {
        throw new BadRequestException(
          'Cannot remove yourself as the only PROPERTY_ADMIN. Assign another admin first.',
        );
      }
    }

    // Soft-delete: set removedAt
    await this.prisma.propertyMember.update({
      where: { id: memberId },
      data: { removedAt: new Date() },
    });

    this.logger.log(
      `Property member removed: ${memberId} from listing ${listingId}`,
    );
  }

  // ============================================
  // GET MY PROPERTIES (for current user)
  // ============================================

  async getMyProperties(userId: string): Promise<MyPropertyView[]> {
    const { partnerId } = this.partnerContext.getContext();

    const members = await this.prisma.propertyMember.findMany({
      where: { userId, partnerId, removedAt: null },
      include: includeMyPropertyRelations,
      orderBy: { createdAt: 'desc' },
    });

    return members as MyPropertyView[];
  }

  // ============================================
  // GET MY ROLE ON A PROPERTY
  // ============================================

  async getMyRole(
    listingId: string,
    userId: string,
  ): Promise<{ role: PropertyRole } | null> {
    const { partnerId } = this.partnerContext.getContext();

    const member = await this.prisma.propertyMember.findFirst({
      where: { listingId, userId, partnerId, removedAt: null },
    });

    if (!member) {
      return null;
    }

    return { role: member.role };
  }

  // ============================================
  // AUTHORIZATION HELPER
  // ============================================

  /**
   * Checks if the requesting user can manage property members.
   *
   * Access resolution:
   * 1. SUPER_ADMIN / PARTNER_ADMIN → always allowed
   * 2. VENDOR_ADMIN of the property's vendor → allowed
   * 3. User with PROPERTY_ADMIN on this listing → allowed
   * 4. Otherwise → ForbiddenException
   */
  private async assertCanManageMembers(
    listingId: string,
    requestUserId: string,
    requestUserRole: Role,
    vendorId?: string,
  ): Promise<void> {
    // SUPER_ADMIN or PARTNER_ADMIN bypass
    if (requestUserRole === Role.SUPER_ADMIN || requestUserRole === Role.PARTNER_ADMIN) {
      return;
    }

    // VENDOR_ADMIN bypass for own vendor's listings
    if (requestUserRole === Role.VENDOR_ADMIN && vendorId) {
      const membership = await this.prisma.userVendor.findUnique({
        where: { userId_vendorId: { userId: requestUserId, vendorId } },
      });

      if (membership) {
        return;
      }
    }

    // Check if user has PROPERTY_ADMIN on this listing
    const member = await this.prisma.propertyMember.findFirst({
      where: {
        listingId,
        userId: requestUserId,
        role: PropertyRole.PROPERTY_ADMIN,
        removedAt: null,
      },
    });

    if (member) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to manage members on this property',
    );
  }
}
