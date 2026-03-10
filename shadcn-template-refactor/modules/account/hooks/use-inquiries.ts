// =============================================================================
// useInquiries — Customer's sent inquiries query hook
// =============================================================================
// TODO: Backend does NOT have GET /account/inquiries.
//       Interactions module has GET /interactions but scoped to vendors/admins.
//       Customer-facing "my inquiries" needs backend support.
// =============================================================================

"use client";

import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import type { CustomerInquiry, InquiryFilters } from "../types";

function cleanInquiryFilters(filters: InquiryFilters): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  if (filters.page) cleaned.page = filters.page;
  if (filters.pageSize) cleaned.pageSize = filters.pageSize;
  if (filters.status) cleaned.status = filters.status;
  if (filters.search) cleaned.search = filters.search;
  return cleaned;
}

/**
 * Disabled — backend does not have customer-facing inquiries endpoint.
 * Enable when backend adds GET /interactions?role=customer filter.
 */
export function useInquiries(filters: InquiryFilters = {}) {
  const cleanedParams = cleanInquiryFilters(filters);

  return useApiPaginatedQuery<CustomerInquiry>({
    queryKey: queryKeys.account.inquiries(cleanedParams),
    path: "/account/inquiries",
    params: cleanedParams,
    format: "A",
    staleTime: 60 * 1000,
    enabled: false, // Backend not implemented
  });
}
