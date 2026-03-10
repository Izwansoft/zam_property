// =============================================================================
// Partner Module — Barrel Exports
// =============================================================================

// Types — Context (Session 1.9)
export type {
  Partner,
  PartnerMembership,
  PartnerResolutionStatus,
  PartnerContextState,
  PartnerSwitcherState,
} from "./types";
export { PartnerStatus } from "./types";

// Types — Management (Session 2.6)
export type {
  PartnerDetail,
  PartnerSubscription,
  PartnerUsage,
  PartnerFilters,
  PartnerSortBy,
  PartnerPlan,
  PartnerSettingsDto,
} from "./types";
export { DEFAULT_PARTNER_FILTERS } from "./types";

// Context
export {
  PartnerProvider,
  PartnerContext,
  type PartnerContextValue,
  type PartnerProviderProps,
} from "./context/partner-context";

// Hooks — Context (Session 1.9)
export {
  usePartner,
  usePartnerId,
  usePartnerRequired,
  usePartnerSwitcher,
  usePartnerInfo,
  usePartnerStatus,
  type PartnerSwitcherHelpers,
  type PartnerStatusHelpers,
} from "./hooks/use-partner";

// Hooks — Management (Session 2.6)
export { usePartners } from "./hooks/use-partners";
export { usePartnerDetail } from "./hooks/use-partner-detail";
export {
  useSuspendPartner,
  useReactivatePartner,
  useDeactivatePartner,
  useUpdatePartnerSettings,
} from "./hooks/use-partner-mutations";
export type {
  SuspendPartnerDto,
  DeactivatePartnerDto,
} from "./hooks/use-partner-mutations";

// Hooks — Dynamic Branding
export {
  useDynamicBrand,
  useBrandIcon,
  type DynamicBrand,
} from "./hooks/use-dynamic-brand";

// Components (Session 2.6)
export { PartnerCard, PartnerCardSkeleton } from "./components/partner-card";
export { PartnerFiltersBar } from "./components/partner-filters";
export { PartnerList } from "./components/partner-list";
export { PartnerPagination } from "./components/partner-pagination";
export {
  PartnerDetailView,
  PartnerDetailHeader,
  PartnerDetailSkeleton,
} from "./components/partner-detail";
export { PartnerStatusActions } from "./components/partner-status-actions";
export {
  PartnerSettingsForm,
  PartnerSettingsFormSkeleton,
} from "./components/partner-settings-form";

// Utils (Session 2.6)
export {
  PARTNER_STATUS_CONFIG,
  PARTNER_PLAN_CONFIG,
  getPartnerPlanLabel,
  formatDate as formatPartnerDate,
  formatDateTime as formatPartnerDateTime,
  formatRelativeDate as formatPartnerRelativeDate,
  formatUsage,
  getUsagePercentage,
  formatStorage,
  cleanPartnerFilters,
} from "./utils";
