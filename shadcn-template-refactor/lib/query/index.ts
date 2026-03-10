// =============================================================================
// TanStack Query — QueryClient configuration & query key factory
// =============================================================================
// Central query infrastructure. All domain modules use queryKeys from here.
// =============================================================================

// Re-export config & optimistic utilities
export { STALE_TIMES, DOMAIN_STALE_TIMES, RETRY_CONFIG, smartQueryRetry } from "./config";
export {
  optimisticDetailUpdate,
  optimisticListItemUpdate,
  optimisticListItemRemove,
  rollbackOptimistic,
  settleOptimistic,
  composeOptimisticDetail,
} from "./optimistic";
export type { OptimisticContext } from "./optimistic";

// ---------------------------------------------------------------------------
// Query Key Factory (partner-scoped)
// ---------------------------------------------------------------------------
// All keys follow the pattern: [scope, scopeId?, resource, action?, params?]
// This ensures proper cache isolation per partner.
// ---------------------------------------------------------------------------

export const queryKeys = {
  // ---- Auth ----
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  // ---- Partners (platform scope) ----
  partners: {
    all: ["platform", "partners"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.partners.all, "list", params] as const,
    detail: (partnerId: string) =>
      [...queryKeys.partners.all, "detail", partnerId] as const,
  },

  // ---- Vendors (partner-scoped) ----
  vendors: {
    all: (partnerId: string) => ["partner", partnerId, "vendors"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.vendors.all(partnerId), "list", params] as const,
    detail: (partnerId: string, vendorId: string) =>
      [...queryKeys.vendors.all(partnerId), "detail", vendorId] as const,
  },

  // ---- Listings (partner-scoped) ----
  listings: {
    all: (partnerId: string) => ["partner", partnerId, "listings"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.listings.all(partnerId), "list", params] as const,
    detail: (partnerId: string, listingId: string) =>
      [...queryKeys.listings.all(partnerId), "detail", listingId] as const,
  },

  // ---- Interactions (partner-scoped) ----
  interactions: {
    all: (partnerId: string) => ["partner", partnerId, "interactions"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.interactions.all(partnerId), "list", params] as const,
    detail: (partnerId: string, interactionId: string) =>
      [
        ...queryKeys.interactions.all(partnerId),
        "detail",
        interactionId,
      ] as const,
  },

  // ---- Reviews (partner-scoped) ----
  reviews: {
    all: (partnerId: string) => ["partner", partnerId, "reviews"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.reviews.all(partnerId), "list", params] as const,
    detail: (partnerId: string, reviewId: string) =>
      [...queryKeys.reviews.all(partnerId), "detail", reviewId] as const,
    stats: (partnerId: string, targetType?: string, targetId?: string) =>
      [...queryKeys.reviews.all(partnerId), "stats", targetType, targetId] as const,
  },

  // ---- Notifications ----
  notifications: {
    all: ["notifications"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, "list", params] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all, "unread-count"] as const,
  },

  // ---- Subscriptions (partner-scoped) ----
  subscriptions: {
    all: (partnerId: string) => ["partner", partnerId, "subscriptions"] as const,
    current: (partnerId: string) =>
      [...queryKeys.subscriptions.all(partnerId), "current"] as const,
    plans: (params?: Record<string, unknown>) => ["plans", params] as const,
    usage: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.subscriptions.all(partnerId), "usage", params] as const,
    entitlements: (partnerId: string) =>
      [...queryKeys.subscriptions.all(partnerId), "entitlements"] as const,
  },

  // ---- Analytics ----
  analytics: {
    platform: (params?: Record<string, unknown>) =>
      ["platform", "analytics", params] as const,
    partner: (partnerId: string, params?: Record<string, unknown>) =>
      ["partner", partnerId, "analytics", params] as const,
    vendor: (
      partnerId: string,
      vendorId: string,
      params?: Record<string, unknown>
    ) => ["vendor", vendorId, "analytics", partnerId, params] as const,
  },

  // ---- Audit Logs ----
  audit: {
    all: ["audit"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.audit.all, "list", params] as const,
    detail: (logId: string) =>
      [...queryKeys.audit.all, "detail", logId] as const,
    byTarget: (
      targetType: string,
      targetId: string,
      params?: Record<string, unknown>
    ) => [...queryKeys.audit.all, "target", targetType, targetId, params] as const,
    byActor: (actorId: string, params?: Record<string, unknown>) =>
      [...queryKeys.audit.all, "actor", actorId, params] as const,
    actionTypes: () => [...queryKeys.audit.all, "action-types"] as const,
    targetTypes: () => [...queryKeys.audit.all, "target-types"] as const,
  },

  // ---- Verticals ----
  verticals: {
    all: ["verticals"] as const,
    list: () => [...queryKeys.verticals.all, "list"] as const,
    schema: (verticalType: string) =>
      [...queryKeys.verticals.all, "schema", verticalType] as const,
  },

  // ---- Search ----
  search: {
    all: ["search"] as const,
    listings: (params?: Record<string, unknown>) =>
      [...queryKeys.search.all, "listings", params] as const,
    suggestions: (query: string) =>
      [...queryKeys.search.all, "suggestions", query] as const,
  },

  // ---- Feature Flags ----
  featureFlags: {
    all: ["feature-flags"] as const,
    list: () => [...queryKeys.featureFlags.all, "list"] as const,
    detail: (key: string) =>
      [...queryKeys.featureFlags.all, "detail", key] as const,
    check: (key: string) =>
      [...queryKeys.featureFlags.all, "check", key] as const,
  },

  // ---- Experiments ----
  experiments: {
    all: ["experiments"] as const,
    list: () => [...queryKeys.experiments.all, "list"] as const,
    detail: (key: string) =>
      [...queryKeys.experiments.all, "detail", key] as const,
  },

  // ---- Media (partner-scoped) ----
  media: {
    all: (partnerId: string) => ["partner", partnerId, "media"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.media.all(partnerId), "list", params] as const,
    detail: (partnerId: string, mediaId: string) =>
      [...queryKeys.media.all(partnerId), "detail", mediaId] as const,
    byEntity: (partnerId: string, entityType: string, entityId: string) =>
      [
        ...queryKeys.media.all(partnerId),
        "entity",
        entityType,
        entityId,
      ] as const,
  },

  // ---- Account (customer) ----
  account: {
    profile: () => ["account", "profile"] as const,
    inquiries: (params?: Record<string, unknown>) =>
      ["account", "inquiries", params] as const,
    saved: (params?: Record<string, unknown>) =>
      ["account", "saved", params] as const,
    bookings: (params?: Record<string, unknown>) =>
      ["account", "bookings", params] as const,
    messages: (params?: Record<string, unknown>) =>
      ["account", "messages", params] as const,
  },

  // ---- Chat ----
  chat: {
    all: ["chat"] as const,
    threads: (params?: Record<string, unknown>) =>
      ["chat", "threads", params] as const,
    thread: (threadId: string) =>
      ["chat", "threads", "detail", threadId] as const,
    messages: (threadId: string, params?: Record<string, unknown>) =>
      ["chat", "messages", threadId, params] as const,
  },

  // ---- Activity Feed ----
  activity: {
    all: ["activity"] as const,
    byTarget: (targetType: string, targetId: string, params?: Record<string, unknown>) =>
      [...queryKeys.activity.all, "target", targetType, targetId, params] as const,
    recent: (portal: string, params?: Record<string, unknown>) =>
      [...queryKeys.activity.all, "recent", portal, params] as const,
  },

  // ---- Pricing ----
  pricing: {
    all: ["pricing"] as const,
    configs: (params?: Record<string, unknown>) =>
      [...queryKeys.pricing.all, "configs", params] as const,
    configDetail: (configId: string) =>
      [...queryKeys.pricing.all, "configs", "detail", configId] as const,
    rules: (params?: Record<string, unknown>) =>
      [...queryKeys.pricing.all, "rules", params] as const,
    chargeEvents: (params?: Record<string, unknown>) =>
      [...queryKeys.pricing.all, "charge-events", params] as const,
    chargeEventDetail: (eventId: string) =>
      [...queryKeys.pricing.all, "charge-events", "detail", eventId] as const,
  },

  // ---- Jobs (admin job queue) ----
  jobs: {
    all: ["jobs"] as const,
    health: () => [...queryKeys.jobs.all, "health"] as const,
    queueStats: (queueName: string) =>
      [...queryKeys.jobs.all, "queue", queueName] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.jobs.all, "list", params] as const,
    detail: (queueName: string, jobId: string) =>
      [...queryKeys.jobs.all, "detail", queueName, jobId] as const,
  },

  // ---- Admin Listings (platform/partner moderation) ----
  adminListings: {
    all: ["admin-listings"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.adminListings.all, "list", params] as const,
    detail: (listingId: string) =>
      [...queryKeys.adminListings.all, "detail", listingId] as const,
  },

  // ---- Admin PM (platform-wide property management) ----
  adminPM: {
    all: ["admin-pm"] as const,
    stats: () => [...queryKeys.adminPM.all, "stats"] as const,
    tenancies: (params?: Record<string, unknown>) =>
      [...queryKeys.adminPM.all, "tenancies", params] as const,
    bills: (params?: Record<string, unknown>) =>
      [...queryKeys.adminPM.all, "bills", params] as const,
    payouts: (params?: Record<string, unknown>) =>
      [...queryKeys.adminPM.all, "payouts", params] as const,
    maintenance: (params?: Record<string, unknown>) =>
      [...queryKeys.adminPM.all, "maintenance", params] as const,
    claims: (params?: Record<string, unknown>) =>
      [...queryKeys.adminPM.all, "claims", params] as const,
    companies: (params?: Record<string, unknown>) =>
      [...queryKeys.adminPM.all, "companies", params] as const,
    transactions: (params?: Record<string, unknown>) =>
      [...queryKeys.adminPM.all, "transactions", params] as const,
  },

  // ---- Admin Users (platform-wide user management) ----
  adminUsers: {
    all: ["admin-users"] as const,
    list: (params?: Record<string, unknown>) =>
      ["admin-users", "list", params] as const,
    detail: (userId: string) =>
      ["admin-users", "detail", userId] as const,
  },

  // ---- Tenancies (tenant-scoped) ----
  tenancies: {
    all: (partnerId: string) => ["partner", partnerId, "tenancies"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.tenancies.all(partnerId), "list", params] as const,
    detail: (partnerId: string, tenancyId: string) =>
      [...queryKeys.tenancies.all(partnerId), "detail", tenancyId] as const,
    owner: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.tenancies.all(partnerId), "owner", params] as const,
    ownerSummary: (partnerId: string) =>
      [...queryKeys.tenancies.all(partnerId), "owner", "summary"] as const,
  },

  // ---- Contracts (partner-scoped) ----
  contracts: {
    all: (partnerId: string) => ["partner", partnerId, "contracts"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.contracts.all(partnerId), "list", params] as const,
    detail: (partnerId: string, contractId: string) =>
      [...queryKeys.contracts.all(partnerId), "detail", contractId] as const,
    byTenancy: (partnerId: string, tenancyId: string) =>
      [...queryKeys.contracts.all(partnerId), "tenancy", tenancyId] as const,
  },

  // ---- Rent Billings (partner-scoped) ----
  rentBillings: {
    all: (partnerId: string) => ["partner", partnerId, "rent-billings"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.rentBillings.all(partnerId), "list", params] as const,
    detail: (partnerId: string, billingId: string) =>
      [...queryKeys.rentBillings.all(partnerId), "detail", billingId] as const,
    summary: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.rentBillings.all(partnerId), "summary", params] as const,
  },

  // ---- Rent Payments (partner-scoped) ----
  rentPayments: {
    all: (partnerId: string) => ["partner", partnerId, "rent-payments"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.rentPayments.all(partnerId), "list", params] as const,
    detail: (partnerId: string, paymentId: string) =>
      [...queryKeys.rentPayments.all(partnerId), "detail", paymentId] as const,
    byBilling: (partnerId: string, billingId: string) =>
      [...queryKeys.rentPayments.all(partnerId), "billing", billingId] as const,
  },

  // ---- Deposits (partner-scoped) ----
  deposits: {
    all: (partnerId: string) => ["partner", partnerId, "deposits"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.deposits.all(partnerId), "list", params] as const,
    detail: (partnerId: string, depositId: string) =>
      [...queryKeys.deposits.all(partnerId), "detail", depositId] as const,
    byTenancy: (partnerId: string, tenancyId: string) =>
      [...queryKeys.deposits.all(partnerId), "tenancy", tenancyId] as const,
    summary: (partnerId: string, tenancyId: string) =>
      [...queryKeys.deposits.all(partnerId), "summary", tenancyId] as const,
    transactions: (partnerId: string, depositId: string) =>
      [...queryKeys.deposits.all(partnerId), "transactions", depositId] as const,
    refundCalculation: (partnerId: string, depositId: string) =>
      [...queryKeys.deposits.all(partnerId), "refund-calculation", depositId] as const,
  },

  // ---- Owner Payouts (partner-scoped) ----
  ownerPayouts: {
    all: (partnerId: string) => ["partner", partnerId, "payouts"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.ownerPayouts.all(partnerId), "list", params] as const,
    detail: (partnerId: string, payoutId: string) =>
      [...queryKeys.ownerPayouts.all(partnerId), "detail", payoutId] as const,
  },

  // ---- Maintenance Tickets (partner-scoped) ----
  maintenance: {
    all: (partnerId: string) => ["partner", partnerId, "maintenance"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.maintenance.all(partnerId), "list", params] as const,
    detail: (partnerId: string, ticketId: string) =>
      [...queryKeys.maintenance.all(partnerId), "detail", ticketId] as const,
  },

  // ---- Inspections (partner-scoped) ----
  inspections: {
    all: (partnerId: string) => ["partner", partnerId, "inspections"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.inspections.all(partnerId), "list", params] as const,
    detail: (partnerId: string, inspectionId: string) =>
      [...queryKeys.inspections.all(partnerId), "detail", inspectionId] as const,
    byTenancy: (partnerId: string, tenancyId: string) =>
      [...queryKeys.inspections.all(partnerId), "tenancy", tenancyId] as const,
    report: (partnerId: string, inspectionId: string) =>
      [...queryKeys.inspections.all(partnerId), "report", inspectionId] as const,
    media: (partnerId: string, inspectionId: string) =>
      [...queryKeys.inspections.all(partnerId), "media", inspectionId] as const,
  },

  // ---- Claims (partner-scoped) ----
  claims: {
    all: (partnerId: string) => ["partner", partnerId, "claims"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.claims.all(partnerId), "list", params] as const,
    detail: (partnerId: string, claimId: string) =>
      [...queryKeys.claims.all(partnerId), "detail", claimId] as const,
  },

  // ---- Companies (partner-scoped) ----
  companies: {
    all: (partnerId: string) => ["partner", partnerId, "companies"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.companies.all(partnerId), "list", params] as const,
    detail: (partnerId: string, companyId: string) =>
      [...queryKeys.companies.all(partnerId), "detail", companyId] as const,
    admins: (partnerId: string, companyId: string) =>
      [...queryKeys.companies.all(partnerId), "admins", companyId] as const,
  },

  // ---- Agents (partner-scoped) ----
  agents: {
    all: (partnerId: string) => ["partner", partnerId, "agents"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.agents.all(partnerId), "list", params] as const,
    detail: (partnerId: string, agentId: string) =>
      [...queryKeys.agents.all(partnerId), "detail", agentId] as const,
    listings: (partnerId: string, agentId: string) =>
      [...queryKeys.agents.all(partnerId), "listings", agentId] as const,
  },

  // ---- Property Members (partner-scoped, per property) ----
  propertyMembers: {
    all: (partnerId: string) => ["partner", partnerId, "property-members"] as const,
    list: (partnerId: string, listingId: string, params?: Record<string, unknown>) =>
      [...queryKeys.propertyMembers.all(partnerId), "list", listingId, params] as const,
    myProperties: (partnerId: string) =>
      [...queryKeys.propertyMembers.all(partnerId), "my-properties"] as const,
    myRole: (partnerId: string, listingId: string) =>
      [...queryKeys.propertyMembers.all(partnerId), "my-role", listingId] as const,
  },

  // ---- Commissions (partner-scoped) ----
  commissions: {
    all: (partnerId: string) => ["partner", partnerId, "commissions"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.commissions.all(partnerId), "list", params] as const,
    detail: (partnerId: string, commissionId: string) =>
      [...queryKeys.commissions.all(partnerId), "detail", commissionId] as const,
    agentCommissions: (partnerId: string, agentId: string, params?: Record<string, unknown>) =>
      [...queryKeys.commissions.all(partnerId), "agent", agentId, params] as const,
    agentSummary: (partnerId: string, agentId: string) =>
      [...queryKeys.commissions.all(partnerId), "summary", agentId] as const,
  },

  // ---- Legal Cases (partner-scoped) ----
  legalCases: {
    all: (partnerId: string) => ["partner", partnerId, "legal-cases"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.legalCases.all(partnerId), "list", params] as const,
    detail: (partnerId: string, caseId: string) =>
      [...queryKeys.legalCases.all(partnerId), "detail", caseId] as const,
    documents: (partnerId: string, caseId: string) =>
      [...queryKeys.legalCases.all(partnerId), "documents", caseId] as const,
  },

  // ---- Panel Lawyers (partner-scoped) ----
  panelLawyers: {
    all: (partnerId: string) => ["partner", partnerId, "panel-lawyers"] as const,
    list: (partnerId: string, params?: Record<string, unknown>) =>
      [...queryKeys.panelLawyers.all(partnerId), "list", params] as const,
    detail: (partnerId: string, lawyerId: string) =>
      [...queryKeys.panelLawyers.all(partnerId), "detail", lawyerId] as const,
  },

  // ---- Affiliates (partner-scoped) ----
  affiliates: {
    all: (partnerId: string) => ["partner", partnerId, "affiliates"] as const,
    profile: (partnerId: string, affiliateId: string) =>
      [...queryKeys.affiliates.all(partnerId), "profile", affiliateId] as const,
    referrals: (partnerId: string, affiliateId: string, params?: Record<string, unknown>) =>
      [...queryKeys.affiliates.all(partnerId), "referrals", affiliateId, params] as const,
    earnings: (partnerId: string, affiliateId: string) =>
      [...queryKeys.affiliates.all(partnerId), "earnings", affiliateId] as const,
    payouts: (partnerId: string, affiliateId: string, params?: Record<string, unknown>) =>
      [...queryKeys.affiliates.all(partnerId), "payouts", affiliateId, params] as const,
  },
} as const;
