import { BaseDomainEvent, EventOptionsWithoutType } from '../base-domain-event';

// ─────────────────────────────────────────────────────────────────────────────
// LISTING EVENTS
// Per Part 28: Events represent immutable facts about listing lifecycle
// ─────────────────────────────────────────────────────────────────────────────

export interface ListingCreatedPayload {
  listingId: string;
  vendorId: string;
  verticalType: string;
  schemaVersion: string;
  title: string;
  status: 'DRAFT';
}

export class ListingCreatedEvent extends BaseDomainEvent<ListingCreatedPayload> {
  constructor(options: EventOptionsWithoutType<ListingCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.created',
      },
      '1.0',
    );
  }
}

export interface ListingUpdatedPayload {
  listingId: string;
  vendorId: string;
  verticalType: string;
  changes: Record<string, unknown>;
  previousValues: Record<string, unknown>;
}

export class ListingUpdatedEvent extends BaseDomainEvent<ListingUpdatedPayload> {
  constructor(options: EventOptionsWithoutType<ListingUpdatedPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.updated',
      },
      '1.0',
    );
  }
}

export interface ListingPublishedPayload {
  listingId: string;
  vendorId: string;
  verticalType: string;
  title: string;
  price?: number;
  currency?: string;
  location?: {
    country: string;
    city?: string;
  };
}

export class ListingPublishedEvent extends BaseDomainEvent<ListingPublishedPayload> {
  constructor(options: EventOptionsWithoutType<ListingPublishedPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.published',
      },
      '1.0',
    );
  }
}

export interface ListingUnpublishedPayload {
  listingId: string;
  vendorId: string;
  reason?: string;
}

export class ListingUnpublishedEvent extends BaseDomainEvent<ListingUnpublishedPayload> {
  constructor(options: EventOptionsWithoutType<ListingUnpublishedPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.unpublished',
      },
      '1.0',
    );
  }
}

export interface ListingExpiredPayload {
  listingId: string;
  vendorId: string;
  expiryDate: Date;
  reason?: string;
}

export class ListingExpiredEvent extends BaseDomainEvent<ListingExpiredPayload> {
  constructor(options: EventOptionsWithoutType<ListingExpiredPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.expired',
      },
      '1.0',
    );
  }
}

export interface ListingArchivedPayload {
  listingId: string;
  vendorId: string;
  reason?: string;
}

export class ListingArchivedEvent extends BaseDomainEvent<ListingArchivedPayload> {
  constructor(options: EventOptionsWithoutType<ListingArchivedPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.archived',
      },
      '1.0',
    );
  }
}

export interface ListingFeaturedPayload {
  listingId: string;
  vendorId: string;
  featuredUntil: Date;
  placement?: string;
}

export class ListingFeaturedEvent extends BaseDomainEvent<ListingFeaturedPayload> {
  constructor(options: EventOptionsWithoutType<ListingFeaturedPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.featured',
      },
      '1.0',
    );
  }
}

export interface ListingViewedPayload {
  listingId: string;
  vendorId: string;
  verticalType: string;
}

export class ListingViewedEvent extends BaseDomainEvent<ListingViewedPayload> {
  constructor(options: EventOptionsWithoutType<ListingViewedPayload>) {
    super(
      {
        ...options,
        eventType: 'listing.listing.viewed',
      },
      '1.0',
    );
  }
}
