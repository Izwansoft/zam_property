/**
 * Vertical Maintenance Mode Interceptor
 *
 * Intercepts requests to vertical-specific endpoints and returns 503 Service Unavailable
 * if the vertical is currently under maintenance.
 *
 * Usage:
 *   @UseInterceptors(VerticalMaintenanceInterceptor)
 *   @VerticalType('real_estate')
 *   class RealEstateController { ... }
 *
 * Or apply globally for automatic detection based on route pattern.
 *
 * @see docs/ai-prompt/part-11.md - Vertical Layer
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ServiceUnavailableException,
  SetMetadata,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { PrismaService } from '../../infrastructure/database/prisma.service';

// =============================================================================
// DECORATOR
// =============================================================================

export const VERTICAL_TYPE_KEY = 'vertical_type';

/**
 * Decorator to mark a controller/route with a specific vertical type.
 * The interceptor will check if this vertical is under maintenance.
 *
 * @example
 * ```ts
 * @VerticalType('real_estate')
 * @Controller('real-estate')
 * export class RealEstateController { ... }
 * ```
 */
export const VerticalType = (type: string) => SetMetadata(VERTICAL_TYPE_KEY, type);

/**
 * Decorator to skip maintenance check for specific routes.
 *
 * @example
 * ```ts
 * @SkipMaintenanceCheck()
 * @Get('health')
 * healthCheck() { ... }
 * ```
 */
export const SKIP_MAINTENANCE_KEY = 'skip_maintenance_check';
export const SkipMaintenanceCheck = () => SetMetadata(SKIP_MAINTENANCE_KEY, true);

// =============================================================================
// ROUTE-TO-VERTICAL MAPPING
// =============================================================================

/**
 * Map of URL path prefixes to vertical types.
 * Used for automatic detection when @VerticalType is not specified.
 */
const ROUTE_VERTICAL_MAP: Record<string, string> = {
  '/api/v1/real-estate': 'real_estate',
  '/api/v1/properties': 'real_estate',
  '/api/v1/automotive': 'automotive',
  '/api/v1/vehicles': 'automotive',
  '/api/v1/jobs': 'jobs',
  '/api/v1/services': 'services',
  '/api/v1/electronics': 'electronics',
  '/api/v1/fashion': 'fashion',
  // Add more verticals as they are implemented
};

// =============================================================================
// INTERCEPTOR
// =============================================================================

@Injectable()
export class VerticalMaintenanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(VerticalMaintenanceInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if route is marked to skip maintenance check
    const skipMaintenance = this.reflector.getAllAndOverride<boolean>(SKIP_MAINTENANCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipMaintenance) {
      return next.handle();
    }

    // Get vertical type from decorator or detect from URL
    let verticalType = this.reflector.getAllAndOverride<string>(VERTICAL_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no decorator, try to detect from URL pattern
    if (!verticalType) {
      const path = request.path;
      for (const [prefix, type] of Object.entries(ROUTE_VERTICAL_MAP)) {
        if (path.startsWith(prefix)) {
          verticalType = type;
          break;
        }
      }
    }

    // If still no vertical type, skip maintenance check
    if (!verticalType) {
      return next.handle();
    }

    // Check if vertical is under maintenance
    const isUnderMaintenance = await this.checkMaintenanceStatus(verticalType);

    if (isUnderMaintenance.active) {
      this.logger.warn(
        `Request to ${request.path} blocked - vertical '${verticalType}' is under maintenance`,
      );

      throw new ServiceUnavailableException({
        statusCode: 503,
        error: 'Service Unavailable',
        message:
          isUnderMaintenance.message ||
          'This service is currently under maintenance. Please try again later.',
        code: 'VERTICAL_MAINTENANCE',
        vertical: verticalType,
        estimatedEndAt: isUnderMaintenance.endAt,
      });
    }

    return next.handle();
  }

  /**
   * Check if a vertical is currently under maintenance.
   */
  private async checkMaintenanceStatus(verticalType: string): Promise<{
    active: boolean;
    message?: string | null;
    endAt?: Date | null;
  }> {
    try {
      const vertical = await this.prisma.verticalDefinition.findUnique({
        where: { type: verticalType },
        select: {
          maintenanceMode: true,
          maintenanceStartAt: true,
          maintenanceEndAt: true,
          maintenanceMessage: true,
        },
      });

      if (!vertical) {
        // Vertical not found in DB, allow request
        return { active: false };
      }

      if (!vertical.maintenanceMode) {
        return { active: false };
      }

      const now = new Date();

      // Check if maintenance has started
      if (vertical.maintenanceStartAt && new Date(vertical.maintenanceStartAt) > now) {
        // Maintenance scheduled but not started yet
        return { active: false };
      }

      // Check if maintenance has ended
      if (vertical.maintenanceEndAt && new Date(vertical.maintenanceEndAt) < now) {
        // Maintenance period has passed, should auto-disable
        // (But we still respect the flag in case admin wants to keep it)
        return { active: false };
      }

      // Maintenance is active
      return {
        active: true,
        message: vertical.maintenanceMessage,
        endAt: vertical.maintenanceEndAt,
      };
    } catch (error) {
      // On error, fail open (allow request) to prevent total lockout
      this.logger.error(`Failed to check maintenance status for ${verticalType}: ${error}`);
      return { active: false };
    }
  }
}
