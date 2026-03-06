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

@Injectable()
export class SearchEventHandlers {
  private readonly logger = new Logger(SearchEventHandlers.name);

  constructor(@InjectQueue('search.index') private searchQueue: Queue) {}

  @OnEvent('listing.published')
  async handleListingPublished(event: ListingPublishedEvent) {
    this.logger.debug(`Received listing.published event for listing ${event.listingId}`);

    await this.searchQueue.add(
      'listing.index',
      {
        partnerId: event.partnerId,
        listingId: event.listingId,
      },
      {
        jobId: `listing-index-${event.listingId}`, // Dedupe by listing ID (BullMQ 5.x doesn't allow colons)
        delay: 1000, // Debounce 1 second
      },
    );

    this.logger.log(`Queued indexing job for listing ${event.listingId}`);
  }

  @OnEvent('listing.updated')
  async handleListingUpdated(event: ListingUpdatedEvent) {
    this.logger.debug(`Received listing.updated event for listing ${event.listingId}`);

    // Only reindex if status is PUBLISHED or EXPIRED
    if (event.status === 'PUBLISHED' || event.status === 'EXPIRED') {
      await this.searchQueue.add(
        'listing.index',
        {
          partnerId: event.partnerId,
          listingId: event.listingId,
        },
        {
          jobId: `listing-index-${event.listingId}`,
          delay: 1000,
        },
      );

      this.logger.log(`Queued indexing job for updated listing ${event.listingId}`);
    } else {
      // Remove from index if no longer published/expired
      await this.searchQueue.add(
        'listing.delete',
        {
          partnerId: event.partnerId,
          listingId: event.listingId,
        },
        {
          jobId: `listing-delete-${event.listingId}`,
        },
      );

      this.logger.log(
        `Queued deletion job for listing ${event.listingId} (status: ${event.status})`,
      );
    }
  }

  @OnEvent('listing.unpublished')
  async handleListingUnpublished(event: ListingRemovedEvent) {
    this.logger.debug(`Received listing.unpublished event for listing ${event.listingId}`);

    await this.searchQueue.add(
      'listing.delete',
      {
        partnerId: event.partnerId,
        listingId: event.listingId,
      },
      {
        jobId: `listing-delete-${event.listingId}`,
      },
    );

    this.logger.log(`Queued deletion job for unpublished listing ${event.listingId}`);
  }

  @OnEvent('listing.archived')
  async handleListingArchived(event: ListingRemovedEvent) {
    this.logger.debug(`Received listing.archived event for listing ${event.listingId}`);

    await this.searchQueue.add(
      'listing.delete',
      {
        partnerId: event.partnerId,
        listingId: event.listingId,
      },
      {
        jobId: `listing-delete-${event.listingId}`,
      },
    );

    this.logger.log(`Queued deletion job for archived listing ${event.listingId}`);
  }

  @OnEvent('listing.deleted')
  async handleListingDeleted(event: ListingRemovedEvent) {
    this.logger.debug(`Received listing.deleted event for listing ${event.listingId}`);

    await this.searchQueue.add(
      'listing.delete',
      {
        partnerId: event.partnerId,
        listingId: event.listingId,
      },
      {
        jobId: `listing-delete-${event.listingId}`,
      },
    );

    this.logger.log(`Queued deletion job for deleted listing ${event.listingId}`);
  }
}
