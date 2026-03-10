// =============================================================================
// Vendor Tenancy Detail — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { useTenancy } from "@/modules/tenancy/hooks";
import { useTenancyBreadcrumbOverrides } from "@/modules/tenancy/components/tenancy-breadcrumb";
import {
  TenancyDetailView,
  TenancyDetailSkeleton,
} from "@/modules/tenancy/components/tenancy-detail";
import { OwnerTenancyActions } from "@/modules/tenancy/components/owner-tenancy-actions";
import { PartnerScreeningPanel } from "@/modules/tenancy/components/tenant-screening-panel";
import { HandoverChecklist } from "@/modules/tenancy/components/handover-checklist";

export function VendorTenancyDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: tenancy, isLoading, error } = useTenancy(params.id);
  const breadcrumbOverrides = useTenancyBreadcrumbOverrides(params.id);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader title="Tenancy" loading />
        <TenancyDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Tenancy"
          backHref="/dashboard/vendor/tenancies"
        />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load tenancy
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Tenancy"
          backHref="/dashboard/vendor/tenancies"
        />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Tenancy not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The tenancy you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page header with breadcrumbs and owner actions */}
      <PageHeader
        title={tenancy.property?.title ?? "Tenancy Detail"}
        description={tenancy.property?.address}
        backHref="/dashboard/vendor/tenancies"
        breadcrumbOverrides={breadcrumbOverrides}
        actions={[]}
      />

      {/* Owner actions */}
      <div className="flex justify-end">
        <OwnerTenancyActions
          tenancy={tenancy}
          basePath="/dashboard/vendor/tenancies"
          onActionComplete={() => {
            // Refetch tenancy data after action
          }}
        />
      </div>

      {/* Partner screening panel (shown during booking review) */}
      <PartnerScreeningPanel tenancy={tenancy} />

      {/* Handover checklist (shown when approved, before activation) */}
      <HandoverChecklist
        tenancy={tenancy}
        onComplete={() => {
          // Refetch after handover complete
        }}
      />

      {/* Main tenancy detail view */}
      <TenancyDetailView
        tenancy={tenancy}
        basePath="/dashboard/vendor/tenancies"
        showActions={false}
      />
    </div>
  );
}
