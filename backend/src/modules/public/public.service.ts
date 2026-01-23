/**
 * Public API Service
 * Session 4.3 - Public API & Rate Limiting
 *
 * Service for public (unauthenticated) endpoints.
 * Returns only PUBLISHED listings and APPROVED vendors.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ListingStatus, VendorStatus } from '@prisma/client';

import { PrismaService } from '@infrastructure/database';
import { ListingSearchService } from '@infrastructure/search/services/listing-search.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { CacheTTL } from '@infrastructure/cache/cache-key.builder';

import {
  PublicSearchQueryDto,
  PublicSearchResultDto,
  PublicSearchSortField,
} from './dto/public-search.dto';
import { PublicListingDetailDto } from './dto/public-listing.dto';
import { PublicVendorProfileDto, PublicVendorListingPreviewDto } from './dto/public-vendor.dto';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly listingSearchService: ListingSearchService,
    private readonly cacheService: CacheService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────────────

  async searchListings(
    tenantId: string,
    query: PublicSearchQueryDto,
  ): Promise<{
    hits: PublicSearchResultDto[];
    total: number;
    aggregations?: Record<string, unknown>;
  }> {
    // Map sort field
    let sort: string | undefined;
    switch (query.sort) {
      case PublicSearchSortField.PRICE_ASC:
        sort = 'price:asc';
        break;
      case PublicSearchSortField.PRICE_DESC:
        sort = 'price:desc';
        break;
      case PublicSearchSortField.NEWEST:
        sort = 'publishedAt:desc';
        break;
      case PublicSearchSortField.OLDEST:
        sort = 'publishedAt:asc';
        break;
      default:
        sort = undefined; // relevance
    }

    // Parse attribute filters from query params
    const attributeFilters: Record<string, { eq?: unknown }> = {};

    // Call search service
    const result = await this.listingSearchService.searchListings(tenantId, {
      q: query.q,
      filters: {
        verticalType: query.verticalType,
        priceMin: query.priceMin,
        priceMax: query.priceMax,
        city: query.city,
        state: query.state,
        country: query.country,
        featuredOnly: query.featuredOnly,
        location:
          query.lat && query.lng && query.radius
            ? { lat: query.lat, lng: query.lng, radius: query.radius }
            : undefined,
        attributes: Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
      },
      sort,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      highlight: query.highlight,
      verticalType: query.verticalType,
    });

    // Map to public DTOs
    const hits: PublicSearchResultDto[] = result.hits.map((hit) => ({
      id: hit.id,
      title: hit.title,
      slug: hit.slug,
      price: hit.price,
      currency: hit.currency || 'MYR',
      primaryImageUrl: hit.primaryImageUrl,
      location: hit.location
        ? {
            city: hit.location.city,
            state: hit.location.state,
            country: hit.location.country,
          }
        : undefined,
      verticalType: hit.verticalType,
      vendorName: hit.vendor?.name,
      vendorSlug: hit.vendor?.slug,
      isFeatured: hit.isFeatured,
      publishedAt: hit.publishedAt || new Date().toISOString(),
      highlights: hit.highlights as Record<string, string[]> | undefined,
    }));

    return {
      hits,
      total: result.total,
      aggregations: result.aggregations,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTING DETAIL
  // ─────────────────────────────────────────────────────────────────────────

  async getPublicListing(tenantId: string, idOrSlug: string): Promise<PublicListingDetailDto> {
    // Check cache first
    const cacheKey = `public:listing:${tenantId}:${idOrSlug}`;
    const cached = await this.cacheService.get<PublicListingDetailDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Determine if it's a UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const listing = await this.prisma.listing.findFirst({
      where: {
        tenantId,
        status: ListingStatus.PUBLISHED,
        ...(isUuid ? { id: idOrSlug } : { slug: idOrSlug }),
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            email: true,
            profile: {
              select: {
                logoUrl: true,
              },
            },
          },
        },
        media: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            cdnUrl: true,
            thumbnailUrl: true,
            mediaType: true,
            altText: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const result: PublicListingDetailDto = {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      description: listing.description || undefined,
      verticalType: listing.verticalType,
      price: listing.price?.toNumber(),
      currency: listing.currency,
      isFeatured: listing.isFeatured,
      publishedAt: listing.publishedAt?.toISOString() || listing.createdAt.toISOString(),
      location: listing.location
        ? {
            address: (listing.location as Record<string, unknown>).address as string | undefined,
            city: (listing.location as Record<string, unknown>).city as string | undefined,
            state: (listing.location as Record<string, unknown>).state as string | undefined,
            country: (listing.location as Record<string, unknown>).country as string | undefined,
            postalCode: (listing.location as Record<string, unknown>).postalCode as
              | string
              | undefined,
            coordinates:
              (listing.location as Record<string, unknown>).lat &&
              (listing.location as Record<string, unknown>).lng
                ? {
                    lat: (listing.location as Record<string, unknown>).lat as number,
                    lng: (listing.location as Record<string, unknown>).lng as number,
                  }
                : undefined,
          }
        : undefined,
      attributes: listing.attributes as Record<string, unknown> | undefined,
      media: listing.media.map((m) => ({
        id: m.id,
        url: m.cdnUrl || '',
        thumbnailUrl: m.thumbnailUrl || undefined,
        mediaType: m.mediaType,
        altText: m.altText || undefined,
        sortOrder: m.sortOrder,
      })),
      vendor: {
        id: listing.vendor.id,
        name: listing.vendor.name,
        slug: listing.vendor.slug,
        logoUrl: listing.vendor.profile?.logoUrl || undefined,
        phone: listing.vendor.phone || undefined,
        email: listing.vendor.email || undefined,
      },
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, { ttl: CacheTTL.LISTING });

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR PROFILE
  // ─────────────────────────────────────────────────────────────────────────

  async getPublicVendor(tenantId: string, idOrSlug: string): Promise<PublicVendorProfileDto> {
    // Check cache first
    const cacheKey = `public:vendor:${tenantId}:${idOrSlug}`;
    const cached = await this.cacheService.get<PublicVendorProfileDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Determine if it's a UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const vendor = await this.prisma.vendor.findFirst({
      where: {
        tenantId,
        status: VendorStatus.APPROVED,
        ...(isUuid ? { id: idOrSlug } : { slug: idOrSlug }),
      },
      include: {
        profile: true,
        _count: {
          select: {
            listings: {
              where: { status: ListingStatus.PUBLISHED },
            },
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Get featured listings
    const featuredListings = await this.prisma.listing.findMany({
      where: {
        tenantId,
        vendorId: vendor.id,
        status: ListingStatus.PUBLISHED,
        isFeatured: true,
      },
      take: 6,
      orderBy: { publishedAt: 'desc' },
      include: {
        media: {
          where: { deletedAt: null },
          take: 1,
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // If no featured, get latest listings
    const listingsToShow =
      featuredListings.length > 0
        ? featuredListings
        : await this.prisma.listing.findMany({
            where: {
              tenantId,
              vendorId: vendor.id,
              status: ListingStatus.PUBLISHED,
            },
            take: 6,
            orderBy: { publishedAt: 'desc' },
            include: {
              media: {
                where: { deletedAt: null },
                take: 1,
                orderBy: { sortOrder: 'asc' },
              },
            },
          });

    // Get rating aggregation
    const reviewAgg = await this.prisma.review.aggregate({
      where: {
        tenantId,
        targetType: 'vendor',
        targetId: vendor.id,
        status: 'APPROVED',
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    // Get rating breakdown
    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const ratingCounts = await this.prisma.review.groupBy({
      by: ['rating'],
      where: {
        tenantId,
        targetType: 'vendor',
        targetId: vendor.id,
        status: 'APPROVED',
      },
      _count: { id: true },
    });
    for (const rc of ratingCounts) {
      ratingBreakdown[rc.rating] = rc._count.id;
    }

    const result: PublicVendorProfileDto = {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      description: vendor.description || undefined,
      logoUrl: vendor.profile?.logoUrl || undefined,
      coverImageUrl: vendor.profile?.bannerUrl || undefined,
      phone: vendor.phone || undefined,
      email: vendor.email || undefined,
      website: vendor.website || undefined,
      address: vendor.profile?.addressLine1
        ? `${vendor.profile.addressLine1}${vendor.profile.addressLine2 ? ', ' + vendor.profile.addressLine2 : ''}`
        : undefined,
      city: vendor.profile?.city || undefined,
      state: vendor.profile?.state || undefined,
      country: vendor.profile?.country || undefined,
      totalListings: vendor._count.listings,
      ratings: {
        averageRating: reviewAgg._avg.rating || 0,
        totalReviews: reviewAgg._count.id,
        ratingBreakdown,
      },
      featuredListings: listingsToShow.map(
        (l): PublicVendorListingPreviewDto => ({
          id: l.id,
          title: l.title,
          slug: l.slug,
          price: l.price?.toNumber(),
          currency: l.currency,
          primaryImageUrl: l.media[0]?.cdnUrl || undefined,
          verticalType: l.verticalType,
          isFeatured: l.isFeatured,
        }),
      ),
      memberSince: vendor.createdAt.toISOString(),
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, { ttl: CacheTTL.VENDOR });

    return result;
  }
}
