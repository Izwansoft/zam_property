import { Injectable, Logger } from '@nestjs/common';
import { OpenSearchService } from '../opensearch.service';
import { TenantContextService } from '@core/tenant-context';
import {
  SearchListingsQuery,
  SearchResult,
  ListingSearchDocument,
  SearchFilters,
  Suggestion,
} from '../types/search.types';
import { getListingsIndexName } from '../mappings/listings.mapping';

interface QueryDslQueryContainer {
  match_all?: Record<string, unknown>;
  multi_match?: {
    query: string;
    fields: string[];
    type?: string;
    fuzziness?: string;
  };
  term?: Record<string, unknown>;
  terms?: Record<string, unknown[]>;
  range?: Record<string, unknown>;
  geo_distance?: {
    distance: string;
    [key: string]: unknown;
  };
  prefix?: Record<string, unknown>;
}

interface SortCombinations {
  _score?: 'asc' | 'desc';
  [key: string]: 'asc' | 'desc' | undefined;
}

@Injectable()
export class ListingSearchService {
  private readonly logger = new Logger(ListingSearchService.name);

  constructor(
    private readonly opensearchService: OpenSearchService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async searchListings(
    tenantId: string,
    query: SearchListingsQuery,
  ): Promise<SearchResult<ListingSearchDocument>> {
    const indexName = getListingsIndexName(tenantId);

    try {
      const searchBody = this.buildSearchQuery(tenantId, query);

      this.logger.debug(`Searching index ${indexName} with query: ${JSON.stringify(searchBody)}`);

      const result = await this.opensearchService.search<ListingSearchDocument>(
        indexName,
        searchBody,
      );

      return result;
    } catch (error) {
      this.logger.error(`Search failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getSuggestions(
    tenantId: string,
    prefix: string,
    limit: number = 10,
  ): Promise<Suggestion[]> {
    const indexName = getListingsIndexName(tenantId);

    try {
      const result = await this.opensearchService.search<ListingSearchDocument>(indexName, {
        query: {
          bool: {
            must: [{ prefix: { 'title.keyword': { value: prefix.toLowerCase() } } }],
            filter: [{ term: { status: 'PUBLISHED' } }],
          },
        },
        _source: ['id', 'title', 'slug', 'price', 'location.city'],
        size: limit,
      });

      return result.hits.map((hit) => ({
        id: hit.id,
        title: hit.title,
        slug: hit.slug,
        price: hit.price,
        city: hit.location?.city,
      }));
    } catch (error) {
      this.logger.error(`Suggestions failed for tenant ${tenantId}:`, error);
      return [];
    }
  }

  private buildSearchQuery(tenantId: string, query: SearchListingsQuery): Record<string, unknown> {
    const must: QueryDslQueryContainer[] = [];
    const filter: QueryDslQueryContainer[] = [];

    // Always filter by tenant
    filter.push({ term: { tenantId } });

    // Status filter (default: PUBLISHED)
    const status = query.filters?.verticalType === 'all' ? undefined : 'PUBLISHED';
    if (status) {
      filter.push({ term: { status } });
    }

    // Text search
    if (query.q) {
      must.push({
        multi_match: {
          query: query.q,
          fields: ['title^3', 'title.raw^2', 'description', 'location.address'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Apply filters
    if (query.filters) {
      this.applyFilters(filter, query.filters);
    }

    // Build final query
    return {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      sort: this.buildSort(query.sort, query.q),
      from: ((query.page || 1) - 1) * (query.pageSize || 20),
      size: query.pageSize || 20,
      highlight: query.highlight ? this.buildHighlight() : undefined,
      aggs: this.buildAggregations(query.verticalType),
    };
  }

  private applyFilters(filter: QueryDslQueryContainer[], filters: SearchFilters): void {
    // Vertical type
    if (filters.verticalType) {
      filter.push({ term: { verticalType: filters.verticalType } });
    }

    // Vendor filter
    if (filters.vendorId) {
      filter.push({ term: { vendorId: filters.vendorId } });
    }

    // Price range
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      filter.push({
        range: {
          price: {
            ...(filters.priceMin !== undefined && { gte: filters.priceMin }),
            ...(filters.priceMax !== undefined && { lte: filters.priceMax }),
          },
        },
      });
    }

    // Location filters
    if (filters.city) {
      filter.push({ term: { 'location.city': filters.city } });
    }
    if (filters.state) {
      filter.push({ term: { 'location.state': filters.state } });
    }
    if (filters.country) {
      filter.push({ term: { 'location.country': filters.country } });
    }

    // Geo distance
    if (filters.location?.lat && filters.location?.lng && filters.location?.radius) {
      filter.push({
        geo_distance: {
          distance: `${filters.location.radius}km`,
          'location.coordinates': {
            lat: filters.location.lat,
            lon: filters.location.lng,
          },
        },
      });
    }

    // Attribute filters (vertical-specific)
    if (filters.attributes) {
      for (const [key, value] of Object.entries(filters.attributes)) {
        if (value.eq !== undefined) {
          filter.push({ term: { [`attributes.${key}`]: value.eq } });
        }
        if (value.in !== undefined && Array.isArray(value.in)) {
          filter.push({ terms: { [`attributes.${key}`]: value.in } });
        }
        if (value.gte !== undefined || value.lte !== undefined) {
          filter.push({
            range: {
              [`attributes.${key}`]: {
                ...(value.gte !== undefined && { gte: value.gte }),
                ...(value.lte !== undefined && { lte: value.lte }),
              },
            },
          });
        }
      }
    }

    // Featured only
    if (filters.featuredOnly) {
      filter.push({ term: { isFeatured: true } });
      filter.push({ range: { featuredUntil: { gte: 'now' } } });
    }
  }

  private buildSort(sort?: string, hasQuery?: string): SortCombinations[] {
    // Default sort: relevance (if query) or newest first
    if (!sort) {
      if (hasQuery) {
        return [{ _score: 'desc' }, { publishedAt: 'desc' }];
      }
      return [{ publishedAt: 'desc' }];
    }

    const [field, direction] = sort.split(':');
    const sortOrder = (direction === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

    const sortMap: Record<string, SortCombinations> = {
      price: { price: sortOrder },
      newest: { publishedAt: 'desc' },
      oldest: { publishedAt: 'asc' },
      title: { 'title.keyword': sortOrder },
    };

    return [sortMap[field] || { publishedAt: 'desc' }];
  }

  private buildHighlight(): Record<string, unknown> {
    return {
      fields: {
        title: { number_of_fragments: 0 },
        description: { number_of_fragments: 2, fragment_size: 150 },
        'location.address': { number_of_fragments: 0 },
      },
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
    };
  }

  private buildAggregations(verticalType?: string): Record<string, unknown> {
    const aggs: Record<string, unknown> = {
      verticalTypes: {
        terms: { field: 'verticalType', size: 10 },
      },
      cities: {
        terms: { field: 'location.city', size: 20 },
      },
      states: {
        terms: { field: 'location.state', size: 20 },
      },
      priceRanges: {
        range: {
          field: 'price',
          ranges: [
            { key: '0-100k', to: 100000 },
            { key: '100k-300k', from: 100000, to: 300000 },
            { key: '300k-500k', from: 300000, to: 500000 },
            { key: '500k-1M', from: 500000, to: 1000000 },
            { key: '1M+', from: 1000000 },
          ],
        },
      },
    };

    // Add vertical-specific aggregations
    if (verticalType === 'real_estate') {
      aggs.propertyTypes = {
        terms: { field: 'attributes.propertyType', size: 10 },
      };
      aggs.bedrooms = {
        terms: { field: 'attributes.bedrooms', size: 10 },
      };
      aggs.bathrooms = {
        terms: { field: 'attributes.bathrooms', size: 10 },
      };
      aggs.furnishing = {
        terms: { field: 'attributes.furnishing', size: 10 },
      };
      aggs.listingType = {
        terms: { field: 'attributes.listingType', size: 10 },
      };
    }

    return aggs;
  }
}
