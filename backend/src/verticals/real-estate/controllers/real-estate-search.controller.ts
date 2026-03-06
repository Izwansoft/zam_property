/**
 * Real Estate Vertical - Search Controller
 * Part 29/34 - Reference Implementation
 *
 * Dedicated endpoints for real estate property search with full filter support.
 * These endpoints are public (no auth required) as per Part 30 - Public API.
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { PartnerContextService } from '@core/partner-context';

import { RealEstateSearchService } from '../services/real-estate-search.service';
import {
  RealEstateSearchQueryDto,
  RealEstateSearchResponseDto,
  PropertyType,
  ListingType,
  Furnishing,
} from '../dto/search.dto';

@ApiTags('Real Estate')
@Controller('real-estate')
export class RealEstateSearchController {
  constructor(
    private readonly searchService: RealEstateSearchService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({
    summary: 'Search real estate listings',
    description: `
Search for real estate listings with comprehensive filters and facets.

**Text Search:**
- \`q\` - Full-text search across title, description, and location

**Property Filters:**
- \`propertyType\` - Filter by property type(s): apartment, condominium, terrace, etc.
- \`listingType\` - Filter by sale or rent
- \`tenure\` - Filter by freehold, leasehold, etc.

**Room Filters:**
- \`bedroomsMin/bedroomsMax\` - Bedroom count range
- \`bathroomsMin/bathroomsMax\` - Bathroom count range

**Size Filters:**
- \`builtUpSizeMin/builtUpSizeMax\` - Built-up size in sq ft
- \`landSizeMin/landSizeMax\` - Land size in sq ft

**Price Filters:**
- \`priceMin/priceMax\` - Price range

**Location Filters:**
- \`city\`, \`state\`, \`country\` - Location filters
- \`lat\`, \`lng\`, \`radius\` - Geo-search (radius in km)

**Other Filters:**
- \`furnishing\` - Furnishing level
- \`facilities\` - Required facilities (comma-separated)
- \`nearbyAmenities\` - Required nearby amenities
- \`featuredOnly\` - Show only featured listings

**Sorting:**
- \`sort\` - Sort order: price:asc, price:desc, newest, oldest, size:asc, size:desc, bedrooms:asc, bedrooms:desc, relevance, distance

**Pagination:**
- \`page\` - Page number (1-indexed)
- \`pageSize\` - Items per page (default: 20, max: 100)
    `,
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search query text' })
  @ApiQuery({ name: 'propertyType', required: false, enum: PropertyType, isArray: true })
  @ApiQuery({ name: 'listingType', required: false, enum: ListingType })
  @ApiQuery({ name: 'bedroomsMin', required: false, type: Number })
  @ApiQuery({ name: 'bedroomsMax', required: false, type: Number })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'furnishing', required: false, enum: Furnishing, isArray: true })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Search results with facets',
    type: RealEstateSearchResponseDto,
  })
  async search(@Query() query: RealEstateSearchQueryDto): Promise<RealEstateSearchResponseDto> {
    const partner = this.PartnerContext.getContext();

    const result = await this.searchService.search(partner.partnerId, query);

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
        facets: result.facets,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUGGESTIONS / AUTOCOMPLETE
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get search suggestions/autocomplete',
    description: 'Returns property suggestions based on search prefix for autocomplete',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search prefix' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max results (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions',
  })
  async getSuggestions(@Query('q') q: string, @Query('limit') limit?: number) {
    const partner = this.PartnerContext.getContext();

    const suggestions = await this.searchService.getSuggestions(partner.partnerId, q, limit || 10);

    return {
      data: suggestions,
      meta: {
        requestId: crypto.randomUUID(),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FACETS ENDPOINT
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('facets')
  @ApiOperation({
    summary: 'Get facet counts for filters',
    description:
      'Returns aggregated counts for all filter options without performing a full search',
  })
  @ApiResponse({
    status: 200,
    description: 'Facet counts for filter sidebar',
  })
  async getFacets() {
    const partner = this.PartnerContext.getContext();

    const facets = await this.searchService.getFacetCounts(partner.partnerId);

    return {
      data: facets,
      meta: {
        requestId: crypto.randomUUID(),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NEARBY SEARCH
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('nearby')
  @ApiOperation({
    summary: 'Search properties near a location',
    description: 'Returns properties within a specified radius of a geo-point, sorted by distance',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, type: Number, description: 'Longitude' })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in km (default: 5)',
  })
  @ApiQuery({ name: 'propertyType', required: false, enum: PropertyType, isArray: true })
  @ApiQuery({ name: 'listingType', required: false, enum: ListingType })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Nearby properties sorted by distance',
    type: RealEstateSearchResponseDto,
  })
  async searchNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
    @Query('propertyType') propertyType?: string[],
    @Query('listingType') listingType?: ListingType,
    @Query('priceMax') priceMax?: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<RealEstateSearchResponseDto> {
    const partner = this.PartnerContext.getContext();

    const query: RealEstateSearchQueryDto = {
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius) || 5,
      propertyType: propertyType
        ? Array.isArray(propertyType)
          ? propertyType
          : [propertyType]
        : undefined,
      listingType,
      priceMax: priceMax ? Number(priceMax) : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      sort: 'distance',
      includeDistance: true,
    };

    const result = await this.searchService.search(partner.partnerId, query);

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
        facets: result.facets,
      },
    };
  }
}
