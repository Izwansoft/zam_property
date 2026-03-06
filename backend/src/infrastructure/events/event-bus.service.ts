import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from './domain-event.interface';
import { CreateEventOptions, GenericDomainEvent } from './base-domain-event';

/**
 * EventBus service for publishing and subscribing to domain events.
 * Uses NestJS EventEmitter2 for in-process event handling.
 *
 * Per part-28.md:
 * - Events represent facts that have happened (past tense)
 * - Events are immutable once emitted
 * - Event handlers must be idempotent
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publish a domain event.
   * The event is emitted to all registered handlers.
   *
   * @param event - The domain event to publish
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    this.logger.debug(`Publishing event: ${event.eventType} (id: ${event.eventId})`);

    // Emit with full event type (e.g., "listing.listing.published")
    await this.eventEmitter.emitAsync(event.eventType, event);

    // Also emit with wildcard patterns for broader listeners
    // e.g., "listing.*" would catch all listing events
    const parts = event.eventType.split('.');
    if (parts.length >= 2) {
      await this.eventEmitter.emitAsync(`${parts[0]}.*`, event);
    }

    this.logger.log({
      message: 'Event published',
      eventId: event.eventId,
      eventType: event.eventType,
      partnerId: event.partnerId,
      correlationId: event.correlationId,
    });
  }

  /**
   * Publish multiple events in order.
   *
   * @param events - Array of domain events to publish
   */
  async publishAll<T>(events: DomainEvent<T>[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Create and publish a domain event in one step.
   *
   * @param options - Event creation options
   * @param version - Event schema version
   */
  async emit<T>(options: CreateEventOptions<T>, version = '1.0'): Promise<DomainEvent<T>> {
    const event = GenericDomainEvent.create(options, version);
    await this.publish(event);
    return event;
  }

  /**
   * Get the underlying EventEmitter2 for advanced usage.
   * Prefer using the typed methods above.
   */
  getEmitter(): EventEmitter2 {
    return this.eventEmitter;
  }
}
