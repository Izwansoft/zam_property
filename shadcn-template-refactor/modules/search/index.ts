// =============================================================================
// Search Module — Barrel Exports
// =============================================================================

// Types
export type {
  SearchParams,
  SearchResponse,
  SearchHit,
  SearchFacets,
  FacetBucket,
  RangeBucket,
  FacetOption,
  Suggestion,
  AttributeFilter,
  SearchSort,
} from "./types";
export { DEFAULT_SEARCH_PARAMS, SEARCH_SORT_OPTIONS } from "./types";

// Hooks
export { useSearch } from "./hooks/use-search";
export { useAutocomplete } from "./hooks/use-autocomplete";
export { useSearchFacets } from "./hooks/use-search-facets";
export type { FormattedFacets } from "./hooks/use-search-facets";
export { useSearchKeyboard } from "./hooks/use-search-keyboard";

// Components
export { SearchInput } from "./components/search-input";
export { SearchResultCard, SearchResultCardSkeleton } from "./components/search-result-card";
export { SearchResults } from "./components/search-results";
export { SearchResultsSkeleton } from "./components/search-results-skeleton";
export { SearchFilters, SearchFiltersSidebar } from "./components/search-filters";
export { SearchSortSelect } from "./components/search-sort-select";
export { SuggestionsList } from "./components/suggestions-list";
export { HighlightedText } from "./components/highlighted-text";
export { GeoSearchControls } from "./components/geo-search-controls";
export { SaveSearchButton } from "./components/save-search-button";
export { SavedSearchesList } from "./components/saved-searches-list";
export { CompareButton } from "./components/compare-button";
export { ComparisonBar } from "./components/comparison-bar";

// Store
export { useSavedSearchStore } from "./store/saved-search-store";
export type { SavedSearch } from "./store/saved-search-store";
export { useComparisonStore, MAX_COMPARISON_ITEMS } from "./store/comparison-store";
export type { ComparisonItem } from "./store/comparison-store";

// Utils
export {
  serializeSearchParams,
  parseUrlSearchParams,
  buildSearchQueryString,
  formatCurrency,
  formatFacetLabel,
  formatFacets,
  formatPriceRanges,
  countActiveFilters,
} from "./utils";
