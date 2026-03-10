// =============================================================================
// Audit Module — Public API
// =============================================================================
// Re-exports all types, hooks, and components for the audit domain.
// =============================================================================

// ---- Types ----
export type {
  AuditLogEntry,
  AuditActorType,
  AuditLogFilters,
  AuditPagination,
  AuditLogsResponse,
  ActionTypesResponse,
  TargetTypesResponse,
  ActionCategory,
} from "./types";
export {
  DEFAULT_AUDIT_FILTERS,
  ACTOR_TYPE_LABELS,
  ACTOR_TYPE_CONFIG,
  ACTION_CATEGORY_COLORS,
  getActionCategory,
  formatActionType,
  formatTargetType,
} from "./types";

// ---- Hooks ----
export { useAuditLogs } from "./hooks/use-audit-logs";
export { useAuditLogDetail } from "./hooks/use-audit-log-detail";
export { useAuditLogsByTarget } from "./hooks/use-audit-logs-by-target";
export { useAuditLogsByActor } from "./hooks/use-audit-logs-by-actor";
export { useAuditActionTypes } from "./hooks/use-audit-action-types";
export { useAuditTargetTypes } from "./hooks/use-audit-target-types";

// ---- Components ----
export { AuditLogList } from "./components/audit-log-list";
export { AuditLogItem } from "./components/audit-log-item";
export { AuditLogFiltersBar } from "./components/audit-log-filters";
export { AuditLogDetailModal } from "./components/audit-log-detail-modal";
export { ViewAuditHistoryLink } from "./components/view-audit-history-link";
