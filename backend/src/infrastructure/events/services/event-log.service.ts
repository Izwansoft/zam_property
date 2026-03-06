import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { DomainEvent } from '../domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * EventLogService - Audit trail and event sourcing foundation
 *
 * Per Part 28:
 * - All events are persisted for audit trail and compliance
 * - Events can be replayed to rebuild projections
 * - Wildcard listener catches ALL events automatically
 * - Logging failures never block business logic
 */
@Injectable()
export class EventLogService {
  private readonly logger = new Logger(EventLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate if an object is a proper DomainEvent
   */
  private isDomainEvent(event: unknown): event is DomainEvent<unknown> {
    if (!event || typeof event !== 'object') return false;
    const e = event as Record<string, unknown>;
    return (
      typeof e.eventId === 'string' &&
      typeof e.eventType === 'string' &&
      typeof e.eventVersion === 'string' &&
      typeof e.correlationId === 'string' &&
      typeof e.occurredAt === 'string' &&
      !isNaN(new Date(e.occurredAt).getTime())
    );
  }

  /**
   * Wildcard event listener - catches ALL events
   * This ensures complete audit trail without manual wiring
   */
  @OnEvent('**')
  async logEvent(event: unknown): Promise<void> {
    try {
      // Only persist properly structured domain events
      if (this.isDomainEvent(event)) {
        await this.persistEvent(event);
      } else {
        // Log non-standard events for debugging but don't persist
        this.logger.debug('Received non-standard event, skipping persistence', {
          eventType:
            typeof event === 'object' ? (event as Record<string, unknown>).eventType : 'unknown',
        });
      }
    } catch (error) {
      // Never throw - logging failures must not break business logic
      this.logger.error('Failed to log event', {
        error: error instanceof Error ? error.message : String(error),
        eventId: this.isDomainEvent(event) ? event.eventId : 'unknown',
        eventType:
          typeof event === 'object' ? (event as Record<string, unknown>).eventType : 'unknown',
      });
    }
  }

  /**
   * Persist event to database for audit trail
   */
  private async persistEvent(event: DomainEvent<unknown>): Promise<void> {
    // Use a new UUID to avoid conflicts if event is replayed
    const logId = randomUUID();

    await this.prisma.eventLog.create({
      data: {
        id: logId,
        eventType: event.eventType,
        eventVersion: event.eventVersion,
        partnerId: event.partnerId,
        correlationId: event.correlationId,
        causationId: event.causationId ?? undefined,
        actorType: event.actorType,
        actorId: event.actorId ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: event.payload as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: { ...((event.metadata as object) || {}), originalEventId: event.eventId } as any,
        occurredAt: new Date(event.occurredAt),
      },
    });

    this.logger.debug('Event logged', {
      logId,
      eventId: event.eventId,
      eventType: event.eventType,
    });
  }

  /**
   * Query events with filters
   * Used for debugging, compliance audits, and analytics
   */
  async getEvents(params: {
    partnerId?: string | null;
    eventType?: string;
    correlationId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const { partnerId, eventType, correlationId, startDate, endDate, limit = 100 } = params;

    return this.prisma.eventLog.findMany({
      where: {
        ...(partnerId !== undefined && { partnerId }),
        ...(eventType && { eventType }),
        ...(correlationId && { correlationId }),
        ...(startDate || endDate
          ? {
              occurredAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { occurredAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Get all events in a workflow by correlation ID
   * Used for distributed tracing and debugging
   */
  async getEventsByCorrelation(correlationId: string) {
    return this.prisma.eventLog.findMany({
      where: { correlationId },
      orderBy: { occurredAt: 'asc' },
    });
  }

  /**
   * Replay events to rebuild projections
   * Returns an async generator for memory-efficient streaming
   *
   * Example usage:
   * for await (const events of eventLogService.replayEvents({ partnerId: 'partner-1' })) {
   *   // Process batch of events
   * }
   */
  async *replayEvents(params: {
    partnerId?: string | null;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    batchSize?: number;
  }): AsyncGenerator<DomainEvent<unknown>[], void, unknown> {
    const { partnerId, eventType, startDate, endDate, batchSize = 1000 } = params;

    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const events = await this.prisma.eventLog.findMany({
        where: {
          ...(partnerId !== undefined && { partnerId }),
          ...(eventType && { eventType }),
          ...(startDate || endDate
            ? {
                occurredAt: {
                  ...(startDate && { gte: startDate }),
                  ...(endDate && { lte: endDate }),
                },
              }
            : {}),
          ...(cursor && { id: { gt: cursor } }),
        },
        orderBy: { occurredAt: 'asc' },
        take: batchSize,
      });

      if (events.length === 0) {
        hasMore = false;
        break;
      }

      // Map database records back to DomainEvent interface
      const domainEvents: DomainEvent<unknown>[] = events.map((e) => ({
        eventId: e.id,
        eventType: e.eventType,
        eventVersion: e.eventVersion,
        partnerId: e.partnerId,
        correlationId: e.correlationId,
        causationId: e.causationId ?? undefined,
        actorType: e.actorType as 'user' | 'system' | 'admin',
        actorId: e.actorId ?? undefined,
        payload: e.payload as unknown,
        occurredAt: e.occurredAt.toISOString(),
        metadata: e.metadata as Record<string, unknown> | undefined,
      }));

      yield domainEvents;

      if (events.length < batchSize) {
        hasMore = false;
      } else {
        cursor = events[events.length - 1].id;
      }
    }
  }
}
