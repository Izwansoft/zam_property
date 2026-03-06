/**
 * Base domain event interface per part-28.md specification.
 * All domain events must follow this structure.
 */
export interface DomainEvent<T = unknown> {
  /** UUID, unique per event */
  eventId: string;

  /** Event type in format: domain.entity.action (e.g., "listing.listing.published") */
  eventType: string;

  /** Event schema version (e.g., "1.0") */
  eventVersion: string;

  /** Partner ID, null for platform-level events */
  partnerId: string | null;

  /** Request/trace correlation ID */
  correlationId: string;

  /** ID of event that caused this event (for event chains) */
  causationId?: string;

  /** Actor type */
  actorType: 'user' | 'system' | 'admin';

  /** Actor ID (user ID or system identifier) */
  actorId?: string;

  /** Event-specific payload */
  payload: T;

  /** ISO 8601 timestamp when event occurred */
  occurredAt: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Actor types for domain events
 */
export type ActorType = 'user' | 'system' | 'admin';

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;
