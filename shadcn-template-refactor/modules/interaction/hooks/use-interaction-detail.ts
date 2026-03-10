// =============================================================================
// useInteractionDetail — TanStack Query hook for single interaction
// =============================================================================
// Fetches a single interaction by ID using standard single entity response.
// Uses partner-scoped query keys for proper cache isolation.
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type { InteractionDetail } from "../types";

/**
 * Fetch a single interaction by ID.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInteractionDetail("interaction-001");
 * // data: InteractionDetail (includes messages)
 * ```
 */
export function useInteractionDetail(interactionId: string) {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiQuery<InteractionDetail>({
    queryKey: queryKeys.interactions.detail(partnerKey, interactionId),
    path: `/interactions/${interactionId}`,
    enabled: !!partnerId && !!interactionId,
  });
}
