"use client";

import { useParams } from "next/navigation";

import { useListing } from "@/modules/listing/hooks/use-listing";
import { ListingDetailSkeleton, ListingDetailView } from "@/modules/listing/components/listing-detail";

export function AgentListingDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: listing, isLoading, error } = useListing(params.id);

  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">Failed to load listing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Listing not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The listing you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <ListingDetailView
      listing={listing}
      portal="agent"
      basePath="/dashboard/agent/listings"
    />
  );
}
