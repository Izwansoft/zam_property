// =============================================================================
// Agent Hooks — TanStack Query hooks for agent CRUD
// =============================================================================
// Covers list, detail, register, update, assign/unassign listing,
// suspend, reactivate, and regenerate referral.
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Agent,
  AgentDetail,
  AgentFilters,
  RegisterAgentDto,
  UpdateAgentDto,
  AssignListingDto,
  AgentListing,
} from "../types";
import { cleanAgentFilters } from "../types";

// ---------------------------------------------------------------------------
// useAgents — paginated list
// ---------------------------------------------------------------------------

/**
 * Fetch paginated agents with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAgents({ status: "ACTIVE", page: 1 });
 * // data.items: Agent[], data.pagination: { page, pageSize, total, totalPages }
 * ```
 */
export function useAgents(filters: AgentFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanAgentFilters(filters as Record<string, unknown>);

  return useApiPaginatedQuery<Agent>({
    queryKey: queryKeys.agents.list(partnerKey, cleanedParams),
    path: "/agents",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// useAgent — single detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single agent by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAgent("agent-001");
 * // data: AgentDetail
 * ```
 */
export function useAgent(agentId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<AgentDetail>({
    queryKey: queryKeys.agents.detail(partnerKey, agentId),
    path: `/agents/${agentId}`,
    enabled: !!partnerId && !!agentId,
  });
}

// ---------------------------------------------------------------------------
// useAgentListings — agent's assigned listings
// ---------------------------------------------------------------------------

export function useAgentListings(agentId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<AgentListing[]>({
    queryKey: queryKeys.agents.listings(partnerKey, agentId),
    path: `/agents/${agentId}/listings`,
    enabled: !!partnerId && !!agentId,
  });
}

// ---------------------------------------------------------------------------
// useRegisterAgent — POST /agents
// ---------------------------------------------------------------------------

export function useRegisterAgent() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Agent, RegisterAgentDto>({
    path: "/agents",
    method: "POST",
    invalidateKeys: [queryKeys.agents.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useUpdateAgent — PATCH /agents/:id
// ---------------------------------------------------------------------------

export function useUpdateAgent() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Agent, UpdateAgentDto & { id: string }>({
    path: (variables) => `/agents/${variables.id}`,
    method: "PATCH",
    invalidateKeys: [queryKeys.agents.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useAssignListing — POST /agents/:id/assign-listing
// ---------------------------------------------------------------------------

export function useAssignListing() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<AgentListing, AssignListingDto & { agentId: string }>({
    path: (variables) => `/agents/${variables.agentId}/assign-listing`,
    method: "POST",
    invalidateKeys: [queryKeys.agents.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useUnassignListing — DELETE /agents/:id/listings/:listingId
// ---------------------------------------------------------------------------

export function useUnassignListing() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<void, { agentId: string; listingId: string }>({
    path: (variables) => `/agents/${variables.agentId}/listings/${variables.listingId}`,
    method: "DELETE",
    invalidateKeys: [queryKeys.agents.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useSuspendAgent — POST /agents/:id/suspend
// ---------------------------------------------------------------------------

export function useSuspendAgent() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Agent, string>({
    path: (agentId) => `/agents/${agentId}/suspend`,
    method: "POST",
    invalidateKeys: [queryKeys.agents.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useReactivateAgent — POST /agents/:id/reactivate
// ---------------------------------------------------------------------------

export function useReactivateAgent() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Agent, string>({
    path: (agentId) => `/agents/${agentId}/reactivate`,
    method: "POST",
    invalidateKeys: [queryKeys.agents.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useRegenerateReferralCode — POST /agents/:id/regenerate-referral
// ---------------------------------------------------------------------------

export function useRegenerateReferralCode() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Agent, string>({
    path: (agentId) => `/agents/${agentId}/regenerate-referral`,
    method: "POST",
    invalidateKeys: [queryKeys.agents.all(partnerKey)],
  });
}
