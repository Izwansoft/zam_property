// =============================================================================
// Account Types — Customer profile, dashboard, inquiries, saved listings
// =============================================================================
// Types for the Customer Account portal.
// =============================================================================

// ---------------------------------------------------------------------------
// Customer Profile (GET /users/me or /account/profile)
// ---------------------------------------------------------------------------

export interface CustomerProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Update Profile DTO (PATCH /account/profile)
// ---------------------------------------------------------------------------

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Account Dashboard Stats (GET /account/dashboard)
// ---------------------------------------------------------------------------

export interface AccountDashboardStats {
  savedListings: number;
  totalInquiries: number;
  activeInquiries: number;
  reviewsWritten: number;
  recentViews: number;
  unreadNotifications: number;
  upcomingViewings: number;
}

// ---------------------------------------------------------------------------
// Quick Action
// ---------------------------------------------------------------------------

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Recent Activity Item
// ---------------------------------------------------------------------------

export type AccountActivityType =
  | "INQUIRY_SENT"
  | "INQUIRY_REPLIED"
  | "LISTING_SAVED"
  | "LISTING_UNSAVED"
  | "REVIEW_POSTED"
  | "PROFILE_UPDATED";

export interface AccountActivity {
  id: string;
  type: AccountActivityType;
  title: string;
  description: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Saved Listing (summary for account view)
// ---------------------------------------------------------------------------

export interface SavedListing {
  id: string;
  listingId: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  primaryImage?: string | null;
  status: string;
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Customer Inquiry (summary for account view)
// ---------------------------------------------------------------------------

export type InquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "CONFIRMED"
  | "CLOSED"
  | "INVALID";

export interface CustomerInquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  vendorName: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string | null;
}

// ---------------------------------------------------------------------------
// Customer Review (summary for account view)
// ---------------------------------------------------------------------------

export interface CustomerReview {
  id: string;
  vendorId: string;
  vendorName: string;
  listingId: string;
  listingTitle: string;
  rating: number;
  title?: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  vendorReply?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

export type NotificationChannel = "EMAIL" | "IN_APP" | "SMS" | "PUSH" | "WHATSAPP";

export type NotificationType =
  | "LISTING_PUBLISHED"
  | "LISTING_EXPIRED"
  | "INTERACTION_NEW"
  | "INTERACTION_MESSAGE"
  | "REVIEW_SUBMITTED"
  | "REVIEW_APPROVED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_EXPIRING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "VENDOR_APPROVED"
  | "VENDOR_SUSPENDED"
  | "SYSTEM_ALERT";

export interface NotificationPreference {
  type: NotificationType;
  label: string;
  description: string;
  channels: Record<NotificationChannel, boolean>;
}

export interface NotificationPreferencesData {
  preferences: NotificationPreference[];
}

export interface UpdateNotificationPreferencesDto {
  preferences: Array<{
    type: NotificationType;
    channels: Record<NotificationChannel, boolean>;
  }>;
}

// ---------------------------------------------------------------------------
// Account Settings
// ---------------------------------------------------------------------------

export type Language = "en" | "ms" | "zh";
export type Timezone = "Asia/Kuala_Lumpur" | "Asia/Singapore" | "UTC";

export interface AccountSettings {
  language: Language;
  timezone: Timezone;
  privacy: {
    showProfile: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

export interface UpdateAccountSettingsDto {
  language?: Language;
  timezone?: Timezone;
  privacy?: {
    showProfile?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
  };
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteAccountDto {
  password: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Vendor Hub
// ---------------------------------------------------------------------------

export type VendorApplicationStatus =
  | "NOT_STARTED"
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface VendorVerticalItem {
  verticalKey: string;
  verticalLabel: string;
  status: VendorApplicationStatus;
  applicationId?: string;
  lastUpdatedAt?: string;
  rejectionReason?: string;
  portalAccess?: boolean;
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface InquiryFilters {
  page?: number;
  pageSize?: number;
  status?: InquiryStatus | "";
  search?: string;
}

export const DEFAULT_INQUIRY_FILTERS: InquiryFilters = {
  page: 1,
  pageSize: 20,
  status: "",
  search: "",
};

export interface SavedListingFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const DEFAULT_SAVED_FILTERS: SavedListingFilters = {
  page: 1,
  pageSize: 20,
  search: "",
};

export interface CustomerReviewFilters {
  page?: number;
  pageSize?: number;
  rating?: number | "";
  search?: string;
}

export const DEFAULT_CUSTOMER_REVIEW_FILTERS: CustomerReviewFilters = {
  page: 1,
  pageSize: 20,
  rating: "",
  search: "",
};
