/**
 * Public API Controller
 * Session 4.3 - Public API & Rate Limiting
 *
 * Public endpoints that do not require authentication.
 * All endpoints are rate-limited and cached.
 */

import { Controller, Get, Param, Query, UseGuards, Headers, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';

import { RateLimitGuard } from './guards/rate-limit.guard';
import { RateLimit, RateLimitPresets } from './decorators/rate-limit.decorator';
import { PublicService } from './public.service';
import { PublicSearchQueryDto, PublicSearchResponseDto } from './dto/public-search.dto';
import { PublicListingResponseDto } from './dto/public-listing.dto';
import { PublicVendorResponseDto } from './dto/public-vendor.dto';

@ApiTags('Public API')
@Controller('public')
@UseGuards(RateLimitGuard)
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(private readonly publicService: PublicService) {}

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
    name: 'X-Tenant-ID',
    description: 'Tenant identifier (required)',
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
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: PublicSearchQueryDto,
  ): Promise<PublicSearchResponseDto> {
    if (!tenantId) {
      tenantId = 'demo'; // Fallback for testing
    }

    const result = await this.publicService.searchListings(tenantId, query);
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
        facets: result.aggregations as Record<string, { value: string; count: number }[]>,
      },
    };
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
    name: 'X-Tenant-ID',
    description: 'Tenant identifier (required)',
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
    @Headers('x-tenant-id') tenantId: string,
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<PublicListingResponseDto> {
    if (!tenantId) {
      tenantId = 'demo';
    }

    const listing = await this.publicService.getPublicListing(tenantId, idOrSlug);

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
    name: 'X-Tenant-ID',
    description: 'Tenant identifier (required)',
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
    @Headers('x-tenant-id') tenantId: string,
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<PublicVendorResponseDto> {
    if (!tenantId) {
      tenantId = 'demo';
    }

    const vendor = await this.publicService.getPublicVendor(tenantId, idOrSlug);

    return {
      data: vendor,
      meta: {
        requestId: crypto.randomUUID(),
      },
    };
  }
}
