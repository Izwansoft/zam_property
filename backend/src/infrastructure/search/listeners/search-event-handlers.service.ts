import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Event payload interfaces
interface ListingPublishedEvent {
  partnerId: string;
  listingId: string;
  vendorId: string;
  verticalType: string;
}

interface ListingUpdatedEvent {
  partnerId: string;
  listingId: string;
  status: string;
}

interface ListingRemovedEvent {
  partnerId: string;
  listingId: string;
}

type DomainWrappedEvent<T> = {
  partnerId?: string;
  payload?: T;
};

@Injectable()
export class SearchEventHandlers {
  private readonly logger = new Logger(SearchEventHandlers.name);

  constructor(@InjectQueue('search.index') private searchQueue: Queue) {}

  private normalizeEvent<T extends { listingId: string }>(
    event: T | DomainWrappedEvent<T>,
  ): (T & { partnerId: string }) | null {
    const payload = (event as DomainWrappedEvent<T>)?.payload;
    const normalized = (payload ?? event) as T;
    const partnerId = (event as DomainWrappedEvent<T>)?.partnerId;

    if (!partnerId || !normalized?.listingId) {
      return null;
    }

    return {
      ...normalized,
      partnerId,
    };
  }

  @OnEvent('listing.listing.published')
  @OnEvent('listing.published')
  async handleListingPublished(event: ListingPublishedEvent | DomainWrappedEvent<ListingPublishedEvent>) {
    const normalized = this.normalizeEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing published search handler: invalid event payload');
      return;
    }

    this.logger.debug(`Received listing.published event for listing ${normalized.listingId}`);

    await this.searchQueue.add(
      'listing.index',
      {
        partnerId: normalized.partnerId,
        listingId: normalized.listingId,
      },
      {
        jobId: `listing-index-${normalized.listingId}`, // Dedupe by listing ID (BullMQ 5.x doesn't allow colons)
        delay: 1000, // Debounce 1 second
      },
    );

    this.logger.log(`Queued indexing job for listing ${normalized.listingId}`);
  }

  @OnEvent('listing.listing.updated')
  @OnEvent('listing.updated')
  async handleListingUpdated(event: ListingUpdatedEvent | DomainWrappedEvent<ListingUpdatedEvent>) {
    const normalized = this.normalizeEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing updated search handler: invalid event payload');
      return;
    }

    this.logger.debug(`Received listing.updated event for listing ${normalized.listingId}`);

    // Only reindex if status is PUBLISHED or EXPIRED
    if (normalized.status === 'PUBLISHED' || normalized.status === 'EXPIRED') {
      await this.searchQueue.add(
        'listing.index',
        {
          partnerId: normalized.partnerId,
          listingId: normalized.listingId,
        },
        {
          jobId: `listing-index-${normalized.listingId}`,
          delay: 1000,
        },
      );

      this.logger.log(`Queued indexing job for updated listing ${normalized.listingId}`);
    } else {
      // Remove from index if no longer published/expired
      await this.searchQueue.add(
        'listing.delete',
        {
          partnerId: normalized.partnerId,
          listingId: normalized.listingId,
        },
        {
          jobId: `listing-delete-${normalized.listingId}`,
        },
      );

      this.logger.log(
        `Queued deletion job for listing ${normalized.listingId} (status: ${normalized.status})`,
      );
    }
  }

  @OnEvent('listing.listing.unpublished')
  @OnEvent('listing.unpublished')
  async handleListingUnpublished(event: ListingRemovedEvent | DomainWrappedEvent<ListingRemovedEvent>) {
    const normalized = this.normalizeEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing unpublished search handler: invalid event payload');
      return;
    }

    this.logger.debug(`Received listing.unpublished event for listing ${normalized.listingId}`);

    await this.searchQueue.add(
      'listing.delete',
      {
        partnerId: normalized.partnerId,
        listingId: normalized.listingId,
      },
      {
        jobId: `listing-delete-${normalized.listingId}`,
      },
    );

    this.logger.log(`Queued deletion job for unpublished listing ${normalized.listingId}`);
  }

  @OnEvent('listing.listing.archived')
  @OnEvent('listing.archived')
  async handleListingArchived(event: ListingRemovedEvent | DomainWrappedEvent<ListingRemovedEvent>) {
    const normalized = this.normalizeEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing archived search handler: invalid event payload');
      return;
    }

    this.logger.debug(`Received listing.archived event for listing ${normalized.listingId}`);

    await this.searchQueue.add(
      'listing.delete',
      {
        partnerId: normalized.partnerId,
        listingId: normalized.listingId,
      },
      {
        jobId: `listing-delete-${normalized.listingId}`,
      },
    );

    this.logger.log(`Queued deletion job for archived listing ${normalized.listingId}`);
  }

  @OnEvent('listing.listing.deleted')
  @OnEvent('listing.deleted')
  async handleListingDeleted(event: ListingRemovedEvent | DomainWrappedEvent<ListingRemovedEvent>) {
    const normalized = this.normalizeEvent(event);
    if (!normalized) {
      this.logger.warn('Skipping listing deleted search handler: invalid event payload');
      return;
    }

    this.logger.debug(`Received listing.deleted event for listing ${normalized.listingId}`);

    await this.searchQueue.add(
      'listing.delete',
      {
        partnerId: normalized.partnerId,
        listingId: normalized.listingId,
      },
      {
        jobId: `listing-delete-${normalized.listingId}`,
      },
    );

    this.logger.log(`Queued deletion job for deleted listing ${normalized.listingId}`);
  }
}
