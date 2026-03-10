// =============================================================================
// Affiliate Hooks — TanStack Query hooks for affiliate endpoints
// =============================================================================
// Covers profile, referrals, earnings, payouts, payout request,
// and admin affiliate management.
// Backend: 13 endpoints at /api/v1/affiliates
// =============================================================================

"use client";

import { useApiPaginatedQuery, useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  AffiliateProfile,
  AffiliateReferral,
  AffiliateEarnings,
  AffiliatePayout,
  ReferralFilters,
  PayoutFilters,
  UpdateAffiliateDto,
  ProcessPayoutDto,
} from "../types";
import { cleanReferralFilters, cleanPayoutFilters } from "../types";

// ---------------------------------------------------------------------------
// useAffiliateProfile — GET /affiliates/:id (affiliate's own profile)
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's affiliate profile.
 * Uses the affiliateId from context.
 *
 * NOTE: Backend has no `/affiliates/me` endpoint. The affiliate ID
 * must be provided. For the dashboard, we use mock data until the
 * profile endpoint is integrated via user context.
 */
export function useAffiliateProfile(affiliateId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<AffiliateProfile>({
    queryKey: queryKeys.affiliates.profile(partnerKey, affiliateId),
    path: `/affiliates/${affiliateId}`,
    enabled: !!partnerId && !!affiliateId,
  });
}

// ---------------------------------------------------------------------------
// useAffiliateReferrals — GET /affiliates/:id/referrals
// ---------------------------------------------------------------------------

/**
 * Fetch paginated referrals for an affiliate.
 */
export function useAffiliateReferrals(
  affiliateId: string,
  filters: ReferralFilters = { page: 1, pageSize: 20 }
) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanReferralFilters(filters);

  return useApiPaginatedQuery<AffiliateReferral>({
    queryKey: queryKeys.affiliates.referrals(partnerKey, affiliateId, cleanedParams),
    path: `/affiliates/${affiliateId}/referrals`,
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId && !!affiliateId,
  });
}

// ---------------------------------------------------------------------------
// useAffiliateEarnings — GET /affiliates/:id/earnings
// ---------------------------------------------------------------------------

/**
 * Fetch earnings summary for an affiliate.
 */
export function useAffiliateEarnings(affiliateId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<AffiliateEarnings>({
    queryKey: queryKeys.affiliates.earnings(partnerKey, affiliateId),
    path: `/affiliates/${affiliateId}/earnings`,
    enabled: !!partnerId && !!affiliateId,
  });
}

// ---------------------------------------------------------------------------
// useAffiliatePayouts — GET /affiliates/:id/payouts
// ---------------------------------------------------------------------------

/**
 * Fetch paginated payout history for an affiliate.
 */
export function useAffiliatePayouts(
  affiliateId: string,
  filters: PayoutFilters = { page: 1, pageSize: 20 }
) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const cleanedParams = cleanPayoutFilters(filters);

  return useApiPaginatedQuery<AffiliatePayout>({
    queryKey: queryKeys.affiliates.payouts(partnerKey, affiliateId, cleanedParams),
    path: `/affiliates/${affiliateId}/payouts`,
    params: cleanedParams,
    format: "A",
    enabled: !!partnerId && !!affiliateId,
  });
}

// ---------------------------------------------------------------------------
// useUpdateAffiliate — PATCH /affiliates/:id
// ---------------------------------------------------------------------------

/**
 * Update affiliate profile (bank details, type, notes).
 */
export function useUpdateAffiliate() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    AffiliateProfile,
    { affiliateId: string; data: UpdateAffiliateDto }
  >({
    path: (vars) => `/affiliates/${vars.affiliateId}`,
    method: "PATCH",
    invalidateKeys: [queryKeys.affiliates.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useRequestPayout — POST /affiliates/:id/payout
// ---------------------------------------------------------------------------

/**
 * Request a payout for unpaid earnings.
 */
export function useRequestPayout() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    AffiliatePayout,
    { affiliateId: string; data?: ProcessPayoutDto }
  >({
    path: (vars) => `/affiliates/${vars.affiliateId}/payout`,
    method: "POST",
    invalidateKeys: [queryKeys.affiliates.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useCompletePayout — POST /affiliates/payouts/:id/complete
// ---------------------------------------------------------------------------

/**
 * Complete a payout (admin action).
 */
export function useCompletePayout() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    AffiliatePayout,
    { payoutId: string; data?: ProcessPayoutDto }
  >({
    path: (vars) => `/affiliates/payouts/${vars.payoutId}/complete`,
    method: "POST",
    invalidateKeys: [queryKeys.affiliates.all(partnerKey)],
  });
}
