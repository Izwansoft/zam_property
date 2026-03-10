// =============================================================================
// Platform Partner Settings — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";
import { PartnerDetailHeader } from "@/modules/partner/components/partner-detail";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";
import {
  PartnerSettingsForm,
  PartnerSettingsFormSkeleton,
} from "@/modules/partner/components/partner-settings-form";

export function PlatformPartnerSettingsContent() {
  const params = useParams<{ id: string }>();
  const { data: partner, isLoading, error } = usePartnerDetail(params.id);

  if (isLoading) {
    return <PartnerSettingsFormSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          Failed to load Partner
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Partner not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The Partner you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PartnerDetailHeader
        partner={partner}
        basePath="/dashboard/platform/partners"
      />

      <PartnerDetailTabs partnerId={params.id} />

      <PartnerSettingsForm
        partner={partner}
        basePath="/dashboard/platform/partners"
        hideHeader
      />
    </div>
  );
}
