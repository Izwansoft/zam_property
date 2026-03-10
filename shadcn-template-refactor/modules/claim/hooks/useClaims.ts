// =============================================================================
// useClaims — TanStack Query hooks for Claim module
// =============================================================================
// Provides list, detail, create, review, dispute, and evidence hooks.
// API: /api/v1/claims
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  Claim,
  ClaimFilters,
  CreateClaimDto,
  ReviewClaimDto,
  DisputeClaimDto,
  UploadEvidenceDto,
  UploadEvidenceResponse,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanFilters(filters: ClaimFilters): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      if (key === "pageSize") {
        cleaned["limit"] = value;
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// List claims
// ---------------------------------------------------------------------------

/**
 * Fetch paginated claim list with filters.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useClaims({ type: ClaimType.DAMAGE, page: 1 });
 * // data.items: Claim[], data.pagination
 * ```
 */
export function useClaims(filters: ClaimFilters = {}) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanFilters(filters);

  return useApiPaginatedQuery<Claim>({
    queryKey: queryKeys.claims.list(partnerKey, cleanedParams),
    path: "/claims",
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId,
  });
}

// ---------------------------------------------------------------------------
// Single claim detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single claim by ID (includes evidence and tenancy details).
 */
export function useClaim(claimId: string | undefined) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<Claim>({
    queryKey: queryKeys.claims.detail(partnerKey, claimId ?? ""),
    path: `/claims/${claimId}`,
    enabled: !!partnerId && !!claimId,
  });
}

// ---------------------------------------------------------------------------
// Create claim
// ---------------------------------------------------------------------------

/**
 * Submit a new claim.
 * POST /api/v1/claims
 */
export function useCreateClaim() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Claim, CreateClaimDto>({
    path: "/claims",
    method: "POST",
    invalidateKeys: [queryKeys.claims.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// Review claim (approve / partially approve / reject)
// ---------------------------------------------------------------------------

/**
 * Owner reviews a claim — approve, partially approve, or reject.
 * POST /api/v1/claims/:id/review
 */
export function useReviewClaim(claimId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Claim, ReviewClaimDto>({
    path: `/claims/${claimId}/review`,
    method: "POST",
    invalidateKeys: [
      queryKeys.claims.all(partnerKey),
      queryKeys.claims.detail(partnerKey, claimId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Dispute claim
// ---------------------------------------------------------------------------

/**
 * Dispute a claim decision.
 * POST /api/v1/claims/:id/dispute
 */
export function useDisputeClaim(claimId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<Claim, DisputeClaimDto>({
    path: `/claims/${claimId}/dispute`,
    method: "POST",
    invalidateKeys: [
      queryKeys.claims.all(partnerKey),
      queryKeys.claims.detail(partnerKey, claimId),
    ],
  });
}

// ---------------------------------------------------------------------------
// Upload evidence (returns presigned URL)
// ---------------------------------------------------------------------------

/**
 * Request a presigned upload URL for claim evidence.
 * POST /api/v1/claims/:id/evidence
 */
export function useUploadEvidence(claimId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<UploadEvidenceResponse, UploadEvidenceDto>({
    path: `/claims/${claimId}/evidence`,
    method: "POST",
    invalidateKeys: [queryKeys.claims.detail(partnerKey, claimId)],
  });
}
