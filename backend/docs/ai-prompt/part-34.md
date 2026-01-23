# PART 34 — OPENSEARCH & SEARCH INFRASTRUCTURE (LOCKED)

This part defines the **OpenSearch integration and search infrastructure**.
Search is the primary discovery mechanism for the marketplace.

All rules from PART 0–33 apply.

---

## 34.1 SEARCH ARCHITECTURE OVERVIEW

### Technology Stack
- **OpenSearch 2.x** for full-text search and analytics
- **Async indexing** via BullMQ jobs (see Part 31)
- **Event-driven sync** from domain events (see Part 28)
- **Multi-tenant isolation** via tenant-scoped queries

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│         (Search Service, Query Builder, Filters)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   OpenSearch Adapter                         │
│            (Connection, Index Management, Query)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenSearch Cluster                        │
│    ┌──────────────────────────────────────────────────┐    │
│    │  listings-{tenantId}  │  vendors-{tenantId}      │    │
│    └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 34.2 INDEX STRATEGY

### Index Per Tenant
```
listings-{tenantId}
vendors-{tenantId}
```

Rules:
- Each tenant has isolated indexes
- Index names are lowercase with hyphens
- Aliases used for zero-downtime reindexing

### Index Aliases
```
listings-{tenantId}          → listings-{tenantId}-v1
listings-{tenantId}-write    → listings-{tenantId}-v1
```

---

## 34.3 INDEX TEMPLATES

### Listings Index Template

```typescript
const listingsIndexTemplate = {
  index_patterns: ['listings-*'],
  template: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 1,
      analysis: {
        analyzer: {
          autocomplete: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'autocomplete_filter'],
          },
          autocomplete_search: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase'],
          },
        },
        filter: {
          autocomplete_filter: {
            type: 'edge_ngram',
            min_gram: 2,
            max_gram: 20,
          },
        },
      },
    },
    mappings: {
      dynamic: 'strict',
      properties: {
        // Identity
        id: { type: 'keyword' },
        tenantId: { type: 'keyword' },
        vendorId: { type: 'keyword' },
        verticalType: { type: 'keyword' },
        
        // Status
        status: { type: 'keyword' },
        
        // Content
        title: {
          type: 'text',
          analyzer: 'autocomplete',
          search_analyzer: 'autocomplete_search',
          fields: {
            keyword: { type: 'keyword' },
            raw: { type: 'text', analyzer: 'standard' },
          },
        },
        description: {
          type: 'text',
          analyzer: 'standard',
        },
        slug: { type: 'keyword' },
        
        // Price
        price: { type: 'scaled_float', scaling_factor: 100 },
        currency: { type: 'keyword' },
        
        // Location
        location: {
          properties: {
            address: { type: 'text' },
            city: { type: 'keyword' },
            state: { type: 'keyword' },
            country: { type: 'keyword' },
            postalCode: { type: 'keyword' },
            coordinates: { type: 'geo_point' },
          },
        },
        
        // Attributes (vertical-specific, dynamic based on vertical)
        attributes: {
          type: 'object',
          dynamic: true,
        },
        
        // Features
        isFeatured: { type: 'boolean' },
        featuredUntil: { type: 'date' },
        
        // Media
        primaryImageUrl: { type: 'keyword', index: false },
        mediaCount: { type: 'integer' },
        
        // Vendor info (denormalized)
        vendor: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text' },
            slug: { type: 'keyword' },
          },
        },
        
        // Timestamps
        publishedAt: { type: 'date' },
        expiresAt: { type: 'date' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      },
    },
  },
};
```

---

## 34.4 SEARCH SERVICE

```typescript
// infrastructure/search/search.service.ts
@Injectable()
export class SearchService {
  constructor(
    private readonly opensearchClient: OpenSearchClient,
    private readonly verticalRegistry: VerticalRegistry,
  ) {}

  async searchListings(
    tenantId: string,
    query: SearchListingsQuery,
  ): Promise<SearchResult<ListingSearchDocument>> {
    const { q, filters, sort, page, pageSize, highlight } = query;
    
    // Build OpenSearch query
    const searchBody = this.buildSearchQuery(tenantId, query);
    
    const response = await this.opensearchClient.search({
      index: `listings-${tenantId}`,
      body: searchBody,
    });
    
    return this.transformResponse(response, highlight);
  }

  private buildSearchQuery(tenantId: string, query: SearchListingsQuery) {
    const must: QueryDslQueryContainer[] = [];
    const filter: QueryDslQueryContainer[] = [];
    
    // Always filter by tenant
    filter.push({ term: { tenantId } });
    
    // Status filter (default: PUBLISHED)
    filter.push({ term: { status: query.status || 'PUBLISHED' } });
    
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

  private applyFilters(filter: QueryDslQueryContainer[], filters: SearchFilters) {
    // Vertical type
    if (filters.verticalType) {
      filter.push({ term: { verticalType: filters.verticalType } });
    }
    
    // Price range
    if (filters.priceMin || filters.priceMax) {
      filter.push({
        range: {
          price: {
            ...(filters.priceMin && { gte: filters.priceMin }),
            ...(filters.priceMax && { lte: filters.priceMax }),
          },
        },
      });
    }
    
    // Location
    if (filters.city) {
      filter.push({ term: { 'location.city': filters.city } });
    }
    if (filters.state) {
      filter.push({ term: { 'location.state': filters.state } });
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
        if (value.in !== undefined) {
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
    const sortOrder = direction === 'asc' ? 'asc' : 'desc';
    
    const sortMap: Record<string, SortCombinations> = {
      price: { price: sortOrder },
      newest: { publishedAt: 'desc' },
      oldest: { publishedAt: 'asc' },
      title: { 'title.keyword': sortOrder },
    };
    
    return [sortMap[field] || { publishedAt: 'desc' }];
  }

  private buildHighlight() {
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

  private buildAggregations(verticalType?: string) {
    const aggs: Record<string, unknown> = {
      verticalTypes: { terms: { field: 'verticalType', size: 10 } },
      cities: { terms: { field: 'location.city', size: 20 } },
      priceRanges: {
        range: {
          field: 'price',
          ranges: [
            { to: 100000 },
            { from: 100000, to: 300000 },
            { from: 300000, to: 500000 },
            { from: 500000, to: 1000000 },
            { from: 1000000 },
          ],
        },
      },
    };
    
    // Add vertical-specific aggregations
    if (verticalType === 'real_estate') {
      aggs.propertyTypes = { terms: { field: 'attributes.propertyType', size: 10 } };
      aggs.bedrooms = { terms: { field: 'attributes.bedrooms', size: 10 } };
      aggs.furnishing = { terms: { field: 'attributes.furnishing', size: 10 } };
    }
    
    return aggs;
  }
}
```

---

## 34.5 INDEXING SERVICE

```typescript
// infrastructure/search/indexing.service.ts
@Injectable()
export class IndexingService {
  constructor(
    private readonly opensearchClient: OpenSearchClient,
    private readonly listingRepository: ListingRepository,
    private readonly vendorRepository: VendorRepository,
  ) {}

  async indexListing(listing: Listing): Promise<void> {
    const document = await this.buildListingDocument(listing);
    
    await this.opensearchClient.index({
      index: `listings-${listing.tenantId}`,
      id: listing.id,
      body: document,
      refresh: 'wait_for',
    });
  }

  async deleteListing(tenantId: string, listingId: string): Promise<void> {
    await this.opensearchClient.delete({
      index: `listings-${tenantId}`,
      id: listingId,
      refresh: 'wait_for',
    });
  }

  async bulkIndex(tenantId: string, listings: Listing[]): Promise<BulkResult> {
    const operations = [];
    
    for (const listing of listings) {
      const document = await this.buildListingDocument(listing);
      operations.push(
        { index: { _index: `listings-${tenantId}`, _id: listing.id } },
        document,
      );
    }
    
    const response = await this.opensearchClient.bulk({
      body: operations,
      refresh: 'wait_for',
    });
    
    return {
      total: listings.length,
      successful: listings.length - (response.errors ? response.items.filter(i => i.index?.error).length : 0),
      failed: response.errors ? response.items.filter(i => i.index?.error).length : 0,
    };
  }

  async reindexTenant(tenantId: string, verticalType?: string): Promise<ReindexResult> {
    const BATCH_SIZE = 100;
    let indexed = 0;
    let cursor: string | undefined;
    
    do {
      const listings = await this.listingRepository.findMany({
        where: {
          tenantId,
          ...(verticalType && { verticalType }),
          status: { in: ['PUBLISHED', 'EXPIRED'] },
        },
        take: BATCH_SIZE,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
      });
      
      if (listings.length === 0) break;
      
      await this.bulkIndex(tenantId, listings);
      indexed += listings.length;
      cursor = listings[listings.length - 1].id;
      
    } while (true);
    
    return { indexed };
  }

  private async buildListingDocument(listing: Listing): Promise<ListingSearchDocument> {
    const vendor = await this.vendorRepository.findUnique({
      where: { id: listing.vendorId },
    });
    
    return {
      id: listing.id,
      tenantId: listing.tenantId,
      vendorId: listing.vendorId,
      verticalType: listing.verticalType,
      status: listing.status,
      title: listing.title,
      description: listing.description,
      slug: listing.slug,
      price: listing.price,
      currency: listing.currency,
      location: listing.location ? {
        address: listing.location.address,
        city: listing.location.city,
        state: listing.location.state,
        country: listing.location.country,
        postalCode: listing.location.postalCode,
        coordinates: listing.location.lat && listing.location.lng
          ? { lat: listing.location.lat, lon: listing.location.lng }
          : undefined,
      } : undefined,
      attributes: listing.attributes,
      isFeatured: listing.isFeatured,
      featuredUntil: listing.featuredUntil?.toISOString(),
      primaryImageUrl: listing.media?.[0]?.url,
      mediaCount: listing.media?.length || 0,
      vendor: vendor ? {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
      } : undefined,
      publishedAt: listing.publishedAt?.toISOString(),
      expiresAt: listing.expiresAt?.toISOString(),
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }
}
```

---

## 34.6 EVENT-DRIVEN INDEXING

Indexing is triggered by domain events (see Part 28 & Part 31):

```typescript
// search/search-event-handlers.service.ts
@Injectable()
export class SearchEventHandlers {
  constructor(
    @InjectQueue('search.index') private searchQueue: Queue,
  ) {}

  @OnEvent('listing.published')
  async handleListingPublished(event: ListingPublishedEvent) {
    await this.searchQueue.add('listing.index', {
      tenantId: event.tenantId,
      listingId: event.listingId,
    }, {
      jobId: `listing:${event.listingId}`, // Dedupe
      delay: 1000, // Debounce
    });
  }

  @OnEvent('listing.updated')
  async handleListingUpdated(event: ListingUpdatedEvent) {
    if (event.status === 'PUBLISHED') {
      await this.searchQueue.add('listing.index', {
        tenantId: event.tenantId,
        listingId: event.listingId,
      }, {
        jobId: `listing:${event.listingId}`,
        delay: 1000,
      });
    }
  }

  @OnEvent('listing.unpublished')
  @OnEvent('listing.archived')
  @OnEvent('listing.deleted')
  async handleListingRemoved(event: ListingRemovedEvent) {
    await this.searchQueue.add('listing.delete', {
      tenantId: event.tenantId,
      listingId: event.listingId,
    });
  }
}
```

---

## 34.7 AUTOCOMPLETE / SUGGESTIONS

```typescript
async getSuggestions(
  tenantId: string,
  prefix: string,
  limit: number = 10,
): Promise<Suggestion[]> {
  const response = await this.opensearchClient.search({
    index: `listings-${tenantId}`,
    body: {
      query: {
        bool: {
          must: [
            { prefix: { 'title.keyword': { value: prefix.toLowerCase() } } },
          ],
          filter: [
            { term: { status: 'PUBLISHED' } },
          ],
        },
      },
      _source: ['id', 'title', 'slug', 'price', 'location.city'],
      size: limit,
    },
  });
  
  return response.hits.hits.map(hit => ({
    id: hit._source.id,
    title: hit._source.title,
    slug: hit._source.slug,
    price: hit._source.price,
    city: hit._source.location?.city,
  }));
}
```

---

## 34.8 GLOBAL SEARCH API

```typescript
// search/search.controller.ts
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('listings')
  @Public() // Public for published listings
  async searchListings(
    @Query() query: SearchListingsQueryDto,
    @TenantContext() tenant: Tenant,
  ): Promise<SearchListingsResponse> {
    const result = await this.searchService.searchListings(tenant.id, {
      q: query.q,
      filters: this.parseFilters(query),
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
      highlight: query.highlight,
    });
    
    return {
      data: result.hits,
      meta: {
        requestId: this.requestId,
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          totalItems: result.total,
          totalPages: Math.ceil(result.total / (query.pageSize || 20)),
        },
        facets: result.aggregations,
      },
    };
  }

  @Get('suggestions')
  @Public()
  async getSuggestions(
    @Query('q') q: string,
    @Query('limit') limit: number = 10,
    @TenantContext() tenant: Tenant,
  ): Promise<SuggestionsResponse> {
    const suggestions = await this.searchService.getSuggestions(
      tenant.id,
      q,
      limit,
    );
    
    return { data: suggestions };
  }
}
```

---

## 34.9 SEARCH QUERY PARAMETERS

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Full-text search query |
| `verticalType` | string | Filter by vertical |
| `priceMin` | number | Minimum price |
| `priceMax` | number | Maximum price |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `lat` | number | Geo search latitude |
| `lng` | number | Geo search longitude |
| `radius` | number | Geo search radius (km) |
| `attributes[key]` | varies | Vertical-specific filters |
| `sort` | string | Sort field:direction |
| `page` | number | Page number (1-based) |
| `pageSize` | number | Items per page (max 100) |
| `highlight` | boolean | Include highlights |
| `featuredOnly` | boolean | Only featured listings |

---

## 34.10 SEARCH RESPONSE SHAPE

```typescript
interface SearchListingsResponse {
  data: ListingSearchHit[];
  meta: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    facets?: {
      verticalTypes?: FacetBucket[];
      cities?: FacetBucket[];
      priceRanges?: RangeBucket[];
      propertyTypes?: FacetBucket[];
      bedrooms?: FacetBucket[];
      // ... vertical-specific facets
    };
  };
}

interface ListingSearchHit {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  location: {
    city: string;
    state: string;
  };
  primaryImageUrl?: string;
  verticalType: string;
  attributes: Record<string, unknown>;
  vendor: {
    id: string;
    name: string;
    slug: string;
  };
  highlights?: {
    title?: string[];
    description?: string[];
  };
}

interface FacetBucket {
  value: string;
  count: number;
}
```

---

## 34.11 INDEX MANAGEMENT

### Create Tenant Index
```typescript
async createTenantIndex(tenantId: string): Promise<void> {
  const indexName = `listings-${tenantId}-v1`;
  const aliasName = `listings-${tenantId}`;
  
  // Create index
  await this.opensearchClient.indices.create({
    index: indexName,
    body: listingsIndexTemplate.template,
  });
  
  // Create alias
  await this.opensearchClient.indices.putAlias({
    index: indexName,
    name: aliasName,
  });
}
```

### Zero-Downtime Reindex
```typescript
async reindexWithZeroDowntime(tenantId: string): Promise<void> {
  const currentAlias = `listings-${tenantId}`;
  const newIndex = `listings-${tenantId}-v${Date.now()}`;
  
  // Create new index
  await this.opensearchClient.indices.create({
    index: newIndex,
    body: listingsIndexTemplate.template,
  });
  
  // Reindex to new index
  await this.reindexTenant(tenantId);
  
  // Switch alias atomically
  await this.opensearchClient.indices.updateAliases({
    body: {
      actions: [
        { remove: { index: '*', alias: currentAlias } },
        { add: { index: newIndex, alias: currentAlias } },
      ],
    },
  });
  
  // Delete old index (after verification)
}
```

---

## 34.12 MONITORING & HEALTH

```typescript
@Get('/health/search')
async getSearchHealth() {
  const health = await this.opensearchClient.cluster.health();
  const stats = await this.opensearchClient.indices.stats({ index: 'listings-*' });
  
  return {
    status: health.status, // green, yellow, red
    numberOfNodes: health.number_of_nodes,
    activeShards: health.active_shards,
    indices: {
      count: Object.keys(stats.indices).length,
      totalDocs: stats._all.primaries.docs.count,
      totalSize: stats._all.primaries.store.size_in_bytes,
    },
  };
}
```

---

## 34.13 FORBIDDEN PRACTICES

You must not:
- Query OpenSearch from listing core (use events)
- Store sensitive data in search index
- Perform synchronous indexing in request path
- Allow cross-tenant search without explicit permission
- Skip tenant isolation in queries
- Index draft or private listings to public index

---

## 34.14 EXECUTION DIRECTIVE

All search features must:
- Maintain strict tenant isolation
- Use async indexing via events
- Support zero-downtime reindexing
- Provide faceted search results
- Handle index failures gracefully

Search is discovery. Make it excellent.

END OF PART 34.
