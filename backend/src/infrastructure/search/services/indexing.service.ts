import { Injectable, Logger } from '@nestjs/common';
import { OpenSearchService } from '../opensearch.service';
import { PrismaService } from '@infrastructure/database';
import { getListingsIndexName, getListingsIndexSettings } from '../mappings/listings.mapping';
import { ListingSearchDocument, BulkIndexResult, ReindexResult } from '../types/search.types';
import type { Prisma } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(
    private readonly opensearchService: OpenSearchService,
    private readonly prisma: PrismaService,
  ) {}

  private readonly listingDetailSelect = {
    id: true,
    partnerId: true,
    vendorId: true,
    verticalType: true,
    schemaVersion: true,
    title: true,
    description: true,
    slug: true,
    price: true,
    currency: true,
    priceType: true,
    location: true,
    attributes: true,
    status: true,
    publishedAt: true,
    expiresAt: true,
    isFeatured: true,
    featuredUntil: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
    vendor: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    media: {
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        mediaType: true,
        cdnUrl: true,
        thumbnailUrl: true,
        visibility: true,
        sortOrder: true,
        isPrimary: true,
        altText: true,
      },
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' as const },
    },
  } as const;

  private async findListingDetailForTenant(
    partnerId: string,
    listingId: string,
  ): Promise<ListingDetailForIndexing | null> {
    return this.prisma.listing.findFirst({
      where: {
        id: listingId,
        partnerId,
        deletedAt: null,
      },
      select: this.listingDetailSelect,
    });
  }

  private async findListingsDetailedBatchForTenant(params: {
    partnerId: string;
    page: number;
    pageSize: number;
    verticalType?: string;
    status?: Array<'PUBLISHED' | 'EXPIRED'>;
  }): Promise<ListingDetailForIndexing[]> {
    const where: Prisma.ListingWhereInput = {
      partnerId: params.partnerId,
      deletedAt: null,
    };

    if (params.verticalType) {
      where.verticalType = params.verticalType;
    }

    if (params.status && params.status.length > 0) {
      where.status = { in: params.status };
    }

    return this.prisma.listing.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: this.listingDetailSelect,
    });
  }

  async ensureIndex(partnerId: string): Promise<void> {
    const indexName = getListingsIndexName(partnerId);
    const indexSettings = getListingsIndexSettings();

    try {
      await this.opensearchService.createIndex(indexName, indexSettings);
      this.logger.log(`Ensured index ${indexName} exists`);
    } catch (error) {
      this.logger.error(`Failed to ensure index ${indexName}:`, error);
      throw error;
    }
  }

  async indexListing(partnerId: string, listingId: string): Promise<void> {
    const indexName = getListingsIndexName(partnerId);

    try {
      // Fetch listing with vendor and media
      const listing = await this.findListingDetailForTenant(partnerId, listingId);

      if (!listing) {
        this.logger.warn(`Listing ${listingId} not found, skipping indexing`);
        return;
      }

      if (listing.partnerId !== partnerId) {
        this.logger.error(
          `Partner mismatch: listing ${listingId} belongs to ${listing.partnerId}, not ${partnerId}`,
        );
        return;
      }

      // Only index published or expired listings
      if (listing.status !== 'PUBLISHED' && listing.status !== 'EXPIRED') {
        this.logger.debug(`Listing ${listingId} status is ${listing.status}, removing from index`);
        await this.deleteListing(partnerId, listingId);
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

  async deleteListing(partnerId: string, listingId: string): Promise<void> {
    const indexName = getListingsIndexName(partnerId);

    try {
      await this.opensearchService.deleteDocument(indexName, listingId);
      this.logger.log(`Deleted listing ${listingId} from ${indexName}`);
    } catch (error) {
      this.logger.error(`Failed to delete listing ${listingId}:`, error);
      // Don't throw - deletion of non-existent documents is acceptable
    }
  }

  async bulkIndexListings(
    partnerId: string,
    listings: ListingDetailForIndexing[],
  ): Promise<BulkIndexResult> {
    const indexName = getListingsIndexName(partnerId);

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

  async reindexTenant(partnerId: string, verticalType?: string): Promise<ReindexResult> {
    const BATCH_SIZE = 100;
    let indexed = 0;
    let page = 0;

    try {
      // Ensure index exists
      await this.ensureIndex(partnerId);

      let hasMore = true;
      while (hasMore) {
        const listings = await this.findListingsDetailedBatchForTenant({
          partnerId,
          page: page + 1,
          pageSize: BATCH_SIZE,
          verticalType,
          status: ['PUBLISHED', 'EXPIRED'],
        });

        if (!listings || listings.length === 0) {
          hasMore = false;
          break;
        }

        const result = await this.bulkIndexListings(partnerId, listings);
        indexed += result.successful;
        page++;

        this.logger.log(`Reindex progress: ${indexed} listings indexed for partner ${partnerId}`);

        if (listings.length < BATCH_SIZE) {
          break;
        }
      }

      this.logger.log(`Reindex complete: ${indexed} listings indexed for partner ${partnerId}`);
      return { indexed };
    } catch (error) {
      this.logger.error(`Reindex failed for partner ${partnerId}:`, error);
      throw error;
    }
  }

  private buildListingDocument(listing: ListingDetailForIndexing): ListingSearchDocument {
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
      partnerId: listing.partnerId,
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

type ListingDetailForIndexing = {
  id: string;
  partnerId: string;
  vendorId: string;
  verticalType: string;
  schemaVersion: string;
  title: string;
  description: string | null;
  slug: string;
  price: Decimal | null;
  currency: string;
  priceType: string | null;
  location: Prisma.JsonValue | null;
  attributes: Prisma.JsonValue | null;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
  publishedAt: Date | null;
  expiresAt: Date | null;
  isFeatured: boolean;
  featuredUntil: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    name: string;
    slug: string;
  };
  media: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    mediaType: string;
    cdnUrl: string | null;
    thumbnailUrl: string | null;
    visibility: string;
    sortOrder: number;
    isPrimary: boolean;
    altText: string | null;
  }>;
};
