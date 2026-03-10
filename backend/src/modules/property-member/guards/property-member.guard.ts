/**
 * PropertyMemberGuard
 *
 * Controls access to property-level operations based on PropertyRole.
 * Used in conjunction with @PropertyAccess() decorator.
 *
 * Access resolution:
 * 1. SUPER_ADMIN / PARTNER_ADMIN → bypass (full access)
 * 2. VENDOR_ADMIN of the property's vendor → bypass
 * 3. User with matching PropertyRole on the listing → allowed
 * 4. Otherwise → ForbiddenException
 *
 * The guard extracts the listingId from route params:
 *   - req.params.listingId (e.g. /properties/:listingId/members)
 *   - or from the request body (e.g. dto.listingId)
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard, PropertyMemberGuard)
 * @Roles(Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
 * @PropertyAccess(PropertyRole.PROPERTY_ADMIN, PropertyRole.PROPERTY_MANAGER)
 * async someAction() { ... }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PropertyRole, Role } from '@prisma/client';
import { PrismaService } from '@infrastructure/database';
import { PROPERTY_ROLES_KEY } from '../decorators/property-access.decorator';

@Injectable()
export class PropertyMemberGuard implements CanActivate {
  private readonly logger = new Logger(PropertyMemberGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required PropertyRoles from @PropertyAccess() decorator
    const requiredRoles = this.reflector.getAllAndOverride<PropertyRole[]>(
      PROPERTY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @PropertyAccess() decorator is present, allow (guard is opt-in)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const { role, sub: userId } = user;

    // 1. SUPER_ADMIN / PARTNER_ADMIN bypass
    if (role === Role.SUPER_ADMIN || role === Role.PARTNER_ADMIN) {
      return true;
    }

    // Extract listingId from route params or request body
    const listingId =
      request.params?.listingId ||
      request.body?.listingId;

    if (!listingId) {
      this.logger.warn(
        `PropertyMemberGuard: No listingId found in params or body for user ${userId}`,
      );
      throw new ForbiddenException('Cannot determine property for access check');
    }

    // 2. VENDOR_ADMIN bypass for own vendor's listings
    if (role === Role.VENDOR_ADMIN) {
      const primaryVendor = await this.prisma.userVendor.findFirst({
        where: { userId, isPrimary: true },
        select: { vendorId: true },
      });

      if (primaryVendor) {
        const listing = await this.prisma.listing.findFirst({
          where: { id: listingId, vendorId: primaryVendor.vendorId, deletedAt: null },
        });

        if (listing) {
          return true;
        }
      }
    }

    // 3. Check PropertyMember for this user on this listing
    const member = await this.prisma.propertyMember.findFirst({
      where: {
        listingId,
        userId,
        removedAt: null,
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'You do not have access to this property',
      );
    }

    // 4. Check if user's PropertyRole matches any of the required roles
    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Property role ${member.role} is not sufficient. Required: ${requiredRoles.join(', ')}`,
      );
    }

    // Attach property member info to request for downstream use
    request.propertyMember = member;

    return true;
  }
}
