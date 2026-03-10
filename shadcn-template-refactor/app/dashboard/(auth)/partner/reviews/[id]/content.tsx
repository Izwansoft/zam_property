// =============================================================================
// Partner Review Detail — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { useReviewDetail } from "@/modules/review/hooks/use-review-detail";
import {
  ReviewDetailView,
  ReviewDetailSkeleton,
} from "@/modules/review/components/review-detail";

export function PartnerReviewDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: review, isLoading, error } = useReviewDetail(params.id);

  if (isLoading) {
    return <ReviewDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          Failed to load review
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Review not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The review you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
      </div>
    );
  }

  return (
    <ReviewDetailView
      review={review}
      portalType="partner"
      backPath="/dashboard/partner/reviews"
    />
  );
}
