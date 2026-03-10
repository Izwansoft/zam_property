// =============================================================================
// Maintenance Hooks — Barrel Export
// =============================================================================

export { useMaintenanceTickets } from "./useMaintenanceTickets";
export { useMaintenanceTicket } from "./useMaintenanceTicket";
export {
  useCreateMaintenance,
  useAddMaintenanceAttachment,
  useAddMaintenanceComment,
} from "./useCreateMaintenance";
export {
  useOwnerMaintenanceTickets,
  useVerifyMaintenance,
  useAssignMaintenance,
  useStartMaintenance,
  useResolveMaintenance,
  useCloseMaintenance,
  useCancelMaintenance,
} from "./useOwnerMaintenance";
export type {
  VerifyMaintenanceDto,
  AssignMaintenanceDto,
  ResolveMaintenanceDto,
  CloseMaintenanceDto,
  CancelMaintenanceDto,
} from "./useOwnerMaintenance";
