// =============================================================================
// Tenant Maintenance Content — Client Component (List + Create)
// =============================================================================

"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Wrench, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useMaintenanceTickets,
  MaintenanceList,
  MaintenanceRequestForm,
  getStatusesForMaintenanceFilter,
} from "@/modules/maintenance";
import type { MaintenanceFilters } from "@/modules/maintenance";
import { useTenancies } from "@/modules/tenancy/hooks/useTenancies";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dialog state for creating new request
  const [showCreateDialog, setShowCreateDialog] = useState(
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
  const buildFilters = (): MaintenanceFilters => {
    const filters: MaintenanceFilters = { page, pageSize: 10 };
    const statuses = getStatusesForMaintenanceFilter(activeFilter);
    if (statuses) {
      filters.status = statuses;
    }
    return filters;
  };

  // Fetch maintenance tickets
  const { data, isLoading, error } = useMaintenanceTickets(buildFilters());

  // Fetch tenancies for the create form
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

  // Handle create success
  const handleCreateSuccess = (ticketId: string) => {
    setShowCreateDialog(false);
    router.push(`/dashboard/tenant/maintenance/${ticketId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Maintenance"
        description="Submit and track maintenance requests"
        icon={Wrench}
        actions={[
          {
            label: "New Request",
            onClick: () => setShowCreateDialog(true),
            icon: Plus,
          },
        ]}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to load maintenance requests</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {/* Maintenance List */}
      <MaintenanceList
        tickets={data?.items || []}
        isLoading={isLoading}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
      />

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              New Maintenance Request
            </DialogTitle>
          </DialogHeader>
          <MaintenanceRequestForm
            tenancies={tenanciesData?.items || []}
            onSuccess={handleCreateSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
