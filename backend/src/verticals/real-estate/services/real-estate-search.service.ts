/**
 * Real Estate Vertical - Search Service
 * Part 29/34 - Reference Implementation
 */

import { Injectable, Logger } from '@nestjs/common';
import { PartnerContextService } from '@core/partner-context';
import { OpenSearchService } from '@infrastructure/search/opensearch.service';
import { getListingsIndexName } from '@infrastructure/search/mappings/listings.mapping';

import {
  buildRealEstateFilters,
  buildRealEstateAggregations,
  RealEstateFilterParams,
} from '../registry/search.mapping';

import {
  RealEstateSearchQueryDto,
  RealEstateSearchResultDto,
  RealEstateFacetsDto,
  FacetBucketDto,
} from '../dto/search.dto';

import {
  PROPERTY_TYPE_OPTIONS,
  LISTING_TYPE_OPTIONS,
  FURNISHING_OPTIONS,
  TENURE_OPTIONS,
} from '../registry/attribute.schema';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface SearchHit {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  primaryImageUrl?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  attributes?: Record<string, unknown>;
  isFeatured: boolean;
  publishedAt: string;
  _score?: number;
}

interface AggregationBucket {
  key: string | number;
  doc_count: number;
  key_as_string?: string;
}

interface _SearchResponse {
  hits: SearchHit[];
  total: number;
  aggregations?: Record<
    string,
    {
      buckets?: AggregationBucket[];
    }
  >;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RealEstateSearchService {
  private readonly logger = new Logger(RealEstateSearchService.name);

  constructor(
    private readonly opensearchService: OpenSearchService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  /**
   * Search real estate listings with full filter and facet support
   */
  async search(
    partnerId: string,
    query: RealEstateSearchQueryDto,
  ): Promise<{
    hits: RealEstateSearchResultDto[];
    total: number;
    facets: RealEstateFacetsDto;
  }> {
    const indexName = getListingsIndexName(partnerId);

    try {
      const searchBody = this.buildSearchQuery(partnerId, query);

      this.logger.debug(`Real estate search on ${indexName}: ${JSON.stringify(searchBody)}`);

      const result = await this.opensearchService.search<SearchHit>(indexName, searchBody);

      const hits = this.transformHits(result.hits, query);
      const facets = this.transformFacets(
        result.aggregations as Record<string, { buckets?: AggregationBucket[] }> | undefined,
      );

      return {
        hits,
        total: result.total,
        facets,
      };
    } catch (error) {
      this.logger.error(`Real estate search failed for partner ${partnerId}:`, error);
      throw error;
    }
  }

  /**
   * Get suggestions for autocomplete
   */
  async getSuggestions(
    partnerId: string,
    prefix: string,
    limit: number = 10,
  ): Promise<{ id: string; title: string; slug: string; price: number | null; city?: string }[]> {
    const indexName = getListingsIndexName(partnerId);

    try {
      const result = await this.opensearchService.search<SearchHit>(indexName, {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: prefix,
                  fields: ['title^2', 'title.raw', 'location.address', 'location.city'],
                  type: 'phrase_prefix',
                },
              },
            ],
            filter: [
              { term: { partnerId } },
              { term: { verticalType: 'real_estate' } },
              { term: { status: 'PUBLISHED' } },
            ],
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
      this.logger.error(`Suggestions failed for partner ${partnerId}:`, error);
      return [];
    }
  }

  /**
   * Get facet counts for filter sidebar (without running full search)
   */
  async getFacetCounts(partnerId: string): Promise<RealEstateFacetsDto> {
    const indexName = getListingsIndexName(partnerId);

    try {
      const result = await this.opensearchService.search<SearchHit>(indexName, {
        query: {
          bool: {
            filter: [
              { term: { partnerId } },
              { term: { verticalType: 'real_estate' } },
              { term: { status: 'PUBLISHED' } },
            ],
          },
        },
        size: 0, // No hits, just aggregations
        aggs: buildRealEstateAggregations(),
      });

      return this.transformFacets(
        result.aggregations as Record<string, { buckets?: AggregationBucket[] }> | undefined,
      );
    } catch (error) {
      this.logger.error(`Facet counts failed for partner ${partnerId}:`, error);
      return this.emptyFacets();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // QUERY BUILDING
  // ─────────────────────────────────────────────────────────────────────────────

  private buildSearchQuery(
    partnerId: string,
    query: RealEstateSearchQueryDto,
  ): Record<string, unknown> {
    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];

    // Base filters
    filter.push({ term: { partnerId } });
    filter.push({ term: { verticalType: 'real_estate' } });
    filter.push({ term: { status: 'PUBLISHED' } });

    // Text search
    if (query.q) {
      must.push({
        multi_match: {
          query: query.q,
          fields: [
            'title^3',
            'title.raw^2',
            'description',
            'location.address',
            'location.city^1.5',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Real estate specific filters
    const realEstateFilters = buildRealEstateFilters(this.mapQueryToFilterParams(query));
    filter.push(...realEstateFilters);

    // Price filters
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      filter.push({
        range: {
          price: {
            ...(query.priceMin !== undefined && { gte: query.priceMin }),
            ...(query.priceMax !== undefined && { lte: query.priceMax }),
          },
        },
      });
    }

    // Location filters
    if (query.city) {
      filter.push({ term: { 'location.city': query.city } });
    }
    if (query.state) {
      filter.push({ term: { 'location.state': query.state } });
    }
    if (query.country) {
      filter.push({ term: { 'location.country': query.country } });
    }

    // Geo distance filter
    if (query.lat !== undefined && query.lng !== undefined && query.radius !== undefined) {
      filter.push({
        geo_distance: {
          distance: `${query.radius}km`,
          'location.coordinates': {
            lat: query.lat,
            lon: query.lng,
          },
        },
      });
    }

    // Vendor filter
    if (query.vendorId) {
      filter.push({ term: { vendorId: query.vendorId } });
    }

    // Featured filter
    if (query.featuredOnly) {
      filter.push({ term: { isFeatured: true } });
      filter.push({ range: { featuredUntil: { gte: 'now' } } });
    }

    // Build final query
    const searchBody: Record<string, unknown> = {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      sort: this.buildSort(query.sort, !!query.q, query.lat, query.lng),
      from: ((query.page || 1) - 1) * (query.pageSize || 20),
      size: query.pageSize || 20,
      aggs: buildRealEstateAggregations(),
    };

    // Add highlighting
    if (query.highlight) {
      searchBody.highlight = {
        fields: {
          title: { number_of_fragments: 0 },
          description: { number_of_fragments: 2, fragment_size: 150 },
          'location.address': { number_of_fragments: 0 },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      };
    }

    // Add script fields for distance calculation
    if (query.includeDistance && query.lat !== undefined && query.lng !== undefined) {
      searchBody.script_fields = {
        distance: {
          script: {
            source: `doc['location.coordinates'].arcDistance(params.lat, params.lon) / 1000`,
            params: { lat: query.lat, lon: query.lng },
          },
        },
      };
    }

    return searchBody;
  }

  private mapQueryToFilterParams(query: RealEstateSearchQueryDto): RealEstateFilterParams {
    return {
      propertyType: query.propertyType,
      listingType: query.listingType,
      tenure: query.tenure,
      bedroomsMin: query.bedroomsMin,
      bedroomsMax: query.bedroomsMax,
      bathroomsMin: query.bathroomsMin,
      bathroomsMax: query.bathroomsMax,
      builtUpSizeMin: query.builtUpSizeMin,
      builtUpSizeMax: query.builtUpSizeMax,
      landSizeMin: query.landSizeMin,
      landSizeMax: query.landSizeMax,
      furnishing: query.furnishing,
      condition: query.condition,
      yearBuiltMin: query.yearBuiltMin,
      yearBuiltMax: query.yearBuiltMax,
      facilities: query.facilities,
      nearbyAmenities: query.nearbyAmenities,
    };
  }

  private buildSort(
    sortField?: string,
    hasQuery?: boolean,
    lat?: number,
    lng?: number,
  ): Record<string, unknown>[] {
    // Default sort by relevance (if query) or newest
    if (!sortField) {
      if (hasQuery) {
        return [{ _score: 'desc' }, { publishedAt: 'desc' }];
      }
      return [{ publishedAt: 'desc' }];
    }

    const sortMap: Record<string, Record<string, unknown>[]> = {
      'price:asc': [{ price: 'asc' }],
      'price:desc': [{ price: 'desc' }],
      newest: [{ publishedAt: 'desc' }],
      oldest: [{ publishedAt: 'asc' }],
      'size:asc': [{ 'attributes.builtUpSize': 'asc' }],
      'size:desc': [{ 'attributes.builtUpSize': 'desc' }],
      'bedrooms:asc': [{ 'attributes.bedrooms': 'asc' }],
      'bedrooms:desc': [{ 'attributes.bedrooms': 'desc' }],
      relevance: [{ _score: 'desc' }, { publishedAt: 'desc' }],
    };

    // Distance sort (requires geo-point)
    if (sortField === 'distance' && lat !== undefined && lng !== undefined) {
      return [
        {
          _geo_distance: {
            'location.coordinates': { lat, lon: lng },
            order: 'asc',
            unit: 'km',
          },
        },
      ];
    }

    return sortMap[sortField] || [{ publishedAt: 'desc' }];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESULT TRANSFORMATION
  // ─────────────────────────────────────────────────────────────────────────────

  private transformHits(
    hits: SearchHit[],
    query: RealEstateSearchQueryDto,
  ): RealEstateSearchResultDto[] {
    return hits.map((hit) => {
      const result: RealEstateSearchResultDto = {
        id: hit.id,
        title: hit.title,
        slug: hit.slug,
        price: hit.price,
        currency: hit.currency || 'MYR',
        primaryImageUrl: hit.primaryImageUrl,
        location: {
          address: hit.location?.address,
          city: hit.location?.city,
          state: hit.location?.state,
          country: hit.location?.country,
        },
        attributes: {
          propertyType: (hit.attributes?.propertyType as string) || '',
          listingType: (hit.attributes?.listingType as string) || '',
          bedrooms: hit.attributes?.bedrooms as number | undefined,
          bathrooms: hit.attributes?.bathrooms as number | undefined,
          builtUpSize: hit.attributes?.builtUpSize as number | undefined,
          furnishing: hit.attributes?.furnishing as string | undefined,
        },
        isFeatured: hit.isFeatured || false,
        publishedAt: new Date(hit.publishedAt),
      };

      // Add distance if geo-search was used
      if (
        query.includeDistance &&
        query.lat !== undefined &&
        query.lng !== undefined &&
        hit.location?.coordinates
      ) {
        result.distance = this.calculateDistance(
          query.lat,
          query.lng,
          hit.location.coordinates.lat,
          hit.location.coordinates.lon,
        );
      }

      return result;
    });
  }

  private transformFacets(
    aggregations?: Record<string, { buckets?: AggregationBucket[] }>,
  ): RealEstateFacetsDto {
    if (!aggregations) {
      return this.emptyFacets();
    }

    return {
      propertyType: this.transformBuckets(aggregations.propertyType?.buckets, 'propertyType'),
      listingType: this.transformBuckets(aggregations.listingType?.buckets, 'listingType'),
      bedrooms: this.transformBuckets(aggregations.bedrooms?.buckets, 'bedrooms'),
      furnishing: this.transformBuckets(aggregations.furnishing?.buckets, 'furnishing'),
      tenure: this.transformBuckets(aggregations.tenure?.buckets, 'tenure'),
      priceRange: this.transformBuckets(aggregations.priceRange?.buckets, 'priceRange'),
      city: this.transformBuckets(aggregations.city?.buckets, 'city'),
      state: this.transformBuckets(aggregations.state?.buckets, 'state'),
    };
  }

  private transformBuckets(
    buckets: AggregationBucket[] | undefined,
    facetType: string,
  ): FacetBucketDto[] {
    if (!buckets) {
      return [];
    }

    return buckets.map((bucket) => ({
      key: String(bucket.key),
      count: bucket.doc_count,
      label: this.getLabelForBucket(facetType, String(bucket.key)),
    }));
  }

  private getLabelForBucket(facetType: string, key: string): string {
    const labelMaps: Record<string, Record<string, string>> = {
      propertyType: Object.fromEntries(PROPERTY_TYPE_OPTIONS.map((o) => [o.value, o.label])),
      listingType: Object.fromEntries(LISTING_TYPE_OPTIONS.map((o) => [o.value, o.label])),
      furnishing: Object.fromEntries(FURNISHING_OPTIONS.map((o) => [o.value, o.label])),
      tenure: Object.fromEntries(TENURE_OPTIONS.map((o) => [o.value, o.label])),
      priceRange: {
        below_100k: 'Below RM 100K',
        '100k_to_300k': 'RM 100K - 300K',
        '300k_to_500k': 'RM 300K - 500K',
        '500k_to_750k': 'RM 500K - 750K',
        '750k_to_1m': 'RM 750K - 1M',
        '1m_to_2m': 'RM 1M - 2M',
        '2m_to_5m': 'RM 2M - 5M',
        above_5m: 'Above RM 5M',
      },
      bedrooms: {},
    };

    const map = labelMaps[facetType];
    if (map && map[key]) {
      return map[key];
    }

    // For bedrooms, format as "X Bedroom(s)"
    if (facetType === 'bedrooms') {
      const num = parseInt(key, 10);
      if (!isNaN(num)) {
        return num === 1 ? '1 Bedroom' : `${num} Bedrooms`;
      }
    }

    return key;
  }

  private emptyFacets(): RealEstateFacetsDto {
    return {
      propertyType: [],
      listingType: [],
      bedrooms: [],
      furnishing: [],
      tenure: [],
      priceRange: [],
      city: [],
      state: [],
    };
  }

  /**
   * Calculate distance between two geo points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // Round to 2 decimal places
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
