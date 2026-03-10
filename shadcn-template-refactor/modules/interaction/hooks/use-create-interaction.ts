// =============================================================================
// useCreateInteraction — Submit an inquiry / lead / booking
// =============================================================================
// Used on the public listing detail page to let authenticated users
// submit an inquiry or lead to a vendor.
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import type { Interaction, CreateInteractionDto } from "../types";

// ---------------------------------------------------------------------------
// useCreateInteraction
// ---------------------------------------------------------------------------

/**
 * Create a new interaction (inquiry/lead/booking).
 *
 * @example
 * ```tsx
 * const createInteraction = useCreateInteraction();
 * createInteraction.mutate({
 *   vendorId: "vendor-001",
 *   listingId: "listing-001",
 *   interactionType: "ENQUIRY",
 *   contactName: "John Doe",
 *   contactEmail: "john@example.com",
 *   message: "I'm interested in this property",
 *   source: "web",
 * });
 * ```
 */
export function useCreateInteraction() {
  return useApiMutation<Interaction, CreateInteractionDto>({
    path: "/interactions",
    method: "POST",
  });
}
