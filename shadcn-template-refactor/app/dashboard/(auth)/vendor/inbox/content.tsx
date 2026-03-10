// =============================================================================
// Vendor Inbox — Client content component
// =============================================================================

"use client";

import { useState, useCallback } from "react";

import { PageHeader } from "@/components/common/page-header";
import { useInteractions } from "@/modules/interaction/hooks/use-interactions";
import { InteractionList } from "@/modules/interaction/components/interaction-list";
import type { InteractionFilters } from "@/modules/interaction/types";
import { DEFAULT_INTERACTION_FILTERS } from "@/modules/interaction/types";

export function VendorInboxContent() {
  const [filters, setFilters] =
    useState<InteractionFilters>(DEFAULT_INTERACTION_FILTERS);

  const { data, isLoading, error } = useInteractions(filters);

  const handleFiltersChange = useCallback((newFilters: InteractionFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="View and respond to leads, enquiries, and booking requests."
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load interactions. Please try again.
        </div>
      )}

      <InteractionList
        interactions={data?.items ?? []}
        pagination={
          data?.pagination ?? {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
          }
        }
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isLoading={isLoading}
        basePath="/dashboard/vendor/inbox"
      />
    </div>
  );
}
