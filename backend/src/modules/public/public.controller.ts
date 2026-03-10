/**
 * Public API Controller
 * Session 4.3 - Public API & Rate Limiting
 *
 * Public endpoints that do not require authentication.
 * All endpoints are rate-limited and cached.
 */

import { Controller, Get, Param, Query, Req, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import type { Request } from 'express';

import { RateLimitGuard } from './guards/rate-limit.guard';
import { RateLimit, RateLimitPresets } from './decorators/rate-limit.decorator';
import { PublicService } from './public.service';
import { PublicSearchQueryDto, PublicSearchResponseDto } from './dto/public-search.dto';
import { PublicListingResponseDto } from './dto/public-listing.dto';
import { PublicVendorResponseDto } from './dto/public-vendor.dto';
import { VerticalService } from '../vertical/services/vertical.service';
import { MaintenanceStatusResponseDto } from '../vertical/dto/vertical.dto';
import { ApiResponse as SuccessResponse } from '@shared/responses';

@ApiTags('Public API')
@Controller('public')
@UseGuards(RateLimitGuard)
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly publicService: PublicService,
    private readonly verticalService: VerticalService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────────────

  @Get('search/listings')
  @RateLimit(RateLimitPresets.PUBLIC_SEARCH)
  @ApiOperation({
    summary: 'Search listings (public)',
    description:
      'Search published listings without authentication. Rate limited to 60 requests per minute per IP.',
  })
  @ApiHeader({
    name: 'X-Partner-ID',
    description: 'Partner identifier (required)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with facets',
    type: PublicSearchResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  async searchListings(
    @Req() req: Request,
    @Query() query: PublicSearchQueryDto,
  ): Promise<PublicSearchResponseDto> {
    const partnerId = req.PartnerContext?.partnerId ?? 'demo';

    const result = await this.publicService.searchListings(partnerId, query);
    const totalPages = Math.ceil(result.total / (query.pageSize || 20));

    return {
      data: result.hits,
      meta: {
        requestId: crypto.randomUUID(),
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          totalItems: result.total,
          totalPages,
        },
        facets: this.transformAggregationsToFacets(result.aggregations),
      },
    };
  }

  /**
   * Transform raw OpenSearch aggregations into flat facet arrays.
   * Raw shape: { verticalTypes: { buckets: [{ key, doc_count }] } }
   * Output shape: { verticalTypes: [{ value, count }] }
   */
  private transformAggregationsToFacets(
    aggregations?: Record<string, unknown>,
  ): Record<string, { value: string; count: number }[]> | undefined {
    if (!aggregations) return undefined;
    const result: Record<string, { value: string; count: number }[]> = {};
    for (const [key, agg] of Object.entries(aggregations)) {
      const aggObj = agg as { buckets?: { key: string | number; doc_count: number; from?: number; to?: number }[] };
      if (aggObj?.buckets && Array.isArray(aggObj.buckets)) {
        result[key] = aggObj.buckets.map((bucket) => ({
          value: String(bucket.key),
          count: bucket.doc_count,
          ...(bucket.from != null ? { from: bucket.from } : {}),
          ...(bucket.to != null ? { to: bucket.to } : {}),
        }));
      }
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTING DETAIL
  // ─────────────────────────────────────────────────────────────────────────

  @Get('listings/:idOrSlug')
  @RateLimit(RateLimitPresets.PUBLIC_READ)
  @ApiOperation({
    summary: 'Get listing details (public)',
    description:
      'Get published listing details by ID or slug. Rate limited to 120 requests per minute per IP.',
  })
  @ApiHeader({
    name: 'X-Partner-ID',
    description: 'Partner identifier (required)',
    required: true,
  })
  @ApiParam({
    name: 'idOrSlug',
    description: 'Listing ID (UUID) or slug',
    example: 'modern-3br-condo-abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing details',
    type: PublicListingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Listing not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  async getPublicListing(
    @Req() req: Request,
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<PublicListingResponseDto> {
    const partnerId = req.PartnerContext?.partnerId ?? 'demo';

    const listing = await this.publicService.getPublicListing(partnerId, idOrSlug);

    return {
      data: listing,
      meta: {
        requestId: crypto.randomUUID(),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDOR PROFILE
  // ─────────────────────────────────────────────────────────────────────────

  @Get('vendors/:idOrSlug')
  @RateLimit(RateLimitPresets.PUBLIC_READ)
  @ApiOperation({
    summary: 'Get vendor profile (public)',
    description:
      'Get approved vendor profile by ID or slug. Rate limited to 120 requests per minute per IP.',
  })
  @ApiHeader({
    name: 'X-Partner-ID',
    description: 'Partner identifier (required)',
    required: true,
  })
  @ApiParam({
    name: 'idOrSlug',
    description: 'Vendor ID (UUID) or slug',
    example: 'premium-properties',
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor profile',
    type: PublicVendorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Vendor not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  async getPublicVendor(
    @Req() req: Request,
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<PublicVendorResponseDto> {
    const partnerId = req.PartnerContext?.partnerId ?? 'demo';

    const vendor = await this.publicService.getPublicVendor(partnerId, idOrSlug);

    return {
      data: vendor,
      meta: {
        requestId: crypto.randomUUID(),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAINTENANCE STATUS
  // ─────────────────────────────────────────────────────────────────────────

  @Get('maintenance')
  @RateLimit(RateLimitPresets.PUBLIC_READ)
  @ApiOperation({
    summary: 'Get maintenance status for all verticals (public)',
    description:
      'Check maintenance status for all verticals. Used by public pages to show maintenance indicators.',
  })
  @ApiHeader({
    name: 'X-Partner-ID',
    description: 'Partner identifier (required)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Maintenance statuses for all verticals',
    type: [MaintenanceStatusResponseDto],
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  async getAllMaintenanceStatuses(): Promise<SuccessResponse<MaintenanceStatusResponseDto[]>> {
    const statuses = await this.verticalService.getAllMaintenanceStatuses();
    return { data: statuses };
  }

  @Get('maintenance/:type')
  @RateLimit(RateLimitPresets.PUBLIC_READ)
  @ApiOperation({
    summary: 'Get maintenance status for a vertical (public)',
    description:
      'Check if a specific vertical is under maintenance. Used by public pages to show maintenance page.',
  })
  @ApiHeader({
    name: 'X-Partner-ID',
    description: 'Partner identifier (required)',
    required: true,
  })
  @ApiParam({
    name: 'type',
    description: 'Vertical type (e.g., real_estate)',
    example: 'real_estate',
  })
  @ApiResponse({
    status: 200,
    description: 'Maintenance status for the vertical',
    type: MaintenanceStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Vertical not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  async getMaintenanceStatus(
    @Param('type') type: string,
  ): Promise<SuccessResponse<MaintenanceStatusResponseDto>> {
    const status = await this.verticalService.getMaintenanceStatus(type);
    return { data: status };
  }
}
