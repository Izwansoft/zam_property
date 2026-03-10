// =============================================================================
// Vertical Catalog — Predefined verticals supported by the platform
// =============================================================================
// This is the single source of truth for all available vertical types.
// Super Admin can enable/disable these — they cannot create arbitrary verticals
// because each vertical requires a coded attributeSchema, validationRules, and
// searchMapping on the backend.
//
// ARCHITECTURE NOTE:
// This is a MODULAR MONOLITH, not microservices. Each vertical is a coded
// module within the same NestJS backend. The `developmentStatus` indicates
// whether the vertical's code is complete and ready to be enabled.
// =============================================================================

import type { LucideIcon } from "lucide-react";
import {
  BuildingIcon,
  CarIcon,
  BriefcaseIcon,
  WrenchIcon,
  SmartphoneIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Development Status
// ---------------------------------------------------------------------------

/**
 * Indicates the development readiness of a vertical's codebase.
 * - READY: Backend module complete, can be enabled by Super Admin
 * - BETA: Coded but experimental, enable with caution
 * - COMING_SOON: Planned but backend module not yet implemented
 */
export type VerticalDevelopmentStatus = "READY" | "BETA" | "COMING_SOON";

// ---------------------------------------------------------------------------
// Vertical Catalog Entry
// ---------------------------------------------------------------------------

export interface VerticalCatalogEntry {
  /** Unique type key (SCREAMING_SNAKE_CASE) — matches backend VerticalDefinition.type */
  type: string;
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Lucide icon name string (for backend storage) */
  iconName: string;
  /** Brand colour (hex) */
  color: string;
  /** Whether this is a core vertical (cannot be deleted) */
  isCore: boolean;
  /** Development status — indicates if backend code is ready */
  developmentStatus: VerticalDevelopmentStatus;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const VERTICAL_CATALOG: VerticalCatalogEntry[] = [
  {
    type: "REAL_ESTATE",
    name: "Real Estate",
    description:
      "Properties for sale and rent — residential and commercial, condos, houses, land, offices",
    icon: BuildingIcon,
    iconName: "building",
    color: "#3B82F6",
    isCore: true,
    developmentStatus: "READY", // ✅ Full backend module implemented
  },
  {
    type: "AUTOMOTIVE",
    name: "Automotive",
    description:
      "Cars, motorcycles, and commercial vehicles for sale",
    icon: CarIcon,
    iconName: "car",
    color: "#EF4444",
    isCore: false,
    developmentStatus: "COMING_SOON", // Backend module not yet coded
  },
  {
    type: "JOBS",
    name: "Jobs",
    description:
      "Job listings for full-time, part-time, contract, and freelance positions",
    icon: BriefcaseIcon,
    iconName: "briefcase",
    color: "#8B5CF6",
    isCore: false,
    developmentStatus: "COMING_SOON", // Backend module not yet coded
  },
  {
    type: "SERVICES",
    name: "Services",
    description:
      "Professional and home services — cleaning, renovation, movers, tutoring",
    icon: WrenchIcon,
    iconName: "wrench",
    color: "#F59E0B",
    isCore: false,
    developmentStatus: "COMING_SOON", // Backend module not yet coded
  },
  {
    type: "ELECTRONICS",
    name: "Electronics",
    description:
      "Smartphones, laptops, gadgets, and electronic accessories",
    icon: SmartphoneIcon,
    iconName: "smartphone",
    color: "#10B981",
    isCore: false,
    developmentStatus: "COMING_SOON", // Backend module not yet coded
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a catalog entry by type key */
export function getVerticalCatalogEntry(
  type: string
): VerticalCatalogEntry | undefined {
  return VERTICAL_CATALOG.find((v) => v.type === type);
}

/** Map of type → catalog entry for quick lookups */
export const VERTICAL_CATALOG_MAP = Object.fromEntries(
  VERTICAL_CATALOG.map((v) => [v.type, v])
) as Record<string, VerticalCatalogEntry>;
