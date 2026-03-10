// =============================================================================
// Maintenance Module — Public API
// =============================================================================

// Types
export type {
  Maintenance,
  MaintenanceAttachment,
  MaintenanceUpdate,
  MaintenanceTenancyRef,
  MaintenanceFilters,
  MaintenanceFilterTab,
  MaintenanceStatusConfig,
  MaintenanceStatusVariant,
  MaintenancePriorityConfig,
  MaintenanceCategoryConfig,
  CreateMaintenanceDto,
  AddAttachmentDto,
  AttachmentUploadResponse,
  AddCommentDto,
} from "./types";
export {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceAttachmentType,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
  MAINTENANCE_CATEGORY_CONFIG,
  MAINTENANCE_FILTER_TABS,
  getStatusesForMaintenanceFilter,
} from "./types";

// Hooks
export {
  useMaintenanceTickets,
  useMaintenanceTicket,
  useCreateMaintenance,
  useAddMaintenanceAttachment,
  useAddMaintenanceComment,
  useOwnerMaintenanceTickets,
  useVerifyMaintenance,
  useAssignMaintenance,
  useStartMaintenance,
  useResolveMaintenance,
  useCloseMaintenance,
  useCancelMaintenance,
} from "./hooks";
export type {
  VerifyMaintenanceDto,
  AssignMaintenanceDto,
  ResolveMaintenanceDto,
  CloseMaintenanceDto,
  CancelMaintenanceDto,
} from "./hooks";

// Components
export { MaintenanceStatusBadge } from "./components";
export { MaintenancePriorityBadge } from "./components";
export { MaintenanceCard, MaintenanceCardSkeleton } from "./components";
export { MaintenanceList } from "./components";
export { MaintenanceRequestForm } from "./components";
export { MaintenanceTimeline, MaintenanceTimelineSkeleton } from "./components";
export { MaintenanceComments, MaintenanceCommentsSkeleton } from "./components";
export { MaintenanceDetail, MaintenanceDetailSkeleton } from "./components";
export { OwnerMaintenanceInbox, OwnerMaintenanceInboxSkeleton } from "./components";
export { MaintenanceAssignDialog } from "./components";
export { OwnerMaintenanceDetail, OwnerMaintenanceDetailSkeleton } from "./components";
