// verticals/real-estate/hooks/use-real-estate-filters.ts
// URL-synced filter state for real estate listings

"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { PropertyType, ListingType } from "../types";
import type { PropertyTypeFacetCount } from "../components/PropertyTypeFacet";
import type { PriceRange } from "../components/PriceRangeFilter";
import type { RoomCountValues } from "../components/RoomCountFilter";
import { realEstateSearchMapping } from "../filters";
import {
  serializeFilters,
  deserializeFilters,
  buildApiParams,
  countActiveFilters,
  type FilterValues,
} from "../../filter-builder/querystring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parsed, typed filter state for real estate searches */
export interface RealEstateFilterState {
  /** Selected property types (multi-select) */
  propertyType: PropertyType[];
  /** Listing type (sale / rent) */
  listingType?: ListingType;
  /** Price range */
  price: PriceRange | undefined;
  /** Bedrooms filter */
  bedrooms?: string;
  /** Bathrooms filter */
  bathrooms?: string;
  /** Built-up size range */
  builtUpSize: PriceRange | undefined;
  /** Land size range */
  landSize: PriceRange | undefined;
  /** Furnishing */
  furnishing?: string;
  /** Tenure */
  tenure?: string;
  /** Condition */
  condition?: string;
  /** Facilities */
  facilities: string[];
  /** Text search query */
  q?: string;
  /** Sort */
  sort?: string;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
}

export interface UseRealEstateFiltersReturn {
  /** Current typed filter state */
  filters: RealEstateFilterState;
  /** Raw filter values from URL */
  rawFilters: FilterValues;
  /** Number of active filters */
  activeCount: number;
  /** Update a single filter field */
  setFilter: <K extends keyof RealEstateFilterState>(
    key: K,
    value: RealEstateFilterState[K]
  ) => void;
  /** Update multiple filter fields at once */
  setFilters: (partial: Partial<RealEstateFilterState>) => void;
  /** Update price range specifically */
  setPriceRange: (range: PriceRange | undefined) => void;
  /** Update room counts specifically */
  setRoomCounts: (rooms: RoomCountValues) => void;
  /** Update property type selection */
  setPropertyTypes: (types: PropertyType[]) => void;
  /** Clear all filters (reset to defaults) */
  clearAll: () => void;
  /** Build API-ready query params */
  apiParams: Record<string, string | number | boolean | string[]>;
  /** Sort field and direction */
  sortInfo: { key: string; direction: "asc" | "desc" } | undefined;
  /** Change sort */
  setSort: (key: string, direction?: "asc" | "desc") => void;
  /** Go to a specific page */
  setPage: (page: number) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useRealEstateFilters — URL-synced filter state for real estate.
 *
 * The URL is the single source of truth. All filter changes update the URL,
 * which triggers a re-render with the new state.
 */
export function useRealEstateFilters(): UseRealEstateFiltersReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ---- Deserialise URL → raw filter values ----
  const rawFilters = useMemo(
    () => deserializeFilters(searchParams, realEstateSearchMapping),
    [searchParams]
  );

  // ---- Parse typed filter state ----
  const filters = useMemo<RealEstateFilterState>(() => {
    // Property type (multi-select)
    const propertyTypeRaw = rawFilters.propertyType;
    const propertyType: PropertyType[] = Array.isArray(propertyTypeRaw)
      ? (propertyTypeRaw as PropertyType[])
      : propertyTypeRaw
        ? [propertyTypeRaw as PropertyType]
        : [];

    // Listing type
    const listingType = (rawFilters.listingType as ListingType) ?? undefined;

    // Price
    const price = rawFilters.price as PriceRange | undefined;

    // Room counts
    const bedrooms = rawFilters.bedrooms as string | undefined;
    const bathrooms = rawFilters.bathrooms as string | undefined;

    // Size ranges
    const builtUpSize = rawFilters.builtUpSize as PriceRange | undefined;
    const landSize = rawFilters.landSize as PriceRange | undefined;

    // Enum filters
    const furnishing = rawFilters.furnishing as string | undefined;
    const tenure = rawFilters.tenure as string | undefined;
    const condition = rawFilters.condition as string | undefined;

    // Multi-select
    const facilitiesRaw = rawFilters.facilities;
    const facilities: string[] = Array.isArray(facilitiesRaw)
      ? facilitiesRaw
      : [];

    // Search, sort, pagination
    const q = searchParams.get("q") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const page = Number(searchParams.get("page")) || DEFAULT_PAGE;
    const pageSize =
      Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE;

    return {
      propertyType,
      listingType,
      price,
      bedrooms,
      bathrooms,
      builtUpSize,
      landSize,
      furnishing,
      tenure,
      condition,
      facilities,
      q,
      sort,
      page,
      pageSize,
    };
  }, [rawFilters, searchParams]);

  // ---- Active filter count (excludes search, sort, pagination) ----
  const activeCount = useMemo(() => countActiveFilters(rawFilters), [rawFilters]);

  // ---- Push new params to URL ----
  const pushUrl = useCallback(
    (params: URLSearchParams) => {
      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  /**
   * Build a full URLSearchParams from the typed state merged with extras.
   */
  const buildParams = useCallback(
    (state: RealEstateFilterState): URLSearchParams => {
      // Convert typed state back to raw filter values
      const raw: FilterValues = {};

      if (state.propertyType.length > 0) {
        raw.propertyType = state.propertyType;
      }
      if (state.listingType) raw.listingType = state.listingType;
      if (state.price) raw.price = state.price;
      if (state.bedrooms) raw.bedrooms = state.bedrooms;
      if (state.bathrooms) raw.bathrooms = state.bathrooms;
      if (state.builtUpSize) raw.builtUpSize = state.builtUpSize;
      if (state.landSize) raw.landSize = state.landSize;
      if (state.furnishing) raw.furnishing = state.furnishing;
      if (state.tenure) raw.tenure = state.tenure;
      if (state.condition) raw.condition = state.condition;
      if (state.facilities.length > 0) raw.facilities = state.facilities;

      const params = serializeFilters(raw, realEstateSearchMapping);

      // Add non-filter params
      if (state.q) params.set("q", state.q);
      if (state.sort) params.set("sort", state.sort);
      if (state.page > 1) params.set("page", String(state.page));
      if (state.pageSize !== DEFAULT_PAGE_SIZE) {
        params.set("pageSize", String(state.pageSize));
      }

      return params;
    },
    []
  );

  // ---- Setters ----

  const setFilter = useCallback(
    <K extends keyof RealEstateFilterState>(
      key: K,
      value: RealEstateFilterState[K]
    ) => {
      const next = { ...filters, [key]: value, page: DEFAULT_PAGE };
      pushUrl(buildParams(next));
    },
    [filters, pushUrl, buildParams]
  );

  const setFilters = useCallback(
    (partial: Partial<RealEstateFilterState>) => {
      const next = { ...filters, ...partial, page: DEFAULT_PAGE };
      pushUrl(buildParams(next));
    },
    [filters, pushUrl, buildParams]
  );

  const setPriceRange = useCallback(
    (range: PriceRange | undefined) => {
      setFilter("price", range);
    },
    [setFilter]
  );

  const setRoomCounts = useCallback(
    (rooms: RoomCountValues) => {
      const next = {
        ...filters,
        bedrooms: rooms.bedrooms,
        bathrooms: rooms.bathrooms,
        page: DEFAULT_PAGE,
      };
      pushUrl(buildParams(next));
    },
    [filters, pushUrl, buildParams]
  );

  const setPropertyTypes = useCallback(
    (types: PropertyType[]) => {
      setFilter("propertyType", types);
    },
    [setFilter]
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // ---- Sort helpers ----

  const sortInfo = useMemo(() => {
    if (!filters.sort) return undefined;
    const [key, dir] = filters.sort.split(":");
    return {
      key,
      direction: (dir === "asc" ? "asc" : "desc") as "asc" | "desc",
    };
  }, [filters.sort]);

  const setSort = useCallback(
    (key: string, direction?: "asc" | "desc") => {
      const dir =
        direction ??
        realEstateSearchMapping.sortableFields.find((f) => f.key === key)
          ?.defaultDirection ??
        "desc";
      setFilter("sort", `${key}:${dir}` as RealEstateFilterState["sort"]);
    },
    [setFilter]
  );

  const setPage = useCallback(
    (page: number) => {
      const next = { ...filters, page };
      pushUrl(buildParams(next));
    },
    [filters, pushUrl, buildParams]
  );

  // ---- API params ----

  const apiParams = useMemo(() => {
    const params = buildApiParams(rawFilters, realEstateSearchMapping);

    if (filters.q) params.q = filters.q;
    if (filters.sort) params.sort = filters.sort;
    params.page = filters.page;
    params.pageSize = filters.pageSize;

    return params;
  }, [rawFilters, filters.q, filters.sort, filters.page, filters.pageSize]);

  return {
    filters,
    rawFilters,
    activeCount,
    setFilter,
    setFilters,
    setPriceRange,
    setRoomCounts,
    setPropertyTypes,
    clearAll,
    apiParams,
    sortInfo,
    setSort,
    setPage,
  };
}
