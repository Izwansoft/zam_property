// =============================================================================
// Vendor Inbox Detail — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { useInteractionDetail } from "@/modules/interaction/hooks/use-interaction-detail";
import {
  InteractionDetailView,
  InteractionDetailSkeleton,
} from "@/modules/interaction/components/interaction-detail";

export function VendorInboxDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: interaction, isLoading, error } = useInteractionDetail(params.id);

  if (isLoading) {
    return <InteractionDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          Failed to load interaction
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Interaction not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The interaction you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <InteractionDetailView
      interaction={interaction}
      basePath="/dashboard/vendor/inbox"
    />
  );
}
