/**
 * Audit Service
 * Session 4.4 - Audit Logging
 *
 * Service for recording audit events with async logging,
 * sensitive data masking, and event-driven integration.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditActorType, Prisma } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';

import {
  AuditLogEntry,
  AuditLogFilters,
  CreateAuditLogOptions,
  AuditActionType,
  AuditTargetType,
} from './types/audit.types';
import {
  maskSensitiveData,
  truncateForAudit,
  getChangedFields,
} from './utils/mask-sensitive-data.util';

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry (async, non-blocking).
   */
  async log(options: CreateAuditLogOptions): Promise<void> {
    // Fire and forget - don't block the main flow
    setImmediate(() => {
      this.createAuditLog(options).catch((error) => {
        this.logger.error(`Failed to create audit log: ${error.message}`, {
          actionType: options.actionType,
          targetType: options.targetType,
          targetId: options.targetId,
          error: error.message,
        });
      });
    });
  }

  /**
   * Create an audit log entry (sync, for when you need confirmation).
   */
  async logSync(options: CreateAuditLogOptions): Promise<AuditLogEntry> {
    return this.createAuditLog(options);
  }

  /**
   * Internal method to create the audit log.
   */
  private async createAuditLog(options: CreateAuditLogOptions): Promise<AuditLogEntry> {
    // Mask sensitive data
    const maskedOldValue = options.oldValue
      ? maskSensitiveData(truncateForAudit(options.oldValue))
      : undefined;
    const maskedNewValue = options.newValue
      ? maskSensitiveData(truncateForAudit(options.newValue))
      : undefined;
    const maskedMetadata = options.metadata
      ? maskSensitiveData(truncateForAudit(options.metadata))
      : undefined;

    const auditLog = await this.prisma.auditLog.create({
      data: {
        partnerId: options.partnerId || null,
        actorType: options.actorType,
        actorId: options.actorId || null,
        actorEmail: options.actorEmail || null,
        actionType: options.actionType,
        targetType: options.targetType,
        targetId: options.targetId || null,
        oldValue: maskedOldValue as Prisma.InputJsonValue,
        newValue: maskedNewValue as Prisma.InputJsonValue,
        metadata: maskedMetadata as Prisma.InputJsonValue,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent ? options.userAgent.substring(0, 500) : null,
        requestId: options.requestId || null,
      },
    });

    this.logger.debug(`Audit log created: ${options.actionType} on ${options.targetType}`);

    return this.mapToEntry(auditLog);
  }

  /**
   * Log an entity creation.
   */
  async logCreate(
    partnerId: string | undefined,
    actorType: AuditActorType,
    actorId: string | undefined,
    targetType: AuditTargetType | string,
    targetId: string,
    newValue: Record<string, unknown>,
    context?: {
      actorEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.log({
      partnerId,
      actorType,
      actorId,
      actorEmail: context?.actorEmail,
      actionType: `${targetType}.created`,
      targetType,
      targetId,
      newValue,
      metadata: context?.metadata,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
    });
  }

  /**
   * Log an entity update.
   */
  async logUpdate(
    partnerId: string | undefined,
    actorType: AuditActorType,
    actorId: string | undefined,
    targetType: AuditTargetType | string,
    targetId: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    context?: {
      actorEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    // Only log changed fields
    const { oldFields, newFields } = getChangedFields(oldValue, newValue);

    // Skip if no changes
    if (Object.keys(oldFields).length === 0 && Object.keys(newFields).length === 0) {
      return;
    }

    await this.log({
      partnerId,
      actorType,
      actorId,
      actorEmail: context?.actorEmail,
      actionType: `${targetType}.updated`,
      targetType,
      targetId,
      oldValue: oldFields,
      newValue: newFields,
      metadata: context?.metadata,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
    });
  }

  /**
   * Log an entity deletion.
   */
  async logDelete(
    partnerId: string | undefined,
    actorType: AuditActorType,
    actorId: string | undefined,
    targetType: AuditTargetType | string,
    targetId: string,
    oldValue: Record<string, unknown>,
    context?: {
      actorEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.log({
      partnerId,
      actorType,
      actorId,
      actorEmail: context?.actorEmail,
      actionType: `${targetType}.deleted`,
      targetType,
      targetId,
      oldValue,
      metadata: context?.metadata,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
    });
  }

  /**
   * Log a status change.
   */
  async logStatusChange(
    partnerId: string | undefined,
    actorType: AuditActorType,
    actorId: string | undefined,
    targetType: AuditTargetType | string,
    targetId: string,
    oldStatus: string,
    newStatus: string,
    context?: {
      actorEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.log({
      partnerId,
      actorType,
      actorId,
      actorEmail: context?.actorEmail,
      actionType: `${targetType}.status_changed`,
      targetType,
      targetId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      metadata: context?.metadata,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
    });
  }

  /**
   * Log an authentication event.
   */
  async logAuth(
    actionType: AuditActionType,
    partnerId: string | undefined,
    actorId: string | undefined,
    actorEmail: string | undefined,
    success: boolean,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.log({
      partnerId,
      actorType: actorId ? AuditActorType.USER : AuditActorType.ANONYMOUS,
      actorId,
      actorEmail,
      actionType,
      targetType: AuditTargetType.USER,
      targetId: actorId,
      metadata: {
        ...context?.metadata,
        success,
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
    });
  }

  /**
   * Log an admin action.
   */
  async logAdminAction(
    actionType: AuditActionType,
    adminId: string,
    adminEmail: string | undefined,
    targetType: AuditTargetType | string,
    targetId: string | undefined,
    partnerId: string | undefined,
    context?: {
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.log({
      partnerId,
      actorType: AuditActorType.ADMIN,
      actorId: adminId,
      actorEmail: adminEmail,
      actionType,
      targetType,
      targetId,
      oldValue: context?.oldValue,
      newValue: context?.newValue,
      metadata: context?.metadata,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      requestId: context?.requestId,
    });
  }

  /**
   * Query audit logs with filters and pagination.
   */
  async findAll(filters: AuditLogFilters, page = 1, pageSize = 20): Promise<PaginatedAuditLogs> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.partnerId) {
      where.partnerId = filters.partnerId;
    }
    if (filters.actorId) {
      where.actorId = filters.actorId;
    }
    if (filters.actorType) {
      where.actorType = filters.actorType;
    }
    if (filters.actionType) {
      where.actionType = filters.actionType;
    }
    if (filters.targetType) {
      where.targetType = filters.targetType;
    }
    if (filters.targetId) {
      where.targetId = filters.targetId;
    }
    if (filters.requestId) {
      where.requestId = filters.requestId;
    }
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [data, totalItems] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: data.map((log) => this.mapToEntry(log)),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  /**
   * Get audit logs for a specific entity.
   */
  async findByTarget(
    targetType: string,
    targetId: string,
    partnerId?: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedAuditLogs> {
    return this.findAll(
      {
        targetType,
        targetId,
        partnerId,
      },
      page,
      pageSize,
    );
  }

  /**
   * Get audit logs for a specific actor.
   */
  async findByActor(
    actorId: string,
    partnerId?: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedAuditLogs> {
    return this.findAll(
      {
        actorId,
        partnerId,
      },
      page,
      pageSize,
    );
  }

  /**
   * Get a single audit log by ID.
   */
  async findById(id: string, partnerId?: string): Promise<AuditLogEntry | null> {
    const where: Prisma.AuditLogWhereInput = { id };
    if (partnerId) {
      where.partnerId = partnerId;
    }

    const log = await this.prisma.auditLog.findFirst({ where });
    return log ? this.mapToEntry(log) : null;
  }

  /**
   * Get distinct action types (for filtering UI).
   */
  async getActionTypes(partnerId?: string): Promise<string[]> {
    const result = await this.prisma.auditLog.findMany({
      where: partnerId ? { partnerId } : {},
      select: { actionType: true },
      distinct: ['actionType'],
      orderBy: { actionType: 'asc' },
    });

    return result.map((r) => r.actionType);
  }

  /**
   * Get distinct target types (for filtering UI).
   */
  async getTargetTypes(partnerId?: string): Promise<string[]> {
    const result = await this.prisma.auditLog.findMany({
      where: partnerId ? { partnerId } : {},
      select: { targetType: true },
      distinct: ['targetType'],
      orderBy: { targetType: 'asc' },
    });

    return result.map((r) => r.targetType);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Event Listeners (Event-Driven Auditing)
  // ─────────────────────────────────────────────────────────────────────────

  @OnEvent('user.created')
  async handleUserCreated(payload: {
    partnerId: string;
    userId: string;
    email: string;
    actorId?: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    await this.log({
      partnerId: payload.partnerId,
      actorType: payload.actorId ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: payload.actorId,
      actionType: AuditActionType.USER_CREATED,
      targetType: AuditTargetType.USER,
      targetId: payload.userId,
      newValue: payload.data,
    });
  }

  @OnEvent('vendor.approved')
  async handleVendorApproved(payload: {
    partnerId: string;
    vendorId: string;
    actorId: string;
    actorEmail?: string;
  }): Promise<void> {
    await this.log({
      partnerId: payload.partnerId,
      actorType: AuditActorType.ADMIN,
      actorId: payload.actorId,
      actorEmail: payload.actorEmail,
      actionType: AuditActionType.VENDOR_APPROVED,
      targetType: AuditTargetType.VENDOR,
      targetId: payload.vendorId,
    });
  }

  @OnEvent('vendor.rejected')
  async handleVendorRejected(payload: {
    partnerId: string;
    vendorId: string;
    actorId: string;
    actorEmail?: string;
    reason?: string;
  }): Promise<void> {
    await this.log({
      partnerId: payload.partnerId,
      actorType: AuditActorType.ADMIN,
      actorId: payload.actorId,
      actorEmail: payload.actorEmail,
      actionType: AuditActionType.VENDOR_REJECTED,
      targetType: AuditTargetType.VENDOR,
      targetId: payload.vendorId,
      metadata: payload.reason ? { reason: payload.reason } : undefined,
    });
  }

  @OnEvent('listing.published')
  async handleListingPublished(payload: {
    partnerId: string;
    listingId: string;
    vendorId: string;
    actorId?: string;
  }): Promise<void> {
    await this.log({
      partnerId: payload.partnerId,
      actorType: payload.actorId ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: payload.actorId,
      actionType: AuditActionType.LISTING_PUBLISHED,
      targetType: AuditTargetType.LISTING,
      targetId: payload.listingId,
      metadata: { vendorId: payload.vendorId },
    });
  }

  @OnEvent('subscription.created')
  async handleSubscriptionCreated(payload: {
    partnerId: string;
    subscriptionId: string;
    planId: string;
    actorId?: string;
  }): Promise<void> {
    await this.log({
      partnerId: payload.partnerId,
      actorType: payload.actorId ? AuditActorType.USER : AuditActorType.SYSTEM,
      actorId: payload.actorId,
      actionType: AuditActionType.SUBSCRIPTION_CREATED,
      targetType: AuditTargetType.SUBSCRIPTION,
      targetId: payload.subscriptionId,
      metadata: { planId: payload.planId },
    });
  }

  /**
   * Map Prisma model to DTO.
   */
  private mapToEntry(log: Prisma.AuditLogGetPayload<Record<string, never>>): AuditLogEntry {
    return {
      id: log.id,
      partnerId: log.partnerId || undefined,
      actorType: log.actorType,
      actorId: log.actorId || undefined,
      actorEmail: log.actorEmail || undefined,
      actionType: log.actionType,
      targetType: log.targetType,
      targetId: log.targetId || undefined,
      oldValue: log.oldValue as Record<string, unknown> | undefined,
      newValue: log.newValue as Record<string, unknown> | undefined,
      metadata: log.metadata as Record<string, unknown> | undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      requestId: log.requestId || undefined,
      timestamp: log.timestamp,
    };
  }
}
