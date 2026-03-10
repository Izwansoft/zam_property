// =============================================================================
// Admin Users Hooks — Platform-wide user management queries
// =============================================================================
// Cross-partner user queries for Platform Admin (SUPER_ADMIN).
// Backend: GET /api/v1/users (SUPER_ADMIN has full access)
// =============================================================================

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type {
  AdminUserFilters,
  AdminUserDetail,
  AdminCreateUserInput,
} from "../types/admin-users";
import { cleanUserFilters } from "../types/admin-users";

// ---------------------------------------------------------------------------
// Cross-partner User List
// ---------------------------------------------------------------------------

/**
 * Fetch all users across all partners (admin has full access).
 * GET /api/v1/users
 * @param partnerScope — if set, scopes to a specific partner via X-Partner-ID header
 */
export function useAdminUsers(
  filters: AdminUserFilters = {},
  opts?: { partnerScope?: string },
) {
  const { partnerId: _partnerId, ...rest } = filters;
  const cleanedParams = cleanUserFilters(rest as Record<string, unknown>);
  return useApiPaginatedQuery<unknown>({
    queryKey: queryKeys.adminUsers.list(cleanedParams),
    path: "/users",
    params: cleanedParams,
    partnerScope: opts?.partnerScope,
    format: "B", // UserController returns { data: [], meta: { pagination } }
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Single User Detail
// ---------------------------------------------------------------------------

/**
 * Fetch single user by ID (admin access).
 * GET /api/v1/users/:id
 */
export function useAdminUserDetail(
  userId: string | undefined,
  opts?: { partnerScope?: string },
) {
  return useApiQuery<AdminUserDetail>({
    queryKey: queryKeys.adminUsers.detail(`${opts?.partnerScope ?? "global"}:${userId ?? ""}`),
    path: `/users/${userId}`,
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// User Mutations
// ---------------------------------------------------------------------------

export function useAdminDeactivateUser() {
  return useApiMutation<unknown, string>({
    path: (userId) => `/users/${userId}/actions/deactivate`,
    method: "POST",
    invalidateKeys: [queryKeys.adminUsers.all],
  });
}

export function useAdminCreateUser() {
  return useApiMutation<unknown, AdminCreateUserInput>({
    path: "/users",
    method: "POST",
    invalidateKeys: [queryKeys.adminUsers.all],
  });
}

export function useAdminUpdateUser() {
  return useApiMutation<
    unknown,
    { id: string; fullName?: string; phone?: string; role?: string; status?: string }
  >({
    path: (variables) => `/users/${variables.id}`,
    method: "PATCH",
    excludeFromBody: ["id"],
    invalidateKeys: [queryKeys.adminUsers.all],
  });
}
