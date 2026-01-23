import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, VendorStatus, VendorType } from '@prisma/client';

import { TenantContextService } from '@core/tenant-context';
import { VendorStateMachine } from '@core/workflows';

import { VendorRepository, VendorView, VendorDetailView } from './vendor.repository';

export interface VendorListResult {
  items: VendorView[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable({ scope: Scope.REQUEST })
export class VendorService {
  constructor(
    private readonly vendorRepository: VendorRepository,
    private readonly tenantContext: TenantContextService,
    private readonly eventEmitter: EventEmitter2,
    private readonly vendorStateMachine: VendorStateMachine,
  ) {}

  async listVendors(params: {
    page?: number;
    pageSize?: number;
    status?: VendorStatus;
    vendorType?: VendorType;
    search?: string;
  }): Promise<VendorListResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [items, totalItems] = await Promise.all([
      this.vendorRepository.list({
        skip: (page - 1) * pageSize,
        take: pageSize,
        status: params.status,
        vendorType: params.vendorType,
        search: params.search,
      }),
      this.vendorRepository.count({
        status: params.status,
        vendorType: params.vendorType,
        search: params.search,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items,
      pagination: { page, pageSize, totalItems, totalPages },
    };
  }

  async getVendorById(id: string): Promise<VendorView> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async getVendorByIdWithDetails(id: string): Promise<VendorDetailView> {
    const vendor = await this.vendorRepository.findByIdWithDetails(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async getVendorBySlug(slug: string): Promise<VendorView> {
    const vendor = await this.vendorRepository.findBySlug(slug);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async createVendor(data: {
    name: string;
    description?: string;
    vendorType?: VendorType;
    email?: string;
    phone?: string;
    website?: string;
  }): Promise<VendorView> {
    const slug = this.generateSlug(data.name);

    // Check if slug already exists
    const slugExists = await this.vendorRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictException('A vendor with a similar name already exists');
    }

    try {
      const vendor = await this.vendorRepository.create({
        name: data.name,
        slug,
        description: data.description,
        vendorType: data.vendorType ?? VendorType.INDIVIDUAL,
        email: data.email,
        phone: data.phone,
        website: data.website,
      });

      // Emit event
      this.eventEmitter.emit('vendor.created', {
        tenantId: this.tenantContext.tenantId,
        vendorId: vendor.id,
        name: vendor.name,
        status: vendor.status,
        createdAt: vendor.createdAt,
      });

      return vendor;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Vendor already exists');
      }
      throw err;
    }
  }

  async updateVendor(
    id: string,
    data: {
      name?: string;
      description?: string;
      vendorType?: VendorType;
      email?: string;
      phone?: string;
      website?: string;
    },
  ): Promise<VendorView> {
    const existing = await this.vendorRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.vendorRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.updated', {
      tenantId: this.tenantContext.tenantId,
      vendorId: updated.id,
      changes: data,
      updatedAt: updated.updatedAt,
    });

    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    const vendor = await this.vendorRepository.softDelete(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.deleted', {
      tenantId: this.tenantContext.tenantId,
      vendorId: id,
      deletedAt: new Date(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS WORKFLOW ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  async approveVendor(id: string, approvedByUserId: string): Promise<VendorView> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Use state machine to validate and execute transition
    const result = await this.vendorStateMachine.transition(vendor.status, 'approve');

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.vendorRepository.updateStatus(id, {
      status: result.toState,
      approvedBy: approvedByUserId,
      approvedAt: new Date(),
      rejectedBy: undefined,
      rejectedAt: undefined,
      rejectionReason: undefined,
    });

    if (!updated) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.approved', {
      tenantId: this.tenantContext.tenantId,
      vendorId: id,
      approvedBy: approvedByUserId,
      approvedAt: updated.approvedAt,
    });

    return updated;
  }

  async rejectVendor(id: string, rejectedByUserId: string, reason: string): Promise<VendorView> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Use state machine to validate and execute transition
    const result = await this.vendorStateMachine.transition(vendor.status, 'reject', {
      rejectionReason: reason,
    });

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.vendorRepository.updateStatus(id, {
      status: result.toState,
      rejectedBy: rejectedByUserId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    if (!updated) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.rejected', {
      tenantId: this.tenantContext.tenantId,
      vendorId: id,
      rejectedBy: rejectedByUserId,
      rejectionReason: reason,
      rejectedAt: updated.rejectedAt,
    });

    return updated;
  }

  async suspendVendor(id: string, suspendedByUserId: string, reason: string): Promise<VendorView> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Use state machine to validate and execute transition
    const result = await this.vendorStateMachine.transition(vendor.status, 'suspend');

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.vendorRepository.updateStatus(id, {
      status: result.toState,
      rejectedBy: suspendedByUserId,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    if (!updated) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.suspended', {
      tenantId: this.tenantContext.tenantId,
      vendorId: id,
      suspendedBy: suspendedByUserId,
      reason,
      suspendedAt: updated.rejectedAt,
    });

    return updated;
  }

  async reactivateVendor(id: string, reactivatedByUserId: string): Promise<VendorView> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Use state machine to validate and execute transition
    const result = await this.vendorStateMachine.transition(vendor.status, 'reactivate');

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    const updated = await this.vendorRepository.updateStatus(id, {
      status: result.toState,
      approvedBy: reactivatedByUserId,
      approvedAt: new Date(),
      rejectedBy: undefined,
      rejectedAt: undefined,
      rejectionReason: undefined,
    });

    if (!updated) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.reactivated', {
      tenantId: this.tenantContext.tenantId,
      vendorId: id,
      reactivatedBy: reactivatedByUserId,
      reactivatedAt: updated.approvedAt,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE & SETTINGS
  // ─────────────────────────────────────────────────────────────────────────

  async updateVendorProfile(
    vendorId: string,
    data: {
      businessRegNo?: string;
      taxId?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      logoUrl?: string;
      bannerUrl?: string;
      socialLinks?: Record<string, string>;
      operatingHours?: Record<string, unknown>;
    },
  ): Promise<VendorDetailView> {
    const vendor = await this.vendorRepository.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Convert to Prisma-compatible JSON types
    const profileData = {
      ...data,
      socialLinks: data.socialLinks as Prisma.InputJsonValue | undefined,
      operatingHours: data.operatingHours as Prisma.InputJsonValue | undefined,
    };

    await this.vendorRepository.upsertProfile(vendorId, profileData);

    const updated = await this.vendorRepository.findByIdWithDetails(vendorId);
    if (!updated) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.profile.updated', {
      tenantId: this.tenantContext.tenantId,
      vendorId,
      updatedAt: new Date(),
    });

    return updated;
  }

  async updateVendorSettings(
    vendorId: string,
    data: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      leadNotifications?: boolean;
      autoResponseEnabled?: boolean;
      autoResponseMessage?: string;
      showPhone?: boolean;
      showEmail?: boolean;
    },
  ): Promise<VendorDetailView> {
    const vendor = await this.vendorRepository.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.vendorRepository.upsertSettings(vendorId, data);

    const updated = await this.vendorRepository.findByIdWithDetails(vendorId);
    if (!updated) {
      throw new NotFoundException('Vendor not found');
    }

    // Emit event
    this.eventEmitter.emit('vendor.settings.updated', {
      tenantId: this.tenantContext.tenantId,
      vendorId,
      updatedAt: new Date(),
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR CONTEXT HELPERS (for user authorization)
  // ─────────────────────────────────────────────────────────────────────────

  async assertUserCanManageVendor(vendorId: string, userVendorId?: string | null): Promise<void> {
    if (!userVendorId || userVendorId !== vendorId) {
      throw new ForbiddenException('You do not have permission to manage this vendor');
    }

    const vendor = await this.vendorRepository.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
