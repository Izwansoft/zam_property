// =============================================================================
// Agent Types — Domain type definitions
// =============================================================================
// Maps to backend Prisma Agent model + API response contracts.
// Backend endpoints: /agents, /agents/:id, /agents/:id/assign-listing, etc.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match backend exactly)
// ---------------------------------------------------------------------------

export type AgentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type AgentSortBy = "createdAt" | "updatedAt" | "totalListings" | "totalDeals";

export type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Status display config
// ---------------------------------------------------------------------------

export const AGENT_STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Agent Listing (assigned listing)
// ---------------------------------------------------------------------------

export interface AgentListing {
  id: string;
  agentId: string;
  listingId: string;
  assignedAt: string;
  removedAt: string | null;
  listing?: {
    id: string;
    title: string;
    status: string;
    price: number;
  };
}

// ---------------------------------------------------------------------------
// Agent — list item (GET /agents)
// ---------------------------------------------------------------------------

export interface Agent {
  id: string;
  companyId: string | null;
  userId: string;
  verticalType: string | null;
  renNumber: string | null;
  renExpiry: string | null;
  totalListings: number;
  totalDeals: number;
  totalRevenue: number;
  referralCode: string | null;
  referredBy: string | null;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    type: string;
  } | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  agentListings?: AgentListing[];
}

// ---------------------------------------------------------------------------
// Agent Detail — single entity (GET /agents/:id)
// ---------------------------------------------------------------------------

export interface AgentDetail extends Agent {
  company: {
    id: string;
    name: string;
    type: string;
  } | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  agentListings: AgentListing[];
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface RegisterAgentDto {
  companyId?: string;
  userId: string;
  renNumber?: string;
  renExpiry?: string;
  referredBy?: string;
}

export interface UpdateAgentDto {
  renNumber?: string;
  renExpiry?: string;
}

export interface AssignListingDto {
  listingId: string;
}

// ---------------------------------------------------------------------------
// Filter / Query Params
// ---------------------------------------------------------------------------

export interface AgentFilters {
  page?: number;
  limit?: number;
  companyId?: string;
  isIndependent?: boolean;
  verticalType?: string;
  status?: AgentStatus | "";
  search?: string;
  sortBy?: AgentSortBy;
  sortDir?: SortDir;
}

export const DEFAULT_AGENT_FILTERS: AgentFilters = {
  page: 1,
  limit: 20,
  status: "",
  search: "",
  sortBy: "createdAt",
  sortDir: "desc",
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Remove empty/undefined values from filters before passing to API */
export function cleanAgentFilters(
  filters: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/** Format agent display name (from user or fallback) */
export function getAgentDisplayName(agent: Agent): string {
  return agent.user?.fullName ?? `Agent ${agent.id.slice(0, 8)}`;
}

/** Format REN number with expiry */
export function formatRenInfo(agent: Agent): string | null {
  if (!agent.renNumber) return null;
  if (agent.renExpiry) {
    const expiry = new Date(agent.renExpiry);
    const isExpired = expiry < new Date();
    return `${agent.renNumber} (${isExpired ? "Expired" : "Exp"}: ${expiry.toLocaleDateString()})`;
  }
  return agent.renNumber;
}
