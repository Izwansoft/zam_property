// =============================================================================
// Vertical Module Types — VerticalDefinition, PartnerVertical
// =============================================================================
// Re-exports from verticals/types and adds management-specific types.
// =============================================================================

export type {
  VerticalDefinition,
  PartnerVertical,
  VerticalDisplayMetadata,
} from "@/verticals/types/vertical";

// ---------------------------------------------------------------------------
// Create / Update DTOs
// ---------------------------------------------------------------------------

export interface CreateVerticalDefinitionDto {
  type: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  attributeSchema: Record<string, unknown>;
  validationRules: Record<string, unknown>;
  searchMapping: Record<string, unknown>;
  supportedStatuses?: string[];
  displayMetadata?: Record<string, unknown>;
  schemaVersion?: string;
  isActive?: boolean;
  isCore?: boolean;
}

export type UpdateVerticalDefinitionDto = Partial<
  Omit<CreateVerticalDefinitionDto, "type">
>;

export interface EnableVerticalDto {
  verticalType: string;
  configOverrides?: Record<string, unknown>;
  customFields?: Array<Record<string, unknown>>;
  listingLimit?: number;
}

export interface UpdatePartnerVerticalDto {
  configOverrides?: Record<string, unknown>;
  customFields?: Array<Record<string, unknown>>;
  listingLimit?: number;
  isEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Filter / Query
// ---------------------------------------------------------------------------

export interface VerticalQueryParams {
  isActive?: boolean;
  isCore?: boolean;
}

export interface PartnerVerticalQueryParams {
  isEnabled?: boolean;
  verticalType?: string;
}

// ---------------------------------------------------------------------------
// Vertical Health (Runtime Detection)
// ---------------------------------------------------------------------------

/** Implementation status from backend vertical modules */
export type VerticalImplementationStatus = "READY" | "BETA" | "EXPERIMENTAL";

/** Registry entry for an implemented vertical module */
export interface VerticalRegistryEntry {
  /** Vertical type key (e.g., 'real_estate', 'automotive') */
  type: string;
  /** Human-readable name */
  name: string;
  /** Module version */
  version: string;
  /** Implementation status */
  status: VerticalImplementationStatus;
  /** Timestamp when the module registered */
  registeredAt: string;
  /** Optional features supported by this vertical */
  features?: string[];
}

/** Response from GET /verticals/definitions/health */
export interface VerticalHealthResponse {
  /** Map of vertical type -> registry entry */
  verticals: Record<string, VerticalRegistryEntry>;
  /** Total number of implemented verticals */
  implementedCount: number;
  /** List of implemented vertical types */
  implementedTypes: string[];
  /** Server timestamp */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Create Partner DTO (Platform Admin)
// ---------------------------------------------------------------------------

export interface CreatePartnerDto {
  name: string;
  slug: string;
  branding?: Record<string, unknown>;
  verticalTypes?: string[];
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  adminPhone?: string;
}

// ---------------------------------------------------------------------------
// Maintenance Mode
// ---------------------------------------------------------------------------

/**
 * DTO for setting maintenance mode on a vertical
 */
export interface SetMaintenanceDto {
  /** Enable or disable maintenance mode */
  enabled: boolean;
  /** Optional start time (defaults to now if enabled) */
  startAt?: string;
  /** Optional end time for estimated maintenance duration */
  endAt?: string;
  /** Optional message to display during maintenance */
  message?: string;
}

/**
 * Response from maintenance status endpoints
 */
export interface MaintenanceStatusResponse {
  /** Vertical type */
  type: string;
  /** Vertical name */
  name: string;
  /** Whether the vertical is under maintenance */
  isUnderMaintenance: boolean;
  /** Maintenance message (if under maintenance) */
  message?: string;
  /** When maintenance started */
  startAt?: string;
  /** Expected end time */
  endAt?: string;
  /** Estimated remaining time in milliseconds (if endAt is set) */
  estimatedRemainingMs?: number;
}
