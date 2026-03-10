// =============================================================================
// useTenantOnboarding — Submit tenant profile creation
// =============================================================================
// Backend: POST /api/v1/tenants — Creates tenant profile
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { CreateTenantDto, TenantResponse, EmergencyContact } from "../types";
import { tenantKeys } from "./use-tenant-profile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubmitOnboardingDto {
  fullName: string;
  phone: string;
  email: string;
  icNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  employmentStatus?: string;
  employerName?: string;
  employerAddress?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  emergencyContacts: EmergencyContact[];
  documentIds: string[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Submit tenant onboarding data (create tenant profile).
 * Backend: POST /api/v1/tenants
 */
export function useSubmitTenantOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitOnboardingDto): Promise<TenantResponse> => {
      const response = await apiClient.post<TenantResponse>(
        "/tenants",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}
