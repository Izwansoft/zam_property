// =============================================================================
// useVendorOnboarding — Mutation hook for submitting vendor onboarding
// =============================================================================
// POST /api/v1/vendors/onboard — Creates vendor with PENDING status.
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { VendorDetail } from "../types";
import type { OnboardingFormValues } from "../components/onboarding-form/onboarding-schema";

// ---------------------------------------------------------------------------
// DTO — maps form values to backend request
// ---------------------------------------------------------------------------

export interface VendorOnboardingDto {
  name: string;
  type: "INDIVIDUAL" | "COMPANY";
  email: string;
  phone: string;
  description?: string;
  registrationNumber: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documentNames?: string[];
}

/**
 * Map form values to the backend DTO.
 */
export function mapFormToDto(values: OnboardingFormValues): VendorOnboardingDto {
  const type = values.profileModel === "COMPANY" ? "COMPANY" : "INDIVIDUAL";

  const metadataNotes: string[] = [];
  if (values.profileModel) {
    metadataNotes.push(`Profile Model: ${values.profileModel}`);
  }
  if (values.companyName || values.companyId) {
    metadataNotes.push(`Company: ${values.companyName || values.companyId}`);
  }
  if (values.agentName || values.agentId) {
    metadataNotes.push(`Agent: ${values.agentName || values.agentId}`);
  }

  const description = [values.description, ...metadataNotes]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return {
    name: values.name,
    type,
    email: values.email,
    phone: values.phone,
    description: description || undefined,
    registrationNumber: values.registrationNumber,
    address: {
      line1: values.address.line1,
      line2: values.address.line2 || undefined,
      city: values.address.city,
      state: values.address.state,
      postalCode: values.address.postalCode,
      country: values.address.country,
    },
    documentNames:
      values.documentNames.length > 0 ? values.documentNames : undefined,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Submit vendor onboarding form.
 *
 * @example
 * ```tsx
 * const onboard = useVendorOnboarding();
 * onboard.mutate(dto);
 * ```
 */
export function useVendorOnboarding() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<VendorDetail, VendorOnboardingDto>({
    path: "/vendors/onboard",
    method: "POST",
    invalidateKeys: [queryKeys.vendors.all(partnerKey)],
  });
}
