// =============================================================================
// TenancyList â€” List component with filters for tenancy views
// =============================================================================

"use client";

import { useMemo } from "react";
import { FileText, Home } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import type { Tenancy, TenancyStatus } from "../types";
import { TenancyCard, TenancyCardSkeleton } from "./tenancy-card";

// ---------------------------------------------------------------------------
// Filter Tabs Configuration
// ---------------------------------------------------------------------------

interface FilterTab {
  value: string;
  label: string;
  statuses?: TenancyStatus[];
}

const FILTER_TABS: FilterTab[] = [
  { value: "all", label: "All" },
  {
    value: "active",
    label: "Active",
    statuses: ["ACTIVE" as TenancyStatus, "APPROVED" as TenancyStatus],
  },
  {
    value: "pending",
    label: "Pending",
    statuses: [
      "PENDING_BOOKING" as TenancyStatus,
      "PENDING_CONTRACT" as TenancyStatus,
      "PENDING_SIGNATURES" as TenancyStatus,
    ],
  },
  {
    value: "overdue",
    label: "Overdue",
    statuses: ["OVERDUE" as TenancyStatus],
  },
  {
    value: "terminated",
    label: "Past",
    statuses: [
      "TERMINATED" as TenancyStatus,
      "CANCELLED" as TenancyStatus,
      "TERMINATING" as TenancyStatus,
      "TERMINATION_REQUESTED" as TenancyStatus,
    ],
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TenancyListProps {
  tenancies: Tenancy[];
  isLoading?: boolean;
  /** Currently selected filter tab */
  activeFilter: string;
  /** Callback when filter tab changes */
  onFilterChange: (filter: string) => void;
  /** Pagination info */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Base path for detail links */
  basePath?: string;
  /** Show counts in tabs (requires all data) */
  counts?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenancyList({
  tenancies,
  isLoading = false,
  activeFilter,
  onFilterChange,
  pagination,
  onPageChange,
  basePath = "/dashboard/tenant/tenancy",
  counts,
}: TenancyListProps) {
  // Filter tenancies based on selected tab (client-side for immediate feedback)
  const filteredTenancies = useMemo(() => {
    const tab = FILTER_TABS.find((t) => t.value === activeFilter);
    if (!tab?.statuses) return tenancies;
    return tenancies.filter((t) => tab.statuses!.includes(t.status));
  }, [tenancies, activeFilter]);

  // Calculate tab counts if not provided
  const tabCounts = useMemo(() => {
    if (counts) return counts;
    const result: Record<string, number> = { all: tenancies.length };
    FILTER_TABS.forEach((tab) => {
      if (tab.statuses) {
        result[tab.value] = tenancies.filter((t) =>
          tab.statuses!.includes(t.status)
        ).length;
      }
    });
    return result;
  }, [tenancies, counts]);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={onFilterChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="min-w-20"
            >
              {tab.label}
              {tabCounts[tab.value] !== undefined && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {tabCounts[tab.value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <TenancyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTenancies.length === 0 && (
        <EmptyState
          icon={activeFilter === "all" ? Home : FileText}
          title={
            activeFilter === "all"
              ? "No tenancies yet"
              : `No ${FILTER_TABS.find((t) => t.value === activeFilter)?.label.toLowerCase()} tenancies`
          }
          description={
            activeFilter === "all"
              ? "You don't have any tenancies at the moment. Browse listings to find your next home."
              : "No tenancies match the selected filter."
          }
          action={
            activeFilter !== "all"
              ? {
                  label: "View all tenancies",
                  onClick: () => onFilterChange("all"),
                }
              : undefined
          }
        />
      )}

      {/* Tenancy Cards */}
      {!isLoading && filteredTenancies.length > 0 && (
        <div className="space-y-4">
          {filteredTenancies.map((tenancy) => (
            <TenancyCard
              key={tenancy.id}
              tenancy={tenancy}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.page > 1) {
                    onPageChange?.(pagination.page - 1);
                  }
                }}
                className={
                  pagination.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }).map(
              (_, i) => {
                // Show pages around current page
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange?.(pageNum);
                      }}
                      isActive={pageNum === pagination.page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.page < pagination.totalPages) {
                    onPageChange?.(pagination.page + 1);
                  }
                }}
                className={
                  pagination.page >= pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export filter tab utility for external use
// ---------------------------------------------------------------------------

export function getStatusesForFilter(
  filterValue: string
): TenancyStatus[] | undefined {
  const tab = FILTER_TABS.find((t) => t.value === filterValue);
  return tab?.statuses;
}

export { FILTER_TABS as TENANCY_FILTER_TABS };

