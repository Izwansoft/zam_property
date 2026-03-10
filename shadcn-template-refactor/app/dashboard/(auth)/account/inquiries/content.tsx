// =============================================================================
// My Inquiries — Client content component
// =============================================================================

"use client";

import { useState, useCallback } from "react";

import { PageHeader } from "@/components/common/page-header";
import { useInquiries } from "@/modules/account/hooks/use-inquiries";
import { InquiryList } from "@/modules/account/components/inquiry-list";
import type { InquiryFilters } from "@/modules/account/types";
import { DEFAULT_INQUIRY_FILTERS } from "@/modules/account/types";

export function InquiriesContent() {
  const [filters, setFilters] =
    useState<InquiryFilters>(DEFAULT_INQUIRY_FILTERS);

  const { data, isLoading, error } = useInquiries(filters);

  const handleFiltersChange = useCallback((newFilters: InquiryFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Inquiries"
        description="View your sent inquiries and track their status."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "inquiries", label: "My Inquiries" },
        ]}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load inquiries. Please try again.
        </div>
      )}

      <InquiryList
        inquiries={data?.items ?? []}
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
      />
    </div>
  );
}
