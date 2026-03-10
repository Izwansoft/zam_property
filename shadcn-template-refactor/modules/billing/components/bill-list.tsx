// =============================================================================
// BillList â€” List component with filter tabs for billing views
// =============================================================================

"use client";

import { useMemo } from "react";
import { Receipt, FileText } from "lucide-react";

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

import type { Billing, BillingFilterTab } from "../types";
import { BILLING_FILTER_TABS } from "../types";
import { BillCard, BillCardSkeleton } from "./bill-card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillListProps {
  bills: Billing[];
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
  /** Optional tab counts (server-computed) */
  counts?: Record<string, number>;
  /** Custom filter tabs (defaults to BILLING_FILTER_TABS) */
  filterTabs?: BillingFilterTab[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillList({
  bills,
  isLoading = false,
  activeFilter,
  onFilterChange,
  pagination,
  onPageChange,
  basePath = "/dashboard/tenant/bills",
  counts,
  filterTabs = BILLING_FILTER_TABS,
}: BillListProps) {
  // Client-side filtering for immediate tab switching
  const filteredBills = useMemo(() => {
    const tab = filterTabs.find((t) => t.value === activeFilter);
    if (!tab?.statuses) return bills;
    return bills.filter((b) => tab.statuses!.includes(b.status));
  }, [bills, activeFilter, filterTabs]);

  // Calculate tab counts from data if not provided
  const tabCounts = useMemo(() => {
    if (counts) return counts;
    const result: Record<string, number> = { all: bills.length };
    filterTabs.forEach((tab) => {
      if (tab.statuses) {
        result[tab.value] = bills.filter((b) =>
          tab.statuses!.includes(b.status)
        ).length;
      }
    });
    return result;
  }, [bills, counts, filterTabs]);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={onFilterChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {filterTabs.map((tab) => (
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
            <BillCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBills.length === 0 && (
        <EmptyState
          icon={activeFilter === "all" ? Receipt : FileText}
          title={
            activeFilter === "all"
              ? "No bills yet"
              : `No ${filterTabs.find((t) => t.value === activeFilter)?.label.toLowerCase()} bills`
          }
          description={
            activeFilter === "all"
              ? "You don't have any bills at the moment. Bills will appear here once your tenancy is active."
              : "No bills match the selected filter."
          }
          action={
            activeFilter !== "all"
              ? {
                  label: "View all bills",
                  onClick: () => onFilterChange("all"),
                }
              : undefined
          }
        />
      )}

      {/* Bill Cards */}
      {!isLoading && filteredBills.length > 0 && (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <BillCard key={bill.id} bill={bill} basePath={basePath} />
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

