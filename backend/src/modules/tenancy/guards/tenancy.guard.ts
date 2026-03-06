/**
 * Tenancy Access Guard
 *
 * Controls access to tenancy resources:
 * - TENANT role: Can only access own tenancies
 * - VENDOR_ADMIN/VENDOR_STAFF: Can view tenancies for their properties
 * - PARTNER_ADMIN/SUPER_ADMIN: Full access
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';

export const TENANCY_ACCESS_KEY = 'tenancy_access';

export enum TenancyAccessLevel {
  SELF_ONLY = 'SELF_ONLY', // Only own tenancies (tenant)
  OWNER_PROPERTIES = 'OWNER_PROPERTIES', // Tenancies for owner's properties (vendor)
  FULL = 'FULL', // All tenancies (admin)
}

/**
 * Decorator to apply tenancy access control
 * @param level The access level required
 */
export const TenancyAccess = (level: TenancyAccessLevel = TenancyAccessLevel.SELF_ONLY) =>
  SetMetadata(TENANCY_ACCESS_KEY, level);

@Injectable()
export class TenancyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get configured access level from decorator (default: SELF_ONLY)
    const requiredLevel = this.reflector.getAllAndOverride<TenancyAccessLevel>(
      TENANCY_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? TenancyAccessLevel.SELF_ONLY;

    const { role, sub: userId, partnerId, vendorId } = user;

    // Super admin and partner admin have full access
    if (role === Role.SUPER_ADMIN || role === Role.PARTNER_ADMIN) {
      return true;
    }

    // Get tenancyId from route params if present
    const tenancyId = request.params?.id || request.params?.tenancyId;

    // Handle based on role
    switch (role) {
      case Role.TENANT:
        return this.handleTenantAccess(userId, partnerId, tenancyId);

      case Role.VENDOR_ADMIN:
      case Role.VENDOR_STAFF:
        return this.handleVendorAccess(vendorId, partnerId, tenancyId, requiredLevel);

      case Role.CUSTOMER:
        // Customers may be creating a tenancy for themselves
        if (!tenancyId && request.method === 'POST') {
          return true;
        }
        // For existing tenancies, check if related to their tenant profile
        return this.handleTenantAccess(userId, partnerId, tenancyId);

      default:
        throw new ForbiddenException('Access denied');
    }
  }

  /**
   * Handle tenant role access - can only access own tenancies
   */
  private async handleTenantAccess(
    userId: string,
    partnerId: string,
    tenancyId?: string,
  ): Promise<boolean> {
    // If no specific tenancy ID, allow list (service will filter to own)
    if (!tenancyId) {
      return true;
    }

    // Get tenant profile for user
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        userId,
        partnerId,
      },
      select: { id: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant profile not found');
    }

    // Check if tenancy belongs to this tenant
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: tenancyId,
        partnerId,
        tenantId: tenant.id,
      },
    });

    if (!tenancy) {
      throw new ForbiddenException('You can only access your own tenancies');
    }

    return true;
  }

  /**
   * Handle vendor role access - can view tenancies for their properties
   */
  private async handleVendorAccess(
    vendorId: string | undefined,
    partnerId: string,
    tenancyId?: string,
    requiredLevel?: TenancyAccessLevel,
  ): Promise<boolean> {
    if (!vendorId) {
      throw new ForbiddenException('Vendor ID not found in token');
    }

    // If no specific tenancy ID, allow list (service will filter to vendor's properties)
    if (!tenancyId) {
      return true;
    }

    // FULL access level check
    if (requiredLevel === TenancyAccessLevel.FULL) {
      throw new ForbiddenException('Admin-only operation');
    }

    // Check if tenancy is for vendor's property
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: tenancyId,
        partnerId,
        ownerId: vendorId,
      },
    });

    if (!tenancy) {
      throw new ForbiddenException('You can only access tenancies for your properties');
    }

    return true;
  }
}
