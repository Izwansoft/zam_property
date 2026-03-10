// =============================================================================
// useProfile — Customer profile query & mutation hooks
// =============================================================================
// GET /users/me → profile data
// PATCH /users/me → update profile (self-service)
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { CustomerProfile, UpdateProfileDto } from "../types";

// ---------------------------------------------------------------------------
// useProfile — fetch current user profile
// ---------------------------------------------------------------------------

export function useProfile() {
  return useApiQuery<CustomerProfile>({
    queryKey: queryKeys.account.profile(),
    path: "/users/me",
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// useUpdateProfile — update profile fields
// ---------------------------------------------------------------------------

export function useUpdateProfile() {
  return useApiMutation<CustomerProfile, UpdateProfileDto>({
    path: "/users/me",
    method: "PATCH",
    invalidateKeys: [queryKeys.account.profile(), queryKeys.auth.me()],
  });
}
