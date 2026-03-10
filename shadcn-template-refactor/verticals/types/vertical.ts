// verticals/types/vertical.ts — Core vertical type definitions

import type { AttributeSchema } from "./attributes";
import type { VerticalSearchMapping } from "./search";

/**
 * Supported vertical types.
 * Maps to backend VerticalDefinition.type (string).
 * New verticals are added here as they are enabled.
 */
export type VerticalType =
  | "REAL_ESTATE"
  | "AUTOMOTIVE"
  | "JOBS"
  | "SERVICES"
  | "ELECTRONICS"
  | string; // extensible for future verticals

/**
 * Backend VerticalDefinition entity.
 * Matches the Prisma model shape returned by GET /api/v1/verticals.
 */
export interface VerticalDefinition {
  id: string;
  type: VerticalType;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  attributeSchema: AttributeSchema;
  validationRules: ValidationRules;
  searchMapping: VerticalSearchMapping;
  supportedStatuses: string[];
  displayMetadata: VerticalDisplayMetadata | null;
  schemaVersion: string;
  isActive: boolean;
  isCore: boolean;
  // Maintenance mode fields
  maintenanceMode?: boolean;
  maintenanceStartAt?: string | null;
  maintenanceEndAt?: string | null;
  maintenanceMessage?: string | null;
  maintenanceScheduledBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A partner's enabled vertical configuration.
 * Matches PartnerVertical model.
 */
export interface PartnerVertical {
  id: string;
  partnerId: string;
  verticalId: string;
  vertical: VerticalDefinition;
  configOverrides: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
  listingLimit: number | null;
  isEnabled: boolean;
  enabledAt: string;
  disabledAt: string | null;
}

/**
 * Display metadata for UI rendering hints.
 */
export interface VerticalDisplayMetadata {
  /** Card layout: 'standard' | 'gallery' | 'compact' */
  cardLayout?: string;
  /** Primary display fields on cards */
  primaryFields?: string[];
  /** Secondary display fields */
  secondaryFields?: string[];
  /** Icon name for the vertical */
  iconName?: string;
  /** Colour theme for badges */
  badgeColor?: string;
  /** Map display settings */
  mapSettings?: {
    defaultZoom?: number;
    clusterEnabled?: boolean;
  };
}

/**
 * Validation rules per status.
 * The backend enforces these server-side; the frontend uses them for UX.
 */
export interface ValidationRules {
  /** Fields required to save as draft */
  draft?: StatusValidation;
  /** Fields required to publish */
  publish?: StatusValidation;
}

export interface StatusValidation {
  /** Attribute keys that must be present */
  required: string[];
  /** Conditional requirements */
  conditionalRequired?: ConditionalRequirement[];
}

export interface ConditionalRequirement {
  /** The attribute key to check */
  when: string;
  /** The value(s) that trigger the requirement */
  is: unknown;
  /** Attributes that become required */
  then: string[];
}
