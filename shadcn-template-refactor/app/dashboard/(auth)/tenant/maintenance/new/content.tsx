// =============================================================================
// New Maintenance Request Content — Client Component
// =============================================================================

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { MaintenanceRequestForm } from "@/modules/maintenance";
import { useTenancies } from "@/modules/tenancy/hooks/useTenancies";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewMaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenancyId = searchParams.get("tenancyId") || undefined;

  // Fetch active tenancies for the form
  const { data: tenanciesData, isLoading } = useTenancies({
    status: "ACTIVE" as never,
  });

  const handleSuccess = (ticketId: string) => {
    router.push(`/dashboard/tenant/maintenance/${ticketId}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New Maintenance Request"
        description="Describe the issue and upload photos"
        icon={Wrench}
        backHref="/dashboard/tenant/maintenance"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">
            Loading tenancy info...
          </div>
        </div>
      ) : (
        <MaintenanceRequestForm
          tenancyId={tenancyId}
          tenancies={tenanciesData?.items || []}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
