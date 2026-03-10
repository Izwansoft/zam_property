// =============================================================================
// Account Module — Customer profile, dashboard, inquiries, saved listings
// =============================================================================

// Types
export type {
  CustomerProfile,
  UpdateProfileDto,
  AccountDashboardStats,
  QuickAction,
  AccountActivity,
  AccountActivityType,
  SavedListing,
  CustomerInquiry,
  InquiryStatus,
  CustomerReview,
  NotificationChannel,
  NotificationType,
  NotificationPreference,
  NotificationPreferencesData,
  UpdateNotificationPreferencesDto,
  AccountSettings,
  UpdateAccountSettingsDto,
  Language,
  Timezone,
  ChangePasswordDto,
  DeleteAccountDto,
  VendorApplicationStatus,
  VendorVerticalItem,
  InquiryFilters,
  SavedListingFilters,
  CustomerReviewFilters,
} from "./types";

export {
  DEFAULT_INQUIRY_FILTERS,
  DEFAULT_SAVED_FILTERS,
  DEFAULT_CUSTOMER_REVIEW_FILTERS,
} from "./types";

// Hooks
export { useProfile, useUpdateProfile } from "./hooks/use-profile";
export {
  useDashboardStats,
  useRecentActivity,
} from "./hooks/use-dashboard-stats";
export { useInquiries } from "./hooks/use-inquiries";
export {
  useSavedListings,
  useUnsaveListing,
  useSaveListing,
} from "./hooks/use-saved-listings";
export { useCustomerReviews } from "./hooks/use-customer-reviews";
export {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "./hooks/use-notification-preferences";
export {
  useAccountSettings,
  useUpdateAccountSettings,
} from "./hooks/use-account-settings";
export {
  useChangePassword,
  useDeleteAccount,
} from "./hooks/use-security";
export { useVendorHub } from "./hooks/use-vendor-hub";
export { useVendorApplications } from "./hooks/use-vendor-applications";

// Components
export {
  ProfileViewCard,
  ProfileViewCardSkeleton,
  type ProfileViewCardProps,
} from "./components/profile-view-card";
export {
  ProfileEditForm,
  type ProfileEditFormProps,
} from "./components/profile-edit-form";
export {
  AccountDashboard,
  AccountDashboardSkeleton,
} from "./components/account-dashboard";
export {
  InquiryList,
  InquiryCardSkeleton,
  type InquiryListProps,
} from "./components/inquiry-list";
export {
  SavedListingsList,
  SavedListingCardSkeleton,
  type SavedListingsListProps,
} from "./components/saved-listings-list";
export {
  CustomerReviewList,
  CustomerReviewCardSkeleton,
  type CustomerReviewListProps,
} from "./components/customer-review-list";
export {
  NotificationPreferencesGrid,
  NotificationPreferencesGridSkeleton,
  type NotificationPreferencesGridProps,
} from "./components/notification-preferences-grid";
export {
  AccountSettingsForm,
  AccountSettingsFormSkeleton,
  type AccountSettingsFormProps,
} from "./components/account-settings-form";
export {
  SecurityForm,
  SecurityFormSkeleton,
} from "./components/security-form";
export { VendorHubCard } from "./components/vendor-hub-card";
