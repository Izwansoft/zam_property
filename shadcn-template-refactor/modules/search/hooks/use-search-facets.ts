// =============================================================================
// useSearchFacets — Facet formatting and memoization
// =============================================================================
// Transforms raw facet buckets from search response into display-ready options.
// =============================================================================

"use client";

import { useMemo } from "react";

import type { SearchFacets, FacetOption } from "../types";
import { formatFacets, formatPriceRanges } from "../utils";

export interface FormattedFacets {
  verticalTypes: FacetOption[];
  cities: FacetOption[];
  priceRanges: FacetOption[];
  propertyTypes: FacetOption[];
  bedrooms: FacetOption[];
  furnishing: FacetOption[];
}

const EMPTY_FACETS: FormattedFacets = {
  verticalTypes: [],
  cities: [],
  priceRanges: [],
  propertyTypes: [],
  bedrooms: [],
  furnishing: [],
};

export function useSearchFacets(facets?: SearchFacets): FormattedFacets {
  return useMemo(() => {
    if (!facets) return EMPTY_FACETS;

    return {
      verticalTypes: formatFacets(facets.verticalTypes),
      cities: formatFacets(facets.cities, 10),
      priceRanges: formatPriceRanges(facets.priceRanges),
      propertyTypes: formatFacets(facets.propertyTypes),
      bedrooms: formatFacets(facets.bedrooms),
      furnishing: formatFacets(facets.furnishing),
    };
  }, [facets]);
}
