import { applyDecorators, SetMetadata } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Options for OnEvent decorator
 */
interface EventHandlerOptions {
  /** If true, event will be handled asynchronously */
  async?: boolean;
  /** If true, Promise will be returned */
  promisify?: boolean;
  /** If true, errors will be suppressed */
  suppressErrors?: boolean;
}

/**
 * Metadata key for domain event handlers
 */
export const DOMAIN_EVENT_HANDLER_METADATA = 'domain_event_handler';

/**
 * Decorator for domain event handlers.
 * Wraps NestJS OnEvent with additional metadata for domain events.
 *
 * @param eventType - Event type to listen for (e.g., "listing.listing.published")
 * @param options - Optional event handler options
 *
 * @example
 * ```typescript
 * @DomainEventHandler('listing.listing.published')
 * async handleListingPublished(event: DomainEvent<ListingPublishedPayload>) {
 *   // Handle the event
 * }
 * ```
 */
export function DomainEventHandler(
  eventType: string,
  options?: EventHandlerOptions,
): MethodDecorator {
  return applyDecorators(
    SetMetadata(DOMAIN_EVENT_HANDLER_METADATA, { eventType }),
    OnEvent(eventType, {
      async: true,
      promisify: true,
      ...options,
    }),
  );
}

/**
 * Decorator for wildcard domain event handlers.
 * Listens to all events in a domain (e.g., "listing.*").
 *
 * @param domain - Domain to listen for (e.g., "listing")
 * @param options - Optional event handler options
 *
 * @example
 * ```typescript
 * @DomainWildcardHandler('listing')
 * async handleAllListingEvents(event: DomainEvent<unknown>) {
 *   // Handle any listing event
 * }
 * ```
 */
export function DomainWildcardHandler(
  domain: string,
  options?: EventHandlerOptions,
): MethodDecorator {
  return applyDecorators(
    SetMetadata(DOMAIN_EVENT_HANDLER_METADATA, { domain, wildcard: true }),
    OnEvent(`${domain}.*`, {
      async: true,
      promisify: true,
      ...options,
    }),
  );
}
