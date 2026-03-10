// Vendor module — profile, onboarding, approval workflow
// =============================================================================
// Vendor Module — Barrel Exports
// =============================================================================

// Types
export type {
  Vendor,
  VendorDetail,
  VendorAddress,
  VendorFilters,
  VendorStatus,
  VendorType,
  VendorSortBy,
} from "./types";
export { DEFAULT_VENDOR_FILTERS } from "./types";
export type {
  VendorSettings,
  UpdateVendorSettingsDto,
  VendorLogoResponse,
} from "./types/vendor-settings";

// Hooks
export { useVendors } from "./hooks/use-vendors";
export { useVendor } from "./hooks/use-vendor";
export {
  useApproveVendor,
  useRejectVendor,
  useSuspendVendor,
} from "./hooks/use-vendor-mutations";
export type {
  RejectVendorDto,
  SuspendVendorDto,
} from "./hooks/use-vendor-mutations";
export {
  useVendorOnboarding,
  mapFormToDto,
} from "./hooks/use-vendor-onboarding";
export type { VendorOnboardingDto } from "./hooks/use-vendor-onboarding";
export {
  useVendorSettings,
  useUpdateVendorSettings,
  useUploadVendorLogo,
} from "./hooks/use-vendor-settings";

// Stores
export { useOnboardingStore, DEFAULT_ONBOARDING_DATA } from "./store/onboarding-store";
export type { OnboardingFormData, OnboardingAddress } from "./store/onboarding-store";

// Components
export { VendorCard, VendorCardSkeleton } from "./components/vendor-card";
export { VendorFiltersBar } from "./components/vendor-filters";
export { VendorList } from "./components/vendor-list";
export { VendorPagination } from "./components/vendor-pagination";
export {
  VendorDetailView,
  VendorDetailSkeleton,
} from "./components/vendor-detail";
export { VendorApprovalActions } from "./components/vendor-approval-actions";
export {
  OnboardingForm,
  OnboardingFormSkeleton,
} from "./components/onboarding-form";
export {
  VendorSettingsForm,
  VendorSettingsFormSkeleton,
} from "./components/vendor-settings-form";

// Utils
export {
  VENDOR_STATUS_CONFIG,
  VENDOR_TYPE_CONFIG,
  getVendorTypeLabel,
  formatVendorAddress,
  formatVendorLocation,
  formatRating,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  cleanVendorFilters,
} from "./utils";
