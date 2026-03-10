# PART 25 — GLOBAL SEARCH & DISCOVERY (LOCKED)

This part defines the **frontend implementation for OpenSearch-powered global search**.
Search is the primary discovery mechanism for the marketplace.

All rules from PART 0–24 apply.

---

## 25.1 SEARCH ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    Search UI Layer                           │
│   ┌──────────────┬──────────────┬──────────────────────┐   │
│   │ SearchInput  │ SearchFilters│ SearchResults        │   │
│   │ Autocomplete │ FacetPanels  │ ListingCards         │   │
│   └──────────────┴──────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│   ┌──────────────┬──────────────┬──────────────────────┐   │
│   │ useSearch    │ useFilters   │ useFacets            │   │
│   │ URL sync     │ Debounce     │ Aggregation parsing  │   │
│   └──────────────┴──────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Integration                           │
│                  GET /api/v1/search/listings                │
│                  GET /api/v1/search/suggestions             │
└─────────────────────────────────────────────────────────────┘
```

---

## 25.2 SEARCH API TYPES

```typescript
// types/search.ts

/**
 * Search query parameters
 */
export interface SearchParams {
  q?: string;
  verticalType?: string;
  priceMin?: number;
  priceMax?: number;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  attributes?: Record<string, AttributeFilter>;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
  highlight?: boolean;
  featuredOnly?: boolean;
}

export interface AttributeFilter {
  eq?: string | number | boolean;
  in?: (string | number)[];
  gte?: number;
  lte?: number;
}

export type SearchSort = 
  | 'relevance'
  | 'newest'
  | 'oldest'
  | 'price:asc'
  | 'price:desc';

/**
 * Search response
 */
export interface SearchResponse<T> {
  data: T[];
  meta: {
    requestId: string;
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    facets?: SearchFacets;
  };
}

export interface SearchFacets {
  verticalTypes?: FacetBucket[];
  cities?: FacetBucket[];
  priceRanges?: RangeBucket[];
  propertyTypes?: FacetBucket[];
  bedrooms?: FacetBucket[];
  furnishing?: FacetBucket[];
  [key: string]: FacetBucket[] | RangeBucket[] | undefined;
}

export interface FacetBucket {
  value: string;
  count: number;
}

export interface RangeBucket {
  from?: number;
  to?: number;
  count: number;
}

/**
 * Search hit (listing result)
 */
export interface SearchHit {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  primaryImageUrl?: string;
  verticalType: string;
  attributes: Record<string, unknown>;
  vendor: {
    id: string;
    name: string;
    slug: string;
  };
  isFeatured: boolean;
  highlights?: {
    title?: string[];
    description?: string[];
  };
}

/**
 * Autocomplete suggestion
 */
export interface Suggestion {
  id: string;
  title: string;
  slug: string;
  price: number;
  city?: string;
}
```

---

## 25.3 SEARCH API FUNCTIONS

```typescript
// lib/api/search.ts
import { apiClient } from './client';
import type { SearchParams, SearchResponse, SearchHit, Suggestion } from '@/types/search';

/**
 * Search listings with filters
 */
export async function searchListings(
  params: SearchParams,
): Promise<SearchResponse<SearchHit>> {
  const searchParams = serializeSearchParams(params);
  
  const response = await apiClient.get<SearchResponse<SearchHit>>(
    '/search/listings',
    { params: searchParams },
  );
  
  return response.data;
}

/**
 * Get autocomplete suggestions
 */
export async function getSuggestions(
  query: string,
  limit: number = 10,
): Promise<Suggestion[]> {
  const response = await apiClient.get<{ data: Suggestion[] }>(
    '/search/suggestions',
    { params: { q: query, limit } },
  );
  
  return response.data.data;
}

/**
 * Serialize search params to URL-safe format
 */
function serializeSearchParams(params: SearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (params.q) result.q = params.q;
  if (params.verticalType) result.verticalType = params.verticalType;
  if (params.priceMin) result.priceMin = params.priceMin.toString();
  if (params.priceMax) result.priceMax = params.priceMax.toString();
  if (params.city) result.city = params.city;
  if (params.state) result.state = params.state;
  if (params.lat) result.lat = params.lat.toString();
  if (params.lng) result.lng = params.lng.toString();
  if (params.radius) result.radius = params.radius.toString();
  if (params.sort) result.sort = params.sort;
  if (params.page) result.page = params.page.toString();
  if (params.pageSize) result.pageSize = params.pageSize.toString();
  if (params.highlight) result.highlight = 'true';
  if (params.featuredOnly) result.featuredOnly = 'true';
  
  // Serialize attribute filters
  if (params.attributes) {
    for (const [key, filter] of Object.entries(params.attributes)) {
      if (filter.eq !== undefined) {
        result[`attributes[${key}]`] = String(filter.eq);
      }
      if (filter.in !== undefined) {
        result[`attributes[${key}]`] = filter.in.join(',');
      }
      if (filter.gte !== undefined) {
        result[`attributes[${key}][gte]`] = String(filter.gte);
      }
      if (filter.lte !== undefined) {
        result[`attributes[${key}][lte]`] = String(filter.lte);
      }
    }
  }
  
  return result;
}
```

---

## 25.4 SEARCH HOOKS

### useSearch Hook (Core)

```typescript
// hooks/use-search.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { searchListings } from '@/lib/api/search';
import type { SearchParams, SearchResponse, SearchHit } from '@/types/search';

export function useSearch(defaultParams?: Partial<SearchParams>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Parse params from URL
  const params = parseSearchParams(searchParams, defaultParams);
  const debouncedQuery = useDebouncedValue(params.q, 300);
  
  // Search query
  const query = useQuery({
    queryKey: ['search', 'listings', { ...params, q: debouncedQuery }],
    queryFn: () => searchListings({ ...params, q: debouncedQuery }),
    placeholderData: keepPreviousData,
    staleTime: 30_000, // 30s
    gcTime: 5 * 60_000, // 5min
  });
  
  // Update URL when params change
  const setParams = useCallback((newParams: Partial<SearchParams>) => {
    const updated = { ...params, ...newParams };
    const urlParams = new URLSearchParams();
    
    if (updated.q) urlParams.set('q', updated.q);
    if (updated.verticalType) urlParams.set('vertical', updated.verticalType);
    if (updated.priceMin) urlParams.set('priceMin', updated.priceMin.toString());
    if (updated.priceMax) urlParams.set('priceMax', updated.priceMax.toString());
    if (updated.city) urlParams.set('city', updated.city);
    if (updated.sort && updated.sort !== 'relevance') urlParams.set('sort', updated.sort);
    if (updated.page && updated.page > 1) urlParams.set('page', updated.page.toString());
    
    router.push(`/search?${urlParams.toString()}`, { scroll: false });
  }, [params, router]);
  
  const setQuery = (q: string) => setParams({ q, page: 1 });
  const setPage = (page: number) => setParams({ page });
  const setSort = (sort: SearchSort) => setParams({ sort, page: 1 });
  const clearFilters = () => router.push('/search');
  
  return {
    ...query,
    params,
    setParams,
    setQuery,
    setPage,
    setSort,
    clearFilters,
  };
}

function parseSearchParams(
  urlParams: URLSearchParams,
  defaults?: Partial<SearchParams>,
): SearchParams {
  return {
    q: urlParams.get('q') || defaults?.q,
    verticalType: urlParams.get('vertical') || defaults?.verticalType,
    priceMin: urlParams.get('priceMin') ? Number(urlParams.get('priceMin')) : undefined,
    priceMax: urlParams.get('priceMax') ? Number(urlParams.get('priceMax')) : undefined,
    city: urlParams.get('city') || undefined,
    state: urlParams.get('state') || undefined,
    sort: (urlParams.get('sort') as SearchSort) || 'relevance',
    page: urlParams.get('page') ? Number(urlParams.get('page')) : 1,
    pageSize: 20,
    highlight: true,
  };
}
```

### useAutocomplete Hook

```typescript
// hooks/use-autocomplete.ts
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getSuggestions } from '@/lib/api/search';

export function useAutocomplete(query: string, enabled: boolean = true) {
  const debouncedQuery = useDebouncedValue(query, 150);
  
  return useQuery({
    queryKey: ['search', 'suggestions', debouncedQuery],
    queryFn: () => getSuggestions(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 60_000, // 1min cache
    gcTime: 5 * 60_000,
  });
}
```

### useSearchFacets Hook

```typescript
// hooks/use-search-facets.ts
import { useMemo } from 'react';
import type { SearchFacets, FacetBucket } from '@/types/search';

export function useSearchFacets(facets?: SearchFacets) {
  return useMemo(() => {
    if (!facets) return null;
    
    return {
      verticalTypes: formatFacets(facets.verticalTypes),
      cities: formatFacets(facets.cities, 10), // Top 10
      priceRanges: formatPriceRanges(facets.priceRanges),
      // Vertical-specific
      propertyTypes: formatFacets(facets.propertyTypes),
      bedrooms: formatFacets(facets.bedrooms),
      furnishing: formatFacets(facets.furnishing),
    };
  }, [facets]);
}

function formatFacets(buckets?: FacetBucket[], limit?: number): FacetOption[] {
  if (!buckets) return [];
  const sorted = [...buckets].sort((a, b) => b.count - a.count);
  const limited = limit ? sorted.slice(0, limit) : sorted;
  return limited.map(b => ({
    value: b.value,
    label: formatLabel(b.value),
    count: b.count,
  }));
}
```

---

## 25.5 SEARCH INPUT COMPONENT

```typescript
// components/search/search-input.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAutocomplete } from '@/hooks/use-autocomplete';
import { SuggestionsList } from './suggestions-list';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search listings...',
  className,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: suggestions, isLoading } = useAutocomplete(
    value,
    isFocused && value.length >= 2,
  );
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
    setIsFocused(false);
    inputRef.current?.blur();
  }, [value, onSearch]);
  
  const handleSuggestionSelect = useCallback((suggestion: Suggestion) => {
    onChange(suggestion.title);
    onSearch(suggestion.title);
    setIsFocused(false);
  }, [onChange, onSearch]);
  
  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);
  
  const showSuggestions = isFocused && value.length >= 2 && (suggestions?.length || isLoading);
  
  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          aria-label="Search listings"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
          role="combobox"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {value && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" size="sm">
            Search
          </Button>
        </div>
      </div>
      
      {showSuggestions && (
        <SuggestionsList
          id="search-suggestions"
          suggestions={suggestions || []}
          isLoading={isLoading}
          onSelect={handleSuggestionSelect}
        />
      )}
    </form>
  );
}
```

---

## 25.6 SUGGESTIONS LIST COMPONENT

```typescript
// components/search/suggestions-list.tsx
'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { Suggestion } from '@/types/search';

interface SuggestionsListProps {
  id: string;
  suggestions: Suggestion[];
  isLoading: boolean;
  onSelect: (suggestion: Suggestion) => void;
}

export function SuggestionsList({
  id,
  suggestions,
  isLoading,
  onSelect,
}: SuggestionsListProps) {
  if (isLoading) {
    return (
      <div
        id={id}
        role="listbox"
        className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md"
      >
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">Loading suggestions...</span>
        </div>
      </div>
    );
  }
  
  if (suggestions.length === 0) {
    return (
      <div
        id={id}
        role="listbox"
        className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md"
      >
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">No suggestions found</span>
        </div>
      </div>
    );
  }
  
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.id}
          role="option"
          aria-selected={false}
          className="cursor-pointer"
        >
          <button
            type="button"
            onClick={() => onSelect(suggestion)}
            className="w-full px-4 py-3 text-left hover:bg-accent focus:bg-accent focus:outline-none flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{suggestion.title}</p>
              {suggestion.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {suggestion.city}
                </p>
              )}
            </div>
            <span className="text-sm font-medium text-primary">
              {formatCurrency(suggestion.price)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## 25.7 SEARCH FILTERS PANEL

```typescript
// components/search/search-filters.tsx
'use client';

import { useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';
import { useSearch } from '@/hooks/use-search';
import { useSearchFacets } from '@/hooks/use-search-facets';
import { formatCurrency } from '@/lib/format';

export function SearchFilters() {
  const { data, params, setParams, clearFilters } = useSearch();
  const facets = useSearchFacets(data?.meta.facets);
  
  const handlePriceChange = useCallback((values: number[]) => {
    setParams({
      priceMin: values[0] || undefined,
      priceMax: values[1] || undefined,
      page: 1,
    });
  }, [setParams]);
  
  const handleFacetToggle = useCallback((key: string, value: string, checked: boolean) => {
    // For single-select facets
    setParams({
      [key]: checked ? value : undefined,
      page: 1,
    });
  }, [setParams]);
  
  const activeFiltersCount = countActiveFilters(params);
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Filters</SheetTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Price Range */}
          <FilterSection title="Price Range">
            <div className="space-y-4">
              <Slider
                min={0}
                max={10000000}
                step={50000}
                value={[params.priceMin || 0, params.priceMax || 10000000]}
                onValueChange={handlePriceChange}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(params.priceMin || 0)}</span>
                <span>{formatCurrency(params.priceMax || 10000000)}</span>
              </div>
            </div>
          </FilterSection>
          
          {/* Vertical Type */}
          {facets?.verticalTypes && facets.verticalTypes.length > 0 && (
            <FilterSection title="Category">
              <FacetList
                facets={facets.verticalTypes}
                selected={params.verticalType}
                onToggle={(value, checked) => handleFacetToggle('verticalType', value, checked)}
              />
            </FilterSection>
          )}
          
          {/* Cities */}
          {facets?.cities && facets.cities.length > 0 && (
            <FilterSection title="City">
              <FacetList
                facets={facets.cities}
                selected={params.city}
                onToggle={(value, checked) => handleFacetToggle('city', value, checked)}
              />
            </FilterSection>
          )}
          
          {/* Property Type (Real Estate) */}
          {facets?.propertyTypes && facets.propertyTypes.length > 0 && (
            <FilterSection title="Property Type">
              <FacetList
                facets={facets.propertyTypes}
                selected={params.attributes?.propertyType?.eq as string}
                onToggle={(value, checked) => {
                  setParams({
                    attributes: {
                      ...params.attributes,
                      propertyType: checked ? { eq: value } : undefined,
                    },
                    page: 1,
                  });
                }}
              />
            </FilterSection>
          )}
          
          {/* Bedrooms (Real Estate) */}
          {facets?.bedrooms && facets.bedrooms.length > 0 && (
            <FilterSection title="Bedrooms">
              <FacetList
                facets={facets.bedrooms}
                selected={params.attributes?.bedrooms?.eq?.toString()}
                onToggle={(value, checked) => {
                  setParams({
                    attributes: {
                      ...params.attributes,
                      bedrooms: checked ? { eq: parseInt(value) } : undefined,
                    },
                    page: 1,
                  });
                }}
              />
            </FilterSection>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      {children}
    </div>
  );
}

function FacetList({
  facets,
  selected,
  onToggle,
}: {
  facets: { value: string; label: string; count: number }[];
  selected?: string;
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {facets.map((facet) => (
        <label
          key={facet.value}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox
            checked={selected === facet.value}
            onCheckedChange={(checked) => onToggle(facet.value, !!checked)}
          />
          <span className="text-sm flex-1">{facet.label}</span>
          <span className="text-xs text-muted-foreground">({facet.count})</span>
        </label>
      ))}
    </div>
  );
}
```

---

## 25.8 SEARCH RESULTS COMPONENT

```typescript
// components/search/search-results.tsx
'use client';

import { useSearch } from '@/hooks/use-search';
import { ListingCard } from '@/components/listing/listing-card';
import { Pagination } from '@/components/ui/pagination';
import { SearchResultsSkeleton } from './search-results-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchX } from 'lucide-react';

export function SearchResults() {
  const { data, isLoading, isFetching, params, setPage } = useSearch();
  
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }
  
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No listings found"
        description={params.q 
          ? `No results for "${params.q}". Try adjusting your filters.`
          : 'Try adjusting your search filters to find listings.'
        }
      />
    );
  }
  
  const { pagination } = data.meta;
  
  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isFetching ? 'Searching...' : (
            <>
              Showing {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of{' '}
              {pagination.totalItems.toLocaleString()} listings
            </>
          )}
        </p>
      </div>
      
      {/* Results grid */}
      <div 
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-label="Search results"
      >
        {data.data.map((hit) => (
          <ListingCard
            key={hit.id}
            listing={hit}
            highlights={hit.highlights}
          />
        ))}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

---

## 25.9 SEARCH PAGE LAYOUT

```typescript
// app/(public)/search/page.tsx
import { Suspense } from 'react';
import { SearchInput } from '@/components/search/search-input';
import { SearchFilters } from '@/components/search/search-filters';
import { SearchResults } from '@/components/search/search-results';
import { SearchSortSelect } from '@/components/search/search-sort-select';
import { SearchResultsSkeleton } from '@/components/search/search-results-skeleton';

export default function SearchPage() {
  return (
    <div className="container py-8">
      {/* Search Header */}
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold">Search Listings</h1>
        <Suspense fallback={<div className="h-10" />}>
          <SearchInputWrapper />
        </Suspense>
      </div>
      
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Suspense fallback={null}>
          <SearchFilters />
        </Suspense>
        <Suspense fallback={null}>
          <SearchSortSelect />
        </Suspense>
      </div>
      
      {/* Results */}
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

function SearchInputWrapper() {
  'use client';
  const { params, setQuery } = useSearch();
  const [value, setValue] = useState(params.q || '');
  
  return (
    <SearchInput
      value={value}
      onChange={setValue}
      onSearch={setQuery}
      className="max-w-2xl"
    />
  );
}
```

---

## 25.10 GEO SEARCH INTEGRATION

```typescript
// components/search/geo-search.tsx
'use client';

import { useState, useCallback } from 'react';
import { MapPin, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSearch } from '@/hooks/use-search';
import { toast } from 'sonner';

export function GeoSearchControls() {
  const { params, setParams } = useSearch();
  const [isLocating, setIsLocating] = useState(false);
  
  const handleUseMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setParams({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: params.radius || 10, // Default 10km
          page: 1,
        });
        setIsLocating(false);
        toast.success('Location updated');
      },
      (error) => {
        setIsLocating(false);
        toast.error('Unable to get your location');
      },
    );
  }, [params.radius, setParams]);
  
  const handleRadiusChange = useCallback((values: number[]) => {
    if (params.lat && params.lng) {
      setParams({ radius: values[0], page: 1 });
    }
  }, [params.lat, params.lng, setParams]);
  
  const handleClearLocation = useCallback(() => {
    setParams({
      lat: undefined,
      lng: undefined,
      radius: undefined,
      page: 1,
    });
  }, [setParams]);
  
  const isLocationActive = params.lat && params.lng;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={isLocationActive ? 'default' : 'outline'}
          size="sm"
          onClick={handleUseMyLocation}
          disabled={isLocating}
        >
          <Locate className="h-4 w-4 mr-2" />
          {isLocating ? 'Locating...' : 'Use my location'}
        </Button>
        
        {isLocationActive && (
          <Button variant="ghost" size="sm" onClick={handleClearLocation}>
            Clear
          </Button>
        )}
      </div>
      
      {isLocationActive && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Search radius: {params.radius || 10}km
          </label>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[params.radius || 10]}
            onValueChange={handleRadiusChange}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 25.11 SEARCH SEO & METADATA

```typescript
// app/(public)/search/page.tsx
import type { Metadata } from 'next';

interface SearchPageProps {
  searchParams: {
    q?: string;
    vertical?: string;
    city?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const parts = ['Search'];
  
  if (searchParams.q) {
    parts.push(`"${searchParams.q}"`);
  }
  if (searchParams.vertical) {
    parts.push(`in ${formatVerticalType(searchParams.vertical)}`);
  }
  if (searchParams.city) {
    parts.push(`in ${searchParams.city}`);
  }
  
  const title = parts.join(' ');
  
  return {
    title,
    description: `Find ${searchParams.vertical || 'listings'} ${searchParams.city ? `in ${searchParams.city}` : ''} on our marketplace.`,
    robots: {
      index: !searchParams.q, // Don't index search result pages
      follow: true,
    },
  };
}
```

---

## 25.12 HIGHLIGHTED TEXT COMPONENT

```typescript
// components/search/highlighted-text.tsx
'use client';

import { useMemo } from 'react';

interface HighlightedTextProps {
  text?: string;
  highlights?: string[];
  fallback: string;
}

export function HighlightedText({ text, highlights, fallback }: HighlightedTextProps) {
  const content = useMemo(() => {
    // Use highlighted version if available
    if (highlights && highlights.length > 0) {
      // Highlights come with <mark> tags from OpenSearch
      return highlights.join('...');
    }
    return text || fallback;
  }, [text, highlights, fallback]);
  
  // Render with dangerouslySetInnerHTML for <mark> tags
  if (highlights && highlights.length > 0) {
    return (
      <span 
        dangerouslySetInnerHTML={{ __html: content }}
        className="[&>mark]:bg-yellow-200 [&>mark]:text-yellow-900"
      />
    );
  }
  
  return <span>{content}</span>;
}
```

---

## 25.13 KEYBOARD NAVIGATION

```typescript
// hooks/use-search-keyboard.ts
import { useCallback, useEffect, useState } from 'react';

export function useSearchKeyboard(
  suggestions: Suggestion[],
  onSelect: (suggestion: Suggestion) => void,
) {
  const [activeIndex, setActiveIndex] = useState(-1);
  
  useEffect(() => {
    // Reset when suggestions change
    setActiveIndex(-1);
  }, [suggestions]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          e.preventDefault();
          onSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setActiveIndex(-1);
        break;
    }
  }, [suggestions, activeIndex, onSelect]);
  
  return { activeIndex, handleKeyDown };
}
```

---

## 25.14 SEARCH ANALYTICS

```typescript
// lib/analytics/search-analytics.ts
import { analytics } from '@/lib/analytics';

export function trackSearch(params: SearchParams, resultCount: number) {
  analytics.track('search_performed', {
    query: params.q,
    vertical_type: params.verticalType,
    has_filters: hasActiveFilters(params),
    result_count: resultCount,
    page: params.page,
  });
}

export function trackSearchClick(
  hit: SearchHit,
  position: number,
  query?: string,
) {
  analytics.track('search_result_clicked', {
    listing_id: hit.id,
    listing_title: hit.title,
    position,
    query,
  });
}

export function trackNoResults(query: string, filters: SearchParams) {
  analytics.track('search_no_results', {
    query,
    vertical_type: filters.verticalType,
    city: filters.city,
    price_min: filters.priceMin,
    price_max: filters.priceMax,
  });
}
```

---

## 25.15 FORBIDDEN PRACTICES

You must not:
- Perform search queries without debouncing
- Display raw OpenSearch query strings to users
- Allow XSS via highlight fields (sanitize HTML)
- Ignore facet counts (show user accurate counts)
- Forget URL synchronization for search params
- Skip loading states during search
- Hardcode vertical-specific filters in core search

---

## 25.16 EXECUTION DIRECTIVE

All search implementations must:
- Debounce text input (300ms)
- Sync all search params to URL
- Show accurate result counts
- Provide keyboard navigation for autocomplete
- Handle empty states gracefully
- Track search analytics
- Support geo-based search where applicable

Search is discovery. Make it delightful.

END OF PART 25.
