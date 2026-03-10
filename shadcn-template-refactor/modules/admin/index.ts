// =============================================================================
// Admin Module — Barrel Export
// =============================================================================

// Types — Listings
export type {
  AdminListing,
  AdminListingPartner,
  AdminListingVendor,
  AdminListingFilters,
  AdminListingActionVariable,
  AdminListingActionWithReason,
  AdminListingAction,
  BulkAction,
} from "./types";
export {
  DEFAULT_ADMIN_LISTING_FILTERS,
  ADMIN_LISTING_ACTIONS,
  BULK_ACTIONS,
  cleanAdminFilters,
} from "./types";

// Types — PM
export type {
  StatusCountDto,
  TenancyStatsDto,
  BillingStatsDto,
  MaintenanceStatsDto,
  PayoutStatsDto,
  DepositStatsDto,
  InspectionStatsDto,
  ClaimStatsDto,
  LegalStatsDto,
  TenantStatsDto,
  CompanyAgentStatsDto,
  AdminPMStats,
  AdminTenancyFilters,
  AdminBillingFilters,
  AdminPayoutFilters,
  BulkApprovePayoutVariables,
  BulkProcessBillsVariables,
} from "./types/admin-pm";
export {
  DEFAULT_ADMIN_TENANCY_FILTERS,
  DEFAULT_ADMIN_BILLING_FILTERS,
  DEFAULT_ADMIN_PAYOUT_FILTERS,
  cleanAdminPMFilters,
} from "./types/admin-pm";

// Hooks — Listings
export {
  useAdminListings,
  useAdminListingDetail,
  useAdminPublishListing,
  useAdminUnpublishListing,
  useAdminExpireListing,
  useAdminArchiveListing,
  useAdminFeatureListing,
  useAdminUnfeatureListing,
} from "./hooks/admin-listings";

// Hooks — PM
export {
  useAdminPMStats,
  useAdminTenancies,
  useAdminBills,
  useAdminPayouts,
  useBulkApprovePayout,
  useBulkProcessBills,
} from "./hooks/admin-pm";

// Components — Listings
export { AdminListingTable } from "./components/admin-listing-table";
export { AdminListingActions } from "./components/admin-listing-actions";
export { AdminListingFilters as AdminListingFiltersBar } from "./components/admin-listing-filters";
export { AdminBulkToolbar } from "./components/admin-bulk-toolbar";

// Components — PM
export { PMStatsDashboard } from "./components/pm-stats-dashboard";
