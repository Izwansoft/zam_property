// =============================================================================
// usePlans — TanStack Query hook for subscription plans
// =============================================================================
// Fetches available subscription plans.
// Backend endpoint: GET /api/v1/plans (public, no auth required)
// Response format: Format B (meta pagination)
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { Plan } from "../types";

export interface UsePlansParams {
  isActive?: boolean;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch available subscription plans.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePlans({ isActive: true, isPublic: true });
 * // data.items: Plan[], data.pagination
 * ```
 */
export function usePlans(params: UsePlansParams = {}) {
  const cleanedParams: Record<string, unknown> = {};

  if (params.isActive !== undefined) cleanedParams.isActive = params.isActive;
  if (params.isPublic !== undefined) cleanedParams.isPublic = params.isPublic;
  if (params.page) cleanedParams.page = params.page;
  if (params.pageSize) cleanedParams.pageSize = params.pageSize;

  return useApiPaginatedQuery<Plan>({
    queryKey: queryKeys.subscriptions.plans(cleanedParams),
    path: "/plans",
    params: cleanedParams,
    format: "B",
    staleTime: 5 * 60 * 1000, // Plans rarely change — 5 min stale
  });
}
