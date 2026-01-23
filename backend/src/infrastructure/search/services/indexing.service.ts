import { Injectable, Logger } from '@nestjs/common';
import { OpenSearchService } from '../opensearch.service';
import { ListingRepository } from '@modules/listing/listing.repository';
import { VendorRepository } from '@modules/vendor/vendor.repository';
import { getListingsIndexName, getListingsIndexSettings } from '../mappings/listings.mapping';
import { ListingSearchDocument, BulkIndexResult, ReindexResult } from '../types/search.types';
import type { ListingDetailView } from '@modules/listing/listing.repository';

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    private readonly opensearchService: OpenSearchService,
    private readonly listingRepository: ListingRepository,
    private readonly vendorRepository: VendorRepository,
  ) {}

  async ensureIndex(tenantId: string): Promise<void> {
    const indexName = getListingsIndexName(tenantId);
    const indexSettings = getListingsIndexSettings();

    try {
      await this.opensearchService.createIndex(indexName, indexSettings);
      this.logger.log(`Ensured index ${indexName} exists`);
    } catch (error) {
      this.logger.error(`Failed to ensure index ${indexName}:`, error);
      throw error;
    }
  }

  async indexListing(tenantId: string, listingId: string): Promise<void> {
    const indexName = getListingsIndexName(tenantId);

    try {
      // Fetch listing with vendor and media
      const listing = await this.listingRepository.findDetailById(listingId);

      if (!listing) {
        this.logger.warn(`Listing ${listingId} not found, skipping indexing`);
        return;
      }

      if (listing.tenantId !== tenantId) {
        this.logger.error(
          `Tenant mismatch: listing ${listingId} belongs to ${listing.tenantId}, not ${tenantId}`,
        );
        return;
      }

      // Only index published or expired listings
      if (listing.status !== 'PUBLISHED' && listing.status !== 'EXPIRED') {
        this.logger.debug(`Listing ${listingId} status is ${listing.status}, removing from index`);
        await this.deleteListing(tenantId, listingId);
        return;
      }

      const document = this.buildListingDocument(listing);

      await this.opensearchService.indexDocument(indexName, listingId, document);
      this.logger.log(`Indexed listing ${listingId} in ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to index listing ${listingId}:`, error);
      throw error;
    }
  }

  async deleteListing(tenantId: string, listingId: string): Promise<void> {
    const indexName = getListingsIndexName(tenantId);

    try {
      await this.opensearchService.deleteDocument(indexName, listingId);
      this.logger.log(`Deleted listing ${listingId} from ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to delete listing ${listingId}:`, error);
      // Don't throw - deletion of non-existent documents is acceptable
    }
  }

  async bulkIndexListings(
    tenantId: string,
    listings: ListingDetailView[],
  ): Promise<BulkIndexResult> {
    const indexName = getListingsIndexName(tenantId);

    const documents = listings
      .filter((listing) => listing.status === 'PUBLISHED' || listing.status === 'EXPIRED')
      .map((listing) => ({
        id: listing.id,
        document: this.buildListingDocument(listing),
      }));

    if (documents.length === 0) {
      return { total: 0, successful: 0, failed: 0 };
    }

    try {
      const result = await this.opensearchService.bulkIndex(indexName, documents);
      this.logger.log(`Bulk indexed ${result.successful}/${result.total} listings in ${indexName}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to bulk index listings:`, error);
      throw error;
    }
  }

  async reindexTenant(tenantId: string, verticalType?: string): Promise<ReindexResult> {
    const BATCH_SIZE = 100;
    let indexed = 0;
    let page = 0;

    try {
      // Ensure index exists
      await this.ensureIndex(tenantId);

      let hasMore = true;
      while (hasMore) {
        const listings = await this.listingRepository.findManyDetailed({
          page: page + 1,
          pageSize: BATCH_SIZE,
          filters: {
            ...(verticalType && { verticalType }),
            status: ['PUBLISHED', 'EXPIRED'],
          },
        });

        if (!listings || listings.length === 0) {
          hasMore = false;
          break;
        }

        const result = await this.bulkIndexListings(tenantId, listings);
        indexed += result.successful;
        page++;

        this.logger.log(`Reindex progress: ${indexed} listings indexed for tenant ${tenantId}`);

        if (listings.length < BATCH_SIZE) {
          break;
        }
      }

      this.logger.log(`Reindex complete: ${indexed} listings indexed for tenant ${tenantId}`);
      return { indexed };
    } catch (error) {
      this.logger.error(`Reindex failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  private buildListingDocument(listing: ListingDetailView): ListingSearchDocument {
    // Extract location data
    const location = listing.location as {
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      lat?: number;
      lng?: number;
    } | null;

    // Extract primary image
    const primaryImage = listing.media.find((m) => m.isPrimary) || listing.media[0];

    return {
      id: listing.id,
      tenantId: listing.tenantId,
      vendorId: listing.vendorId,
      verticalType: listing.verticalType,
      status: listing.status,
      title: listing.title,
      description: listing.description || '',
      slug: listing.slug,
      price: listing.price ? Number(listing.price) : 0,
      currency: listing.currency,
      location: location
        ? {
            address: location.address,
            city: location.city,
            state: location.state,
            country: location.country,
            postalCode: location.postalCode,
            coordinates:
              location.lat && location.lng
                ? {
                    lat: location.lat,
                    lon: location.lng,
                  }
                : undefined,
          }
        : undefined,
      attributes: listing.attributes as Record<string, unknown>,
      isFeatured: listing.isFeatured,
      featuredUntil: listing.featuredUntil?.toISOString(),
      primaryImageUrl: primaryImage?.cdnUrl || primaryImage?.thumbnailUrl || undefined,
      mediaCount: listing.media.length,
      vendor: {
        id: listing.vendor.id,
        name: listing.vendor.name,
        slug: listing.vendor.slug,
      },
      publishedAt: listing.publishedAt?.toISOString(),
      expiresAt: listing.expiresAt?.toISOString(),
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }
}
