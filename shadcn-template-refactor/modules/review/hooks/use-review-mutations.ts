// =============================================================================
// Review Mutations — Moderation actions + vendor response
// =============================================================================
// Backend uses a single PATCH /reviews/:id/moderate with { action } in body.
// Approve, Reject (with reason), Flag (with reason), Response (vendor only)
// =============================================================================

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import type {
  ReviewDetail,
  ApproveReviewDto,
  RejectReviewDto,
  FlagReviewDto,
  ReplyToReviewDto,
} from "../types";

// ---------------------------------------------------------------------------
// useApproveReview
// ---------------------------------------------------------------------------

/**
 * Approve a review (partner admin / platform admin).
 * Backend: PATCH /reviews/:id/moderate { action: "approve" }
 *
 * @example
 * ```tsx
 * const approve = useApproveReview();
 * approve.mutate({ id: "review-001" });
 * ```
 */
export function useApproveReview() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useMutation<ReviewDetail, Error, ApproveReviewDto & { id: string }>({
    mutationFn: async (variables) => {
      const response = await apiClient.patch<{ data: ReviewDetail }>(
        `/reviews/${variables.id}/moderate`,
        { action: "approve" }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.all(partnerKey),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useRejectReview
// ---------------------------------------------------------------------------

/**
 * Reject a review (partner admin / platform admin).
 * Backend: PATCH /reviews/:id/moderate { action: "reject", reason }
 * Requires a reason.
 *
 * @example
 * ```tsx
 * const reject = useRejectReview();
 * reject.mutate({ id: "review-001", reason: "Inappropriate content" });
 * ```
 */
export function useRejectReview() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useMutation<ReviewDetail, Error, RejectReviewDto & { id: string }>({
    mutationFn: async (variables) => {
      const response = await apiClient.patch<{ data: ReviewDetail }>(
        `/reviews/${variables.id}/moderate`,
        { action: "reject", reason: variables.reason }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.all(partnerKey),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useFlagReview
// ---------------------------------------------------------------------------

/**
 * Flag a review for further attention (admin only).
 * Backend: PATCH /reviews/:id/moderate { action: "flag", reason }
 * Requires a reason.
 *
 * @example
 * ```tsx
 * const flag = useFlagReview();
 * flag.mutate({ id: "review-001", reason: "Suspected spam" });
 * ```
 */
export function useFlagReview() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";
  const queryClient = useQueryClient();

  return useMutation<ReviewDetail, Error, FlagReviewDto & { id: string }>({
    mutationFn: async (variables) => {
      const response = await apiClient.patch<{ data: ReviewDetail }>(
        `/reviews/${variables.id}/moderate`,
        { action: "flag", reason: variables.reason }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.all(partnerKey),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useReplyToReview
// ---------------------------------------------------------------------------

/**
 * Vendor response to a review. Cannot modify original review.
 * Response is public (may require moderation).
 * Backend: POST /reviews/:id/response
 *
 * @example
 * ```tsx
 * const reply = useReplyToReview();
 * reply.mutate({ id: "review-001", content: "Thank you for your feedback!" });
 * ```
 */
export function useReplyToReview() {
  const partnerId = usePartnerId();
  const partnerKey = partnerId ?? "__no_partner__";

  return useApiMutation<
    ReviewDetail,
    ReplyToReviewDto & { id: string }
  >({
    path: (variables) => `/reviews/${variables.id}/response`,
    method: "POST",
    invalidateKeys: [queryKeys.reviews.all(partnerKey)],
  });
}
