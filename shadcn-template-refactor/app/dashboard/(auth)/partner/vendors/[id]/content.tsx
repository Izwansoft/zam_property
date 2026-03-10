// =============================================================================
// Partner Vendor Detail — Client content component (moderation view)
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { useVendor } from "@/modules/vendor/hooks/use-vendor";
import {
  VendorDetailView,
  VendorDetailSkeleton,
} from "@/modules/vendor/components/vendor-detail";

export function PartnerVendorDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: vendor, isLoading, error } = useVendor(params.id);

  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          Failed to load vendor
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Vendor not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The vendor you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <VendorDetailView
      vendor={vendor}
      portal="partner"
      basePath="/dashboard/partner/vendors"
    />
  );
}
