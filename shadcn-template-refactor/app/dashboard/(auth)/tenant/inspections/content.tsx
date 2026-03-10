// =============================================================================
// Tenant Inspections Content — Client Component (List + Schedule)
// =============================================================================

"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ClipboardCheck, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useInspections,
  InspectionList,
  InspectionScheduler,
  getStatusesForInspectionFilter,
} from "@/modules/inspection";
import type { InspectionFilters } from "@/modules/inspection";
import { useTenancies } from "@/modules/tenancy/hooks/useTenancies";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InspectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dialog state for scheduling
  const [showScheduleDialog, setShowScheduleDialog] = useState(
    searchParams.get("action") === "new"
  );

  // Read filter & page from URL
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Build API filters based on active tab
  const buildFilters = (): InspectionFilters => {
    const filters: InspectionFilters = { page, pageSize: 10 };
    const statuses = getStatusesForInspectionFilter(activeFilter);
    if (statuses) {
      filters.status = statuses;
    }
    return filters;
  };

  // Fetch inspections
  const { data, isLoading, error } = useInspections(buildFilters());

  // Fetch tenancies for the schedule form
  const { data: tenanciesData } = useTenancies({ status: "ACTIVE" as never });

  // Update URL when filter changes
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    const query = params.toString();
    router.replace(query ? `?${query}` : ".", { scroll: false });
  };

  // Update page
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Handle schedule success
  const handleScheduleSuccess = (inspectionId: string) => {
    setShowScheduleDialog(false);
    router.push(`/dashboard/tenant/inspections/${inspectionId}`);
  };

  // Get first active tenancy ID for scheduling
  const firstTenancyId = tenanciesData?.items?.[0]?.id ?? "";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Inspections"
        description="Schedule and track property inspections"
        icon={ClipboardCheck}
        actions={[
          {
            label: "Schedule Inspection",
            onClick: () => setShowScheduleDialog(true),
            icon: Plus,
          },
        ]}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load inspections</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Inspection List */}
      <InspectionList
        inspections={data?.items || []}
        isLoading={isLoading}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
      />

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Schedule Inspection
            </DialogTitle>
          </DialogHeader>
          <InspectionScheduler
            tenancyId={firstTenancyId}
            tenancies={tenanciesData?.items}
            onSuccess={handleScheduleSuccess}
            onCancel={() => setShowScheduleDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
