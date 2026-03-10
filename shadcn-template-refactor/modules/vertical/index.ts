// =============================================================================
// Vertical Module — Barrel exports
// =============================================================================

// Types
export type {
  VerticalDefinition,
  PartnerVertical,
  VerticalDisplayMetadata,
  CreateVerticalDefinitionDto,
  UpdateVerticalDefinitionDto,
  EnableVerticalDto,
  UpdatePartnerVerticalDto,
  VerticalQueryParams,
  PartnerVerticalQueryParams,
  CreatePartnerDto,
  // Health types
  VerticalImplementationStatus,
  VerticalRegistryEntry,
  VerticalHealthResponse,
  // Maintenance types
  SetMaintenanceDto,
  MaintenanceStatusResponse,
} from "./types";

// Hooks — Definitions (platform admin)
export {
  useVerticalDefinitions,
  useActiveVerticalDefinitions,
  useVerticalDefinition,
  useCreateVerticalDefinition,
  useUpdateVerticalDefinition,
  useActivateVerticalDefinition,
  useDeactivateVerticalDefinition,
  useDeleteVerticalDefinition,
  useVerticalHealth,
  // Maintenance hooks
  useSetVerticalMaintenance,
  useVerticalMaintenanceStatus,
  useAllVerticalMaintenanceStatuses,
} from "./hooks/use-vertical-definitions";

// Hooks — Partner verticals (partner admin)
export {
  usePartnerVerticals,
  useEnabledPartnerVerticals,
  usePartnerVertical,
  useEnablePartnerVertical,
  useUpdatePartnerVertical,
  useDisablePartnerVertical,
  partnerVerticalKeys,
} from "./hooks/use-partner-verticals";

// Hooks — Maintenance status (public)
export {
  useMaintenanceStatus,
  useAllMaintenanceStatuses,
  getVerticalFromPath,
  PATH_TO_VERTICAL,
  VERTICAL_TO_PATH,
  type MaintenanceStatus,
} from "./hooks/use-maintenance";

// Components — Maintenance
export { MaintenancePage } from "./components/maintenance-page";
export { MaintenanceGuard } from "./components/maintenance-guard";

// Components — Vertical Selector
export { VerticalSelector } from "./components/vertical-selector";

// Store — Vertical context (filter)
export { useVerticalContextStore } from "./store/vertical-context-store";

// Utils — Display names
export {
  VERTICAL_DISPLAY_NAMES,
  getVerticalDisplayName,
} from "./utils/display-names";

// Constants — Vertical catalog
export {
  VERTICAL_CATALOG,
  VERTICAL_CATALOG_MAP,
  getVerticalCatalogEntry,
} from "./constants/vertical-catalog";
export type {
  VerticalCatalogEntry,
  VerticalDevelopmentStatus,
} from "./constants/vertical-catalog";
