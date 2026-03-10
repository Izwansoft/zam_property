// =============================================================================
// Vendor Claims Content — Client Component (Owner list + create)
// =============================================================================

"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useClaims,
  ClaimList,
  ClaimSubmissionForm,
  getStatusesForClaimFilter,
} from "@/modules/claim";
import type { ClaimFilters } from "@/modules/claim";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorClaimsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dialog state for creating
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Read filter & page from URL
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Build API filters
  const buildFilters = (): ClaimFilters => {
    const filters: ClaimFilters = { page, pageSize: 10 };
    const statuses = getStatusesForClaimFilter(activeFilter);
    if (statuses && statuses.length === 1) {
      filters.status = statuses[0];
    }
    return filters;
  };

  // Fetch claims
  const { data, isLoading, error } = useClaims(buildFilters());

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

  // After successful creation
  const handleCreateSuccess = (claim: { id: string }) => {
    setShowCreateDialog(false);
    router.push(`/dashboard/vendor/claims/${claim.id}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Claims"
        description="Review and manage property claims across your properties"
        icon={FileText}
        actions={[
          {
            label: "Submit Claim",
            icon: Plus,
            onClick: () => setShowCreateDialog(true),
          },
        ]}
      />

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message || "Failed to load claims"}
        </div>
      )}

      {/* Claim List */}
      <ClaimList
        claims={data?.items ?? []}
        isLoading={isLoading}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        pagination={data?.pagination}
        onPageChange={handlePageChange}
        basePath="/dashboard/vendor/claims"
      />

      {/* Create Dialog (Owner can also submit claims) */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit a Claim</DialogTitle>
          </DialogHeader>
          <ClaimSubmissionForm
            submittedRole="OWNER"
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
            className="border-0 shadow-none"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
