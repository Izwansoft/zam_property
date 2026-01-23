import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListingSearchService } from '../services/listing-search.service';
import { SearchListingsQueryDto, SuggestionsQueryDto } from '../dto/search.dto';
import { TenantContextService } from '@core/tenant-context';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly listingSearchService: ListingSearchService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('listings')
  @ApiOperation({ summary: 'Search listings with filters and facets' })
  @ApiResponse({
    status: 200,
    description: 'Search results with facets',
  })
  async searchListings(@Query() query: SearchListingsQueryDto) {
    const tenant = this.tenantContext.getContext();

    // Parse attribute filters from query params (e.g., attr.bedrooms=3)
    const attributeFilters: Record<
      string,
      { eq?: unknown; in?: unknown[]; gte?: number; lte?: number }
    > = {};

    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('attr.')) {
        const attrName = key.substring(5);

        // Handle array values (e.g., attr.propertyType=condo,apartment)
        if (typeof value === 'string' && value.includes(',')) {
          attributeFilters[attrName] = { in: value.split(',') };
        } else {
          // Try to parse as number for range queries
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            attributeFilters[attrName] = { eq: numValue };
          } else {
            attributeFilters[attrName] = { eq: value };
          }
        }
      }
    }

    const result = await this.listingSearchService.searchListings(tenant.tenantId, {
      q: query.q,
      filters: {
        verticalType: query.verticalType,
        priceMin: query.priceMin,
        priceMax: query.priceMax,
        city: query.city,
        state: query.state,
        country: query.country,
        vendorId: query.vendorId,
        featuredOnly: query.featuredOnly,
        location:
          query.lat && query.lng && query.radius
            ? {
                lat: query.lat,
                lng: query.lng,
                radius: query.radius,
              }
            : undefined,
        attributes: Object.keys(attributeFilters).length > 0 ? attributeFilters : undefined,
      },
      sort: query.sort,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      highlight: query.highlight,
      verticalType: query.verticalType,
    });

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
        facets: result.aggregations,
      },
    };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions/autocomplete' })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions',
  })
  async getSuggestions(@Query() query: SuggestionsQueryDto) {
    const tenant = this.tenantContext.getContext();

    const suggestions = await this.listingSearchService.getSuggestions(
      tenant.tenantId,
      query.q,
      query.limit || 10,
    );

    return {
      data: suggestions,
      meta: {
        requestId: crypto.randomUUID(),
      },
    };
  }
}
