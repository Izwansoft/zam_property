// =============================================================================
// Listing module — barrel exports
// =============================================================================

// Types
export type {
  Listing,
  ListingDetail,
  ListingFilters,
  ListingStatus,
  ListingLocation,
  ListingMedia,
  ListingVendor,
} from "./types";
export { DEFAULT_LISTING_FILTERS } from "./types";

// Hooks
export { useListings } from "./hooks/use-listings";
export { useListing } from "./hooks/use-listing";
export {
  useCreateListing,
  useUpdateListing,
  usePublishListing,
  type CreateListingDto,
  type UpdateListingDto,
} from "./hooks/use-listing-mutations";

// Components
export { ListingCard, ListingCardSkeleton } from "./components/listing-card";
export { ListingList } from "./components/listing-list";
export { ListingFiltersBar } from "./components/listing-filters";
export { ListingPagination } from "./components/listing-pagination";
export { ListingGallery, ListingGallerySkeleton } from "./components/listing-gallery";
export { ListingInfo, ListingInfoSkeleton } from "./components/listing-info";
export { ListingAttributeSummary } from "./components/listing-attribute-summary";
export type { AttributeSchemaHint } from "./components/listing-attribute-summary";
export { ListingActions } from "./components/listing-actions";
export { ListingStats, ListingStatsSkeleton } from "./components/listing-stats";
export { ListingDetailView, ListingDetailSkeleton } from "./components/listing-detail";
export {
  ListingForm,
  ListingFormSkeleton,
} from "./components/listing-form";

// Utils
export {
  LISTING_STATUS_CONFIG,
  formatPrice,
  formatPriceCompact,
  formatLocation,
  formatDate,
  formatRelativeDate,
  getVerticalLabel,
  cleanFilters,
} from "./utils";
