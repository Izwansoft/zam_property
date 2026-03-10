// =============================================================================
// Interaction Mutations — Status update, send message
// =============================================================================
// All status changes go through useUpdateInteractionStatus().
// There are NO separate accept/reject/escalate endpoints.
// =============================================================================

"use client";

import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  InteractionDetail,
  InteractionMessage,
  UpdateInteractionStatusDto,
  SendMessageDto,
} from "../types";

// ---------------------------------------------------------------------------
// useUpdateInteractionStatus
// ---------------------------------------------------------------------------

/**
 * Update an interaction's status.
 * Valid transitions are enforced server-side.
 *
 * @example
 * ```tsx
 * const updateStatus = useUpdateInteractionStatus();
 * updateStatus.mutate({ id: "int-001", status: "CONTACTED" });
 * ```
 */
export function useUpdateInteractionStatus() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    InteractionDetail,
    UpdateInteractionStatusDto & { id: string }
  >({
    path: (variables) => `/interactions/${variables.id}/status`,
    method: "PATCH",
    invalidateKeys: [queryKeys.interactions.all(partnerKey)],
  });
}

// ---------------------------------------------------------------------------
// useSendMessage
// ---------------------------------------------------------------------------

/**
 * Send a message (reply) on an interaction.
 * Does NOT automatically change status — vendor must explicitly transition.
 *
 * @example
 * ```tsx
 * const sendMessage = useSendMessage();
 * sendMessage.mutate({ interactionId: "int-001", content: "Hello!" });
 * ```
 */
export function useSendMessage() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    InteractionMessage,
    SendMessageDto & { interactionId: string }
  >({
    path: (variables) =>
      `/interactions/${variables.interactionId}/messages`,
    method: "POST",
    invalidateKeys: [queryKeys.interactions.all(partnerKey)],
  });
}
