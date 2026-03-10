// =============================================================================
// Tenant Profile Hook — Get and update tenant profile
// =============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { Tenant, UpdateTenantDto, TenantResponse } from "../types";

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const tenantKeys = {
  all: ["tenants"] as const,
  profile: () => [...tenantKeys.all, "profile"] as const,
  detail: (id: string) => [...tenantKeys.all, id] as const,
  documents: (id: string) => [...tenantKeys.all, id, "documents"] as const,
};

// ---------------------------------------------------------------------------
// useTenantProfile — Get current user's tenant profile
// ---------------------------------------------------------------------------

export function useTenantProfile() {
  return useQuery({
    queryKey: tenantKeys.profile(),
    queryFn: async (): Promise<Tenant> => {
      const response = await apiClient.get<TenantResponse>("/tenants/me");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// useUpdateTenantProfile — Update current user's tenant profile
// ---------------------------------------------------------------------------

export function useUpdateTenantProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTenantDto): Promise<Tenant> => {
      const response = await apiClient.patch<TenantResponse>("/tenants/me", data);
      return response.data.data;
    },
    onSuccess: (updatedTenant) => {
      // Update the profile cache
      queryClient.setQueryData(tenantKeys.profile(), updatedTenant);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}
