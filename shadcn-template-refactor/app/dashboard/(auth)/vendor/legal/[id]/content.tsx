// =============================================================================
// Vendor Legal Case Detail — Client content
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { Scale } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { useLegalCase } from "@/modules/legal/hooks";
import {
  LegalCaseDetail,
  LegalCaseDetailSkeleton,
} from "@/modules/legal/components/legal-case-detail";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorLegalDetailContent() {
  const params = useParams<{ id: string }>();
  const { data: legalCase, isLoading, error } = useLegalCase(params.id);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <LegalCaseDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Legal Case Detail"
          icon={Scale}
          backHref="/dashboard/vendor/legal"
        />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load legal case
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!legalCase) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Legal Case Detail"
          icon={Scale}
          backHref="/dashboard/vendor/legal"
        />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Case not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The legal case you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <LegalCaseDetail legalCase={legalCase} />
    </div>
  );
}
