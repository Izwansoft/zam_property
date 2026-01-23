import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ListingPublishedEvent,
  ListingUpdatedEvent,
  ListingUnpublishedEvent,
  ListingExpiredEvent,
  ListingArchivedEvent,
} from '../domain/listing.events';

/**
 * SearchIndexEventHandler - Automatically updates search indexes on listing changes
 *
 * Per Part 28:
 * - Events drive search indexing (not direct calls)
 * - Handlers are idempotent (safe to process same event twice)
 * - Handlers never block business logic (async + error resilient)
 *
 * TODO: Wire SearchIndexService from Session 2.3 when implementing
 */
@Injectable()
export class SearchIndexEventHandler {
  private readonly logger = new Logger(SearchIndexEventHandler.name);

  // TODO: Inject SearchIndexService from Session 2.3
  // constructor(private readonly searchIndexService: SearchIndexService) {}

  /**
   * Index listing when published
   */
  @OnEvent('listing.listing.published')
  async handleListingPublished(event: ListingPublishedEvent): Promise<void> {
    try {
      this.logger.debug(`Indexing published listing: ${event.payload.listingId}`);

      // TODO: Implement actual indexing
      // await this.searchIndexService.indexListing({
      //   listingId: event.payload.listingId,
      //   tenantId: event.tenantId,
      //   title: event.payload.title,
      //   price: event.payload.price,
      //   location: event.payload.location,
      //   verticalType: event.payload.verticalType,
      // });

      this.logger.log(`Indexed published listing: ${event.payload.listingId}`);
    } catch (error) {
      // Log error but don't throw - indexing failures shouldn't break business logic
      this.logger.error('Failed to index published listing', {
        error: error instanceof Error ? error.message : String(error),
        listingId: event.payload.listingId,
      });
    }
  }

  /**
   * Update search index when listing updated
   */
  @OnEvent('listing.listing.updated')
  async handleListingUpdated(event: ListingUpdatedEvent): Promise<void> {
    try {
      this.logger.debug(`Updating search index for listing: ${event.payload.listingId}`);

      // TODO: Implement actual re-indexing
      // await this.searchIndexService.updateListing({
      //   listingId: event.payload.listingId,
      //   tenantId: event.tenantId,
      //   changes: event.payload.changes,
      // });

      this.logger.log(`Updated search index for listing: ${event.payload.listingId}`);
    } catch (error) {
      this.logger.error('Failed to update search index', {
        error: error instanceof Error ? error.message : String(error),
        listingId: event.payload.listingId,
      });
    }
  }

  /**
   * Remove from search index when unpublished
   */
  @OnEvent('listing.listing.unpublished')
  async handleListingUnpublished(event: ListingUnpublishedEvent): Promise<void> {
    try {
      this.logger.debug(`Removing unpublished listing from index: ${event.payload.listingId}`);

      // TODO: Implement actual removal
      // await this.searchIndexService.removeListing({
      //   listingId: event.payload.listingId,
      //   tenantId: event.tenantId,
      // });

      this.logger.log(`Removed unpublished listing from index: ${event.payload.listingId}`);
    } catch (error) {
      this.logger.error('Failed to remove listing from search index', {
        error: error instanceof Error ? error.message : String(error),
        listingId: event.payload.listingId,
      });
    }
  }

  /**
   * Remove from search index when expired
   */
  @OnEvent('listing.listing.expired')
  async handleListingExpired(event: ListingExpiredEvent): Promise<void> {
    try {
      this.logger.debug(`Removing expired listing from index: ${event.payload.listingId}`);

      // TODO: Implement actual removal
      // await this.searchIndexService.removeListing({
      //   listingId: event.payload.listingId,
      //   tenantId: event.tenantId,
      // });

      this.logger.log(`Removed expired listing from index: ${event.payload.listingId}`);
    } catch (error) {
      this.logger.error('Failed to remove expired listing from search index', {
        error: error instanceof Error ? error.message : String(error),
        listingId: event.payload.listingId,
      });
    }
  }

  /**
   * Remove from search index when archived
   */
  @OnEvent('listing.listing.archived')
  async handleListingArchived(event: ListingArchivedEvent): Promise<void> {
    try {
      this.logger.debug(`Removing archived listing from index: ${event.payload.listingId}`);

      // TODO: Implement actual removal
      // await this.searchIndexService.removeListing({
      //   listingId: event.payload.listingId,
      //   tenantId: event.tenantId,
      // });

      this.logger.log(`Removed archived listing from index: ${event.payload.listingId}`);
    } catch (error) {
      this.logger.error('Failed to remove archived listing from search index', {
        error: error instanceof Error ? error.message : String(error),
        listingId: event.payload.listingId,
      });
    }
  }
}
