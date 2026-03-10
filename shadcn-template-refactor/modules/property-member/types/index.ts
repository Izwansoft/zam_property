// =============================================================================
// Property Member Types — Domain type definitions
// =============================================================================
// Maps to backend PropertyMember model + PropertyRole enum.
// Backend endpoints: /properties/:listingId/members, /my/properties
// =============================================================================

import type { PropertyRole } from "@/types/backend-contracts";

// Re-export for convenience
export type { PropertyRole } from "@/types/backend-contracts";

// ---------------------------------------------------------------------------
// Status display config for PropertyRole
// ---------------------------------------------------------------------------

export const PROPERTY_ROLE_CONFIG: Record<
  PropertyRole,
  { label: string; description: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PROPERTY_ADMIN: {
    label: "Property Admin",
    description: "Full control over property and team",
    variant: "default",
  },
  PROPERTY_MANAGER: {
    label: "Property Manager",
    description: "Manage tenancies, maintenance, inspections",
    variant: "default",
  },
  LEASING_MANAGER: {
    label: "Leasing Manager",
    description: "Handle applications, viewings, contracts",
    variant: "secondary",
  },
  MAINTENANCE_STAFF: {
    label: "Maintenance Staff",
    description: "Handle maintenance tickets and repairs",
    variant: "secondary",
  },
  PROPERTY_STAFF: {
    label: "Property Staff",
    description: "Read-only access with limited actions",
    variant: "outline",
  },
};

// ---------------------------------------------------------------------------
// PropertyMember — list item
// ---------------------------------------------------------------------------

export interface PropertyMember {
  id: string;
  partnerId: string;
  listingId: string;
  userId: string;
  role: PropertyRole;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  listing?: {
    id: string;
    title: string;
    status: string;
  };
}

// ---------------------------------------------------------------------------
// MyProperty — a property the current user is assigned to
// ---------------------------------------------------------------------------

export interface MyProperty {
  id: string;
  listingId: string;
  role: PropertyRole;
  listing: {
    id: string;
    title: string;
    status: string;
    price: number;
    vendor?: {
      id: string;
      companyName: string;
    };
  };
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface AddPropertyMemberDto {
  userId: string;
  role: PropertyRole;
  notes?: string;
}

export interface UpdatePropertyMemberDto {
  role?: PropertyRole;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

export interface PropertyMemberFilters {
  page?: number;
  limit?: number;
  role?: PropertyRole | "";
  search?: string;
}

export const DEFAULT_PROPERTY_MEMBER_FILTERS: PropertyMemberFilters = {
  page: 1,
  limit: 20,
  role: "",
  search: "",
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Remove empty/undefined values from filters before passing to API */
export function cleanPropertyMemberFilters(
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/** Get display name for a PropertyRole */
export function getPropertyRoleLabel(role: PropertyRole): string {
  return PROPERTY_ROLE_CONFIG[role]?.label ?? role;
}

/** Get display name for a property member */
export function getMemberDisplayName(member: PropertyMember): string {
  return member.user?.fullName ?? `User ${member.userId.slice(0, 8)}`;
}
