import { SetMetadata } from '@nestjs/common';
import type { PropertyRole } from '@prisma/client';

export const PROPERTY_ROLES_KEY = 'propertyRoles';

/**
 * Decorator to specify which PropertyRole(s) are required for a route.
 * Used in conjunction with PropertyMemberGuard.
 *
 * Access resolution:
 * 1. SUPER_ADMIN / PARTNER_ADMIN → always bypass
 * 2. VENDOR_ADMIN of the property's vendor → bypass
 * 3. User with matching PropertyRole on the listing → allowed
 * 4. Otherwise → ForbiddenException
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard, PropertyMemberGuard)
 * @Roles(Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
 * @PropertyAccess(PropertyRole.PROPERTY_ADMIN, PropertyRole.PROPERTY_MANAGER, PropertyRole.MAINTENANCE_STAFF)
 * async createMaintenanceTicket() { ... }
 */
export const PropertyAccess = (...roles: PropertyRole[]) =>
  SetMetadata(PROPERTY_ROLES_KEY, roles);
