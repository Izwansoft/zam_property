// =============================================================================
// Vendor Inspection Detail — Client content (Owner review view)
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/page-header";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import { useInspection } from "@/modules/inspection/hooks";
import {
  InspectionDetail,
  InspectionDetailSkeleton,
} from "@/modules/inspection/components/inspection-detail";
import { VideoReviewPanel } from "@/modules/inspection/components/video-review-panel";
import { useRequestVideo } from "@/modules/inspection/hooks";
import { InspectionStatus } from "@/modules/inspection/types";
import { queryKeys } from "@/lib/query";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { Button } from "@/components/ui/button";
import { Video, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorInspectionDetailContent() {
  const params = useParams<{ id: string }>();
  const partnerId = usePartnerId();
  const queryClient = useQueryClient();

  const { data: inspection, isLoading, error } = useInspection(params.id);
  const requestVideoMutation = useRequestVideo(params.id);

  const handleRequestVideo = async () => {
    try {
      await requestVideoMutation.mutateAsync({});
      showSuccess("Video requested", {
        description:
          "The tenant has been notified to submit a video inspection.",
      });
    } catch {
      showError("Request failed", {
        description: "Unable to request video inspection. Please try again.",
      });
    }
  };

  const handleReviewComplete = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.inspections.detail(
        partnerId ?? "__no_tenant__",
        params.id
      ),
    });
    showSuccess("Review submitted", {
      description: "Your review has been recorded.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <InspectionDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Inspection Detail"
          backHref="/dashboard/vendor/inspections"
        />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load inspection
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Inspection Detail"
          backHref="/dashboard/vendor/inspections"
        />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Inspection not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The inspection you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
        </div>
      </div>
    );
  }

  // Show "Request Video" button if inspection is SCHEDULED
  const canRequestVideo =
    inspection.status === InspectionStatus.SCHEDULED &&
    !inspection.videoRequested;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Request Video action for SCHEDULED inspections */}
      {canRequestVideo && (
        <div className="flex justify-end">
          <Button
            onClick={handleRequestVideo}
            disabled={requestVideoMutation.isPending}
            className="gap-2"
          >
            {requestVideoMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            Request Video Inspection
          </Button>
        </div>
      )}

      <InspectionDetail
        inspection={inspection}
        backPath="/dashboard/vendor/inspections"
        isOwnerView
      />

      {/* Video Review Panel — owner action */}
      {inspection.videoRequested && (
        <VideoReviewPanel
          inspection={inspection}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </div>
  );
}
