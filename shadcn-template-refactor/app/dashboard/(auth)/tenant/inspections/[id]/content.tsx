// =============================================================================
// Tenant Inspection Detail — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { useInspection } from "@/modules/inspection/hooks";
import {
  InspectionDetail,
  InspectionDetailSkeleton,
} from "@/modules/inspection/components/inspection-detail";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenantInspectionDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: inspection, isLoading, error } = useInspection(params.id);

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
          backHref="/dashboard/tenant/inspections"
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
          backHref="/dashboard/tenant/inspections"
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <InspectionDetail
        inspection={inspection}
        backPath="/dashboard/tenant/inspections"
        isOwnerView={false}
      />
    </div>
  );
}
