/**
 * Audit Interceptor
 * Session 4.4 - Audit Logging
 *
 * NestJS interceptor for automatic audit logging on controller actions.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditActorType } from '@prisma/client';

import { AuditService } from '../audit.service';
import { AuditTargetType } from '../types/audit.types';

/**
 * Metadata key for audit configuration.
 */
export const AUDIT_KEY = 'audit';

/**
 * Configuration for the @Audit() decorator.
 */
export interface AuditOptions {
  /** Action type (e.g., 'user.created', 'listing.updated') */
  actionType: string;

  /** Target type (e.g., 'user', 'listing') */
  targetType: AuditTargetType | string;

  /** Path to target ID in request (e.g., 'params.id', 'body.id') */
  targetIdPath?: string;

  /** Whether to capture request body as newValue */
  captureBody?: boolean;

  /** Whether to capture response as newValue */
  captureResponse?: boolean;

  /** Custom metadata extractor */
  metadataExtractor?: (req: Request, response: unknown) => Record<string, unknown>;
}

/**
 * Decorator to mark a controller method for automatic audit logging.
 *
 * @example
 * ```typescript
 * @Audit({
 *   actionType: 'user.updated',
 *   targetType: 'user',
 *   targetIdPath: 'params.id',
 *   captureBody: true,
 * })
 * @Patch(':id')
 * async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
 *   return this.userService.update(id, dto);
 * }
 * ```
 */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);

/**
 * Interceptor that automatically logs audit events for decorated endpoints.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.get<AuditOptions>(AUDIT_KEY, context.getHandler());

    // Skip if no audit metadata
    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const _startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.logAudit(request, response, auditOptions, true);
        },
        error: (error) => {
          this.logAudit(request, { error: error.message, code: error.code }, auditOptions, false);
        },
      }),
    );
  }

  private logAudit(
    request: Request,
    response: unknown,
    options: AuditOptions,
    success: boolean,
  ): void {
    // Extract user from request (set by auth guard)
    const user = (request as Request & { user?: { id: string; email?: string; role?: string } })
      .user;
    const partnerId = (request as Request & { partnerId?: string }).partnerId;

    // Determine actor type
    let actorType: AuditActorType = AuditActorType.ANONYMOUS;
    if (user) {
      actorType =
        user.role === 'SUPER_ADMIN' || user.role === 'PARTNER_ADMIN'
          ? AuditActorType.ADMIN
          : AuditActorType.USER;
    }

    // Extract target ID
    let targetId: string | undefined;
    if (options.targetIdPath) {
      targetId = this.getValueByPath(request, options.targetIdPath);
    }
    // Fallback: try to get from response
    if (!targetId && response && typeof response === 'object') {
      const resp = response as Record<string, unknown>;
      if (resp.data && typeof resp.data === 'object') {
        const data = resp.data as Record<string, unknown>;
        targetId = data.id as string | undefined;
      } else if (resp.id) {
        targetId = resp.id as string;
      }
    }

    // Build new value
    let newValue: Record<string, unknown> | undefined;
    if (options.captureBody && request.body) {
      newValue = request.body as Record<string, unknown>;
    }
    if (options.captureResponse && response && typeof response === 'object') {
      const resp = response as Record<string, unknown>;
      newValue = resp.data ? (resp.data as Record<string, unknown>) : resp;
    }

    // Extract custom metadata
    let metadata: Record<string, unknown> | undefined;
    if (options.metadataExtractor) {
      metadata = options.metadataExtractor(request, response);
    }

    // Add success flag to metadata
    metadata = {
      ...metadata,
      success,
    };

    // Log asynchronously
    this.auditService.log({
      partnerId,
      actorType,
      actorId: user?.id,
      actorEmail: user?.email,
      actionType: options.actionType,
      targetType: options.targetType,
      targetId,
      newValue,
      metadata,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      requestId: request.headers['x-request-id'] as string | undefined,
    });
  }

  /**
   * Get a value from request by dot-notation path.
   */
  private getValueByPath(request: Request, path: string): string | undefined {
    const parts = path.split('.');
    let current: unknown = request;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Extract client IP from request.
   */
  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips?.trim();
    }
    return request.ip || request.socket.remoteAddress;
  }
}
