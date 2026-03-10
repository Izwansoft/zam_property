// =============================================================================
// Vendor Claim Detail — Client content (Owner review view)
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/page-header";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import { useClaim } from "@/modules/claim/hooks";
import {
  ClaimDetail,
  ClaimDetailSkeleton,
} from "@/modules/claim/components/claim-detail";
import { ClaimReviewPanel } from "@/modules/claim/components/claim-review-panel";
import { queryKeys } from "@/lib/query";
import { showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorClaimDetailContent() {
  const params = useParams<{ id: string }>();
  const partnerId = usePartnerId();
  const queryClient = useQueryClient();

  const { data: claim, isLoading, error } = useClaim(params.id);

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.claims.detail(partnerId ?? "__no_tenant__", params.id),
    });
  };

  const handleReviewComplete = () => {
    handleRefresh();
    showSuccess("Review submitted", {
      description: "Your review decision has been recorded.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <ClaimDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Claim Detail"
          backHref="/dashboard/vendor/claims"
        />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load claim
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Claim Detail"
          backHref="/dashboard/vendor/claims"
        />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Claim not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The claim you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <ClaimDetail
        claim={claim}
        backPath="/dashboard/vendor/claims"
        isOwnerView={true}
        onRefresh={handleRefresh}
        reviewSlot={
          <ClaimReviewPanel
            claim={claim}
            onReviewComplete={handleReviewComplete}
          />
        }
      />
    </div>
  );
}
