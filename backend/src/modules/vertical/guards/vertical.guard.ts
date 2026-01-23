/**
 * Vertical Guard
 * Part 8 - Vertical Module Contract
 *
 * Protects routes based on whether a vertical is enabled for the tenant.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { TenantVerticalRepository } from '../repositories/tenant-vertical.repository';

export const REQUIRED_VERTICAL_KEY = 'required_vertical';

/**
 * Decorator to mark a route as requiring a specific vertical to be enabled.
 * @param verticalType The vertical type required (e.g., 'real_estate')
 */
export const RequireVertical = (verticalType: string) =>
  SetMetadata(REQUIRED_VERTICAL_KEY, verticalType);

@Injectable()
export class VerticalGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantVerticalRepo: TenantVerticalRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required vertical from decorator
    const requiredVertical = this.reflector.getAllAndOverride<string>(REQUIRED_VERTICAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no vertical required, allow access
    if (!requiredVertical) {
      return true;
    }

    // Get tenant ID from request
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Check if vertical is enabled for tenant
    const isEnabled = await this.tenantVerticalRepo.isVerticalEnabledForTenant(
      tenantId,
      requiredVertical,
    );

    if (!isEnabled) {
      throw new ForbiddenException(`Vertical '${requiredVertical}' is not enabled for this tenant`);
    }

    return true;
  }
}

/**
 * Decorator to check if any of the specified verticals are enabled.
 * @param verticalTypes Array of vertical types (any one must be enabled)
 */
export const REQUIRED_ANY_VERTICAL_KEY = 'required_any_vertical';

export const RequireAnyVertical = (...verticalTypes: string[]) =>
  SetMetadata(REQUIRED_ANY_VERTICAL_KEY, verticalTypes);

@Injectable()
export class AnyVerticalGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantVerticalRepo: TenantVerticalRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required verticals from decorator
    const requiredVerticals = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ANY_VERTICAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no verticals required, allow access
    if (!requiredVerticals || requiredVerticals.length === 0) {
      return true;
    }

    // Get tenant ID from request
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Get enabled verticals for tenant
    const enabledVerticals = await this.tenantVerticalRepo.getEnabledVerticalTypes(tenantId);

    // Check if any required vertical is enabled
    const hasEnabledVertical = requiredVerticals.some((v) => enabledVerticals.includes(v));

    if (!hasEnabledVertical) {
      throw new ForbiddenException(
        `None of the required verticals (${requiredVerticals.join(', ')}) are enabled for this tenant`,
      );
    }

    return true;
  }
}
