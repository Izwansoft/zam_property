import { randomUUID } from 'crypto';
import { DomainEvent, ActorType } from './domain-event.interface';

/**
 * Options for creating a domain event
 */
export interface CreateEventOptions<T> {
  /** Event type in format: domain.entity.action */
  eventType: string;

  /** Event payload */
  payload: T;

  /** Tenant ID, null for platform-level events */
  tenantId: string | null;

  /** Request correlation ID */
  correlationId: string;

  /** Actor type */
  actorType?: ActorType;

  /** Actor ID */
  actorId?: string;

  /** Causation ID (parent event ID) */
  causationId?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Options without eventType (used by specific event classes)
 */
export type EventOptionsWithoutType<T> = Omit<CreateEventOptions<T>, 'eventType'>;

/**
 * Abstract base class for domain events.
 * Provides factory method and common functionality.
 */
export abstract class BaseDomainEvent<T = unknown> implements DomainEvent<T> {
  readonly eventId: string;
  readonly eventType: string;
  readonly eventVersion: string;
  readonly tenantId: string | null;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly actorType: ActorType;
  readonly actorId?: string;
  readonly payload: T;
  readonly occurredAt: string;
  readonly metadata?: Record<string, unknown>;

  protected constructor(options: CreateEventOptions<T>, version = '1.0') {
    this.eventId = randomUUID();
    this.eventType = options.eventType;
    this.eventVersion = version;
    this.tenantId = options.tenantId;
    this.correlationId = options.correlationId;
    this.causationId = options.causationId;
    this.actorType = options.actorType ?? 'system';
    this.actorId = options.actorId;
    this.payload = options.payload;
    this.occurredAt = new Date().toISOString();
    this.metadata = options.metadata;
  }

  /**
   * Create a child event (for event chains)
   */
  createChildOptions<U>(eventType: string, payload: U): CreateEventOptions<U> {
    return {
      eventType,
      payload,
      tenantId: this.tenantId,
      correlationId: this.correlationId,
      causationId: this.eventId,
      actorType: this.actorType,
      actorId: this.actorId,
    };
  }
}

/**
 * Generic domain event implementation.
 * Use this when you don't need a specific event class.
 */
export class GenericDomainEvent<T = unknown> extends BaseDomainEvent<T> {
  constructor(options: CreateEventOptions<T>, version = '1.0') {
    super(options, version);
  }

  /**
   * Factory method to create a domain event
   */
  static create<T>(options: CreateEventOptions<T>, version = '1.0'): GenericDomainEvent<T> {
    return new GenericDomainEvent(options, version);
  }
}
