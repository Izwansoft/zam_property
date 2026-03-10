/**
 * Tenant Access Guard
 * 
 * Controls access to tenant resources:
 * - TENANT role: Can only access own profile
 * - VENDOR_ADMIN/VENDOR_STAFF: Can view tenants in their properties
 * - PARTNER_ADMIN/SUPER_ADMIN: Full access
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
  Inject,
  Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';

export const TENANT_ACCESS_KEY = 'tenant_access';

export enum TenantAccessLevel {
  SELF_ONLY = 'SELF_ONLY', // Only own profile
  VENDOR_PROPERTIES = 'VENDOR_PROPERTIES', // Tenants in vendor's properties
  FULL = 'FULL', // All tenants (admin)
}

/**
 * Decorator to apply tenant access control
 * @param level The access level required
 */
export const TenantAccess = (level: TenantAccessLevel = TenantAccessLevel.SELF_ONLY) =>
  SetMetadata(TENANT_ACCESS_KEY, level);

@Injectable({ scope: Scope.REQUEST })
export class TenantGuard implements CanActivate {
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
    const requiredLevel = this.reflector.getAllAndOverride<TenantAccessLevel>(
      TENANT_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? TenantAccessLevel.SELF_ONLY;

    const { role, userId, partnerId } = user;

    // Super admin and partner admin have full access
    if (role === Role.SUPER_ADMIN || role === Role.PARTNER_ADMIN) {
      return true;
    }

    // Get tenantId from route params if present
    const tenantId = request.params?.id || request.params?.tenantId;

    // Handle based on role
    switch (role) {
      case Role.TENANT:
        return this.handleTenantAccess(userId, partnerId, tenantId);

      case Role.VENDOR_ADMIN:
      case Role.VENDOR_STAFF: {
        // Resolve vendorId from UserVendor junction table
        const primaryVendor = await this.prisma.userVendor.findFirst({
          where: { userId, isPrimary: true },
          select: { vendorId: true },
        });
        return this.handleVendorAccess(primaryVendor?.vendorId, partnerId, tenantId, requiredLevel);
      }

      case Role.CUSTOMER:
        // Customers can create tenant profile for themselves
        if (!tenantId && request.method === 'POST') {
          return true;
        }
        // For existing profiles, check if it's their own
        return this.handleTenantAccess(userId, partnerId, tenantId);

      default:
        throw new ForbiddenException('Access denied');
    }
  }

  /**
   * Handle tenant role access - can only access own profile
   */
  private async handleTenantAccess(
    userId: string,
    partnerId: string,
    tenantId?: string,
  ): Promise<boolean> {
    // If no specific tenant ID, allow list (service will filter to own)
    if (!tenantId) {
      return true;
    }

    // Check if the tenant belongs to this user
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId,
        partnerId,
      },
    });

    if (!tenant) {
      throw new ForbiddenException('You can only access your own tenant profile');
    }

    return true;
  }

  /**
   * Handle vendor role access - can view tenants in their properties
   */
  private async handleVendorAccess(
    vendorId: string | undefined,
    partnerId: string,
    tenantId?: string,
    requiredLevel?: TenantAccessLevel,
  ): Promise<boolean> {
    if (!vendorId) {
      throw new ForbiddenException('Vendor context required');
    }

    // If no specific tenant ID, allow list (filtered by vendor's properties)
    if (!tenantId) {
      return true;
    }

    // Check if tenant has a tenancy with vendor's property
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        tenant: { id: tenantId },
        ownerId: vendorId,
        partner: { id: partnerId },
      },
    });

    if (!tenancy) {
      throw new ForbiddenException(
        'You can only access tenants with tenancies in your properties',
      );
    }

    return true;
  }
}

/**
 * Helper decorator for self-only access
 */
export const SelfTenantAccess = () => TenantAccess(TenantAccessLevel.SELF_ONLY);

/**
 * Helper decorator for vendor property access
 */
export const VendorTenantAccess = () => TenantAccess(TenantAccessLevel.VENDOR_PROPERTIES);

/**
 * Helper decorator for full admin access
 */
export const FullTenantAccess = () => TenantAccess(TenantAccessLevel.FULL);
