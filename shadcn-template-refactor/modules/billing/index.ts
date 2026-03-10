// =============================================================================
// Billing Module — Public API
// =============================================================================

// Types
export type {
  Billing,
  BillingLineItem,
  BillingTenancyRef,
  BillingReminder,
  BillingFilters,
  BillingFilterTab,
  BillingStatusConfig,
  BillingStatusVariant,
  BillingPayment,
  PaymentStatusConfig,
  PaymentStatusVariant,
  BillingSummary,
  OwnerBillingStats,
  OwnerBillingFilters,
  PropertyBillingGroup,
} from "./types";
export {
  BillingStatus,
  BillingLineItemType,
  BillingReminderType,
  PaymentStatus,
  PaymentMethod,
  BILLING_STATUS_CONFIG,
  BILLING_FILTER_TABS,
  OWNER_BILLING_FILTER_TABS,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
  getStatusesForBillingFilter,
} from "./types";

// Hooks
export { useBillings, useBilling } from "./hooks";
export { usePaymentsByBilling } from "./hooks";
export { useOwnerBillings, useOwnerBillingSummary } from "./hooks";

// Components
export { BillCard, BillCardSkeleton } from "./components";
export { BillList } from "./components";
export { BillingStatusBadge } from "./components";
export { BillDetail, BillDetailSkeleton } from "./components";
export {
  BillingLineItemTable,
  BillingLineItemTableSkeleton,
} from "./components";
export { PaymentHistory, PaymentHistorySkeleton } from "./components";
export { BillingStatsCards, BillingStatsCardsSkeleton } from "./components";
export { OwnerBillList, OwnerBillListSkeleton } from "./components";
export { OwnerBillingDashboard, OwnerBillingDashboardSkeleton } from "./components";
