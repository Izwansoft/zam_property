// =============================================================================
// API Path Constants — Centralized registry of all backend API paths
// =============================================================================
// Prevents frontend/backend path mismatches by defining all API paths in one
// place. Path builder functions accept required IDs and return the full path.
//
// Usage:
//   import { API_PATHS } from "@/lib/api/paths";
//   const path = API_PATHS.listings.list;           // "/listings"
//   const path = API_PATHS.listings.detail("abc");  // "/listings/abc"
//   const path = API_PATHS.vendors.approve("abc");  // "/vendors/abc/actions/approve"
// =============================================================================

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const AUTH_PATHS = {
  login: "/auth/login",
  register: "/auth/register",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  verifyEmail: "/auth/verify-email",
} as const;

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const USER_PATHS = {
  me: "/users/me",
  list: "/users",
  detail: (id: string) => `/users/${id}`,
} as const;

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export const LISTING_PATHS = {
  list: "/listings",
  detail: (id: string) => `/listings/${id}`,
  create: "/listings",
  update: (id: string) => `/listings/${id}`,
  delete: (id: string) => `/listings/${id}`,
  publish: (id: string) => `/listings/${id}/publish`,
  unpublish: (id: string) => `/listings/${id}/unpublish`,
  archive: (id: string) => `/listings/${id}/archive`,
} as const;

// ---------------------------------------------------------------------------
// Admin Listings
// ---------------------------------------------------------------------------

export const ADMIN_LISTING_PATHS = {
  list: "/admin/listings",
  detail: (id: string) => `/admin/listings/${id}`,
  publish: (id: string) => `/admin/listings/${id}/publish`,
  unpublish: (id: string) => `/admin/listings/${id}/unpublish`,
  feature: (id: string) => `/admin/listings/${id}/feature`,
  unfeature: (id: string) => `/admin/listings/${id}/unfeature`,
  bulkPublish: "/admin/listings/bulk-publish",
  bulkUnpublish: "/admin/listings/bulk-unpublish",
} as const;

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

export const VENDOR_PATHS = {
  list: "/vendors",
  detail: (id: string) => `/vendors/${id}`,
  onboarding: "/vendors",
  settings: (id: string) => `/vendors/${id}/settings`,
  logo: (id: string) => `/vendors/${id}/logo`,
  approve: (id: string) => `/vendors/${id}/actions/approve`,
  reject: (id: string) => `/vendors/${id}/actions/reject`,
  suspend: (id: string) => `/vendors/${id}/actions/suspend`,
} as const;

// ---------------------------------------------------------------------------
// Partners (Platform Admin)
// ---------------------------------------------------------------------------

export const PARTNER_PATHS = {
  list: "/admin/partners",
  detail: (id: string) => `/admin/partners/${id}`,
  create: "/admin/partners",
  update: (id: string) => `/admin/partners/${id}`,
  suspend: (id: string) => `/admin/partners/${id}/suspend`,
  reactivate: (id: string) => `/admin/partners/${id}/reactivate`,
  deactivate: (id: string) => `/admin/partners/${id}/deactivate`,
} as const;

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export const INTERACTION_PATHS = {
  list: "/interactions",
  detail: (id: string) => `/interactions/${id}`,
  create: "/interactions",
  respond: (id: string) => `/interactions/${id}/respond`,
  accept: (id: string) => `/interactions/${id}/accept`,
  reject: (id: string) => `/interactions/${id}/reject`,
  close: (id: string) => `/interactions/${id}/close`,
  escalate: (id: string) => `/interactions/${id}/escalate`,
} as const;

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const REVIEW_PATHS = {
  list: "/reviews",
  detail: (id: string) => `/reviews/${id}`,
  moderate: (id: string) => `/reviews/${id}/moderate`,
  response: (id: string) => `/reviews/${id}/response`,
  targetRating: (targetType: string, targetId: string) =>
    `/reviews/target/${targetType}/${targetId}/rating`,
} as const;

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const MEDIA_PATHS = {
  requestUpload: "/media/request-upload",
  confirmUpload: (id: string) => `/media/${id}/confirm-upload`,
  detail: (id: string) => `/media/${id}`,
  delete: (id: string) => `/media/${id}`,
  byEntity: (entityType: string, entityId: string) =>
    `/media/entity/${entityType}/${entityId}`,
} as const;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const NOTIFICATION_PATHS = {
  list: "/notifications",
  preferences: "/notifications/preferences",
  markRead: (id: string) => `/notifications/${id}/read`,
  markAllRead: "/notifications/read-all",
  unreadCount: "/notifications/unread-count",
} as const;

// ---------------------------------------------------------------------------
// Subscriptions & Plans
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_PATHS = {
  current: "/subscriptions/current",
  plans: "/plans",
  planDetail: (id: string) => `/plans/${id}`,
  usage: "/usage",
  entitlements: "/entitlements",
} as const;

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const ANALYTICS_PATHS = {
  dashboard: "/analytics/dashboard",
  platform: "/analytics/platform",
  partner: "/analytics/partner",
  vendor: "/analytics/vendor",
} as const;

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const AUDIT_PATHS = {
  list: "/audit/logs",
  detail: (id: string) => `/audit/logs/${id}`,
  byTarget: (type: string, id: string) => `/audit/target/${type}/${id}`,
  byActor: (actorId: string) => `/audit/actor/${actorId}`,
  actionTypes: "/audit/action-types",
  targetTypes: "/audit/target-types",
} as const;

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const SEARCH_PATHS = {
  listings: "/search/listings",
  suggestions: "/search/suggestions",
  publicListings: "/public/search/listings",
} as const;

// ---------------------------------------------------------------------------
// Feature Flags & Experiments
// ---------------------------------------------------------------------------

export const FEATURE_FLAG_PATHS = {
  list: "/admin/feature-flags",
  detail: (key: string) => `/admin/feature-flags/${key}`,
  create: "/admin/feature-flags",
  update: (key: string) => `/admin/feature-flags/${key}`,
  addOverride: (key: string) => `/admin/feature-flags/${key}/overrides`,
  addUserTarget: (key: string) => `/admin/feature-flags/${key}/user-targets`,
  check: "/feature-flags/check",
} as const;

export const EXPERIMENT_PATHS = {
  list: "/admin/experiments",
  detail: (key: string) => `/admin/experiments/${key}`,
  create: "/admin/experiments",
  optIn: (key: string) => `/admin/experiments/${key}/opt-in`,
} as const;

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

export const ACTIVITY_PATHS = {
  feed: "/activity",
  byTarget: (type: string, id: string) => `/activity/${type}/${id}`,
  recent: "/activity/recent",
} as const;

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export const PRICING_PATHS = {
  configs: "/pricing/configs",
  configDetail: (id: string) => `/pricing/configs/${id}`,
  rules: "/pricing/rules",
  ruleDetail: (id: string) => `/pricing/rules/${id}`,
  charges: "/pricing/charges",
  chargeDetail: (id: string) => `/pricing/charges/${id}`,
  calculate: "/pricing/calculate",
} as const;

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export const JOB_PATHS = {
  health: "/admin/jobs/health",
  queueStats: (name: string) => `/admin/jobs/queues/${name}/stats`,
  list: "/admin/jobs",
  detail: (queue: string, id: string) => `/admin/jobs/queues/${queue}/${id}`,
  retry: (queue: string, id: string) =>
    `/admin/jobs/queues/${queue}/${id}/retry`,
  retryAllFailed: (queue: string) =>
    `/admin/jobs/queues/${queue}/retry-all-failed`,
  pauseQueue: (queue: string) => `/admin/jobs/queues/${queue}/pause`,
  resumeQueue: (queue: string) => `/admin/jobs/queues/${queue}/resume`,
  cleanQueue: (queue: string) => `/admin/jobs/queues/${queue}/clean`,
  addJob: (queue: string) => `/admin/jobs/queues/${queue}/add`,
  triggerExpire: "/admin/jobs/trigger/expire-listings",
  triggerReindex: "/admin/jobs/trigger/search-reindex",
} as const;

// ---------------------------------------------------------------------------
// Tenancies (PM)
// ---------------------------------------------------------------------------

export const TENANCY_PATHS = {
  list: "/tenancies",
  detail: (id: string) => `/tenancies/${id}`,
  create: "/tenancies",
  confirmBooking: (id: string) => `/tenancies/${id}/confirm-booking`,
  confirmDeposit: (id: string) => `/tenancies/${id}/confirm-deposit`,
  cancel: (id: string) => `/tenancies/${id}/cancel`,
  activate: (id: string) => `/tenancies/${id}/activate`,
  requestTermination: (id: string) => `/tenancies/${id}/request-termination`,
  terminate: (id: string) => `/tenancies/${id}/terminate`,
  submitContract: (id: string) => `/tenancies/${id}/submit-contract`,
} as const;

// ---------------------------------------------------------------------------
// Contracts (PM)
// ---------------------------------------------------------------------------

export const CONTRACT_PATHS = {
  list: "/contracts",
  detail: (id: string) => `/contracts/${id}`,
  byTenancy: (tenancyId: string) => `/contracts/tenancy/${tenancyId}`,
  download: (id: string) => `/contracts/${id}/download`,
  recordSignature: (id: string) => `/contracts/${id}/record-signature`,
  resendSignature: (id: string) => `/contracts/${id}/resend-signature`,
  voidSignatures: (id: string) => `/contracts/${id}/void-signatures`,
} as const;

// ---------------------------------------------------------------------------
// Deposits (PM)
// ---------------------------------------------------------------------------

export const DEPOSIT_PATHS = {
  list: "/deposits",
  detail: (id: string) => `/deposits/${id}`,
  byTenancy: (tenancyId: string) => `/deposits/tenancy/${tenancyId}`,
  summary: "/deposits/summary",
  transactions: (id: string) => `/deposits/${id}/transactions`,
  refundCalculation: (id: string) => `/deposits/${id}/refund-calculation`,
} as const;

// ---------------------------------------------------------------------------
// Rent Billings (PM)
// ---------------------------------------------------------------------------

export const BILLING_PATHS = {
  list: "/rent-billings",
  detail: (id: string) => `/rent-billings/${id}`,
  automationStatus: "/rent-billings/automation/status",
  generate: "/rent-billings/generate",
} as const;

// ---------------------------------------------------------------------------
// Rent Payments (PM)
// ---------------------------------------------------------------------------

export const PAYMENT_PATHS = {
  list: "/rent-payments",
  detail: (id: string) => `/rent-payments/${id}`,
  intent: "/rent-payments/intent",
  byBilling: (billingId: string) => `/rent-payments/billing/${billingId}`,
  receipt: (id: string) => `/rent-payments/${id}/receipt`,
} as const;

// ---------------------------------------------------------------------------
// Payouts (PM)
// ---------------------------------------------------------------------------

export const PAYOUT_PATHS = {
  list: "/payouts",
  detail: (id: string) => `/payouts/${id}`,
  calculate: "/payouts/calculate",
  processBatch: "/payouts/process-batch",
  approve: (id: string) => `/payouts/${id}/approve`,
  bankFile: "/payouts/bank-file",
  statement: (id: string) => `/payouts/${id}/statement`,
} as const;

// ---------------------------------------------------------------------------
// Maintenance (PM)
// ---------------------------------------------------------------------------

export const MAINTENANCE_PATHS = {
  list: "/maintenance",
  detail: (id: string) => `/maintenance/${id}`,
  create: "/maintenance",
  update: (id: string) => `/maintenance/${id}`,
  assign: (id: string) => `/maintenance/${id}/assign`,
  resolve: (id: string) => `/maintenance/${id}/resolve`,
  close: (id: string) => `/maintenance/${id}/close`,
  verify: (id: string) => `/maintenance/${id}/verify`,
  comment: (id: string) => `/maintenance/${id}/comments`,
} as const;

// ---------------------------------------------------------------------------
// Inspections (PM)
// ---------------------------------------------------------------------------

export const INSPECTION_PATHS = {
  list: "/inspections",
  detail: (id: string) => `/inspections/${id}`,
  create: "/inspections",
  schedule: (id: string) => `/inspections/${id}/schedule`,
  complete: (id: string) => `/inspections/${id}/complete`,
  report: (id: string) => `/inspections/${id}/report`,
  uploadVideo: (id: string) => `/inspections/${id}/upload-video`,
  media: (id: string) => `/inspections/${id}/media`,
} as const;

// ---------------------------------------------------------------------------
// Claims (PM)
// ---------------------------------------------------------------------------

export const CLAIM_PATHS = {
  list: "/claims",
  detail: (id: string) => `/claims/${id}`,
  create: "/claims",
  approve: (id: string) => `/claims/${id}/approve`,
  reject: (id: string) => `/claims/${id}/reject`,
  evidence: (id: string) => `/claims/${id}/evidence`,
} as const;

// ---------------------------------------------------------------------------
// Tenants (PM)
// ---------------------------------------------------------------------------

export const TENANT_PATHS = {
  list: "/tenants",
  create: "/tenants",
  detail: (id: string) => `/tenants/${id}`,
  documents: (id: string) => `/tenants/${id}/documents`,
} as const;

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export const COMPANY_PATHS = {
  list: "/companies",
  detail: (id: string) => `/companies/${id}`,
  create: "/companies",
  update: (id: string) => `/companies/${id}`,
  admins: (id: string) => `/companies/${id}/admins`,
} as const;

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export const AGENT_PATHS = {
  list: "/agents",
  detail: (id: string) => `/agents/${id}`,
  create: "/agents",
  update: (id: string) => `/agents/${id}`,
  listings: (id: string) => `/agents/${id}/listings`,
  assignListing: (id: string) => `/agents/${id}/assign-listing`,
} as const;

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------

export const COMMISSION_PATHS = {
  list: "/commissions",
  detail: (id: string) => `/commissions/${id}`,
  agentCommissions: (agentId: string) => `/commissions/agent/${agentId}`,
  agentSummary: (agentId: string) => `/commissions/agent/${agentId}/summary`,
} as const;

// ---------------------------------------------------------------------------
// Affiliates
// ---------------------------------------------------------------------------

export const AFFILIATE_PATHS = {
  profile: "/affiliates/profile",
  referrals: "/affiliates/referrals",
  earnings: "/affiliates/earnings",
  payouts: "/affiliates/payouts",
  requestPayout: "/affiliates/payouts/request",
} as const;

// ---------------------------------------------------------------------------
// Legal
// ---------------------------------------------------------------------------

export const LEGAL_PATHS = {
  cases: "/legal/cases",
  caseDetail: (id: string) => `/legal/cases/${id}`,
  documents: (id: string) => `/legal/cases/${id}/documents`,
  panelLawyers: "/legal/panel-lawyers",
  panelLawyerDetail: (id: string) => `/legal/panel-lawyers/${id}`,
} as const;

// ---------------------------------------------------------------------------
// Verticals
// ---------------------------------------------------------------------------

export const VERTICAL_PATHS = {
  list: "/verticals",
  schema: (type: string) => `/verticals/${type}/schema`,
} as const;

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export const PUBLIC_PATHS = {
  listing: (idOrSlug: string) => `/public/listings/${idOrSlug}`,
  vendor: (idOrSlug: string) => `/public/vendors/${idOrSlug}`,
  search: "/public/search/listings",
} as const;

// ---------------------------------------------------------------------------
// Aggregate Export
// ---------------------------------------------------------------------------

export const API_PATHS = {
  auth: AUTH_PATHS,
  users: USER_PATHS,
  listings: LISTING_PATHS,
  adminListings: ADMIN_LISTING_PATHS,
  vendors: VENDOR_PATHS,
  partners: PARTNER_PATHS,
  interactions: INTERACTION_PATHS,
  reviews: REVIEW_PATHS,
  media: MEDIA_PATHS,
  notifications: NOTIFICATION_PATHS,
  subscriptions: SUBSCRIPTION_PATHS,
  analytics: ANALYTICS_PATHS,
  audit: AUDIT_PATHS,
  search: SEARCH_PATHS,
  featureFlags: FEATURE_FLAG_PATHS,
  experiments: EXPERIMENT_PATHS,
  activity: ACTIVITY_PATHS,
  pricing: PRICING_PATHS,
  jobs: JOB_PATHS,
  tenancies: TENANCY_PATHS,
  contracts: CONTRACT_PATHS,
  deposits: DEPOSIT_PATHS,
  billing: BILLING_PATHS,
  payments: PAYMENT_PATHS,
  payouts: PAYOUT_PATHS,
  maintenance: MAINTENANCE_PATHS,
  inspections: INSPECTION_PATHS,
  claims: CLAIM_PATHS,
  tenants: TENANT_PATHS,
  companies: COMPANY_PATHS,
  agents: AGENT_PATHS,
  commissions: COMMISSION_PATHS,
  affiliates: AFFILIATE_PATHS,
  legal: LEGAL_PATHS,
  verticals: VERTICAL_PATHS,
  public: PUBLIC_PATHS,
} as const;
