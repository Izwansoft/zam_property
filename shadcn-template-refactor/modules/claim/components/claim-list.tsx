// =============================================================================
// ClaimList â€” List component with filter tabs and pagination
// =============================================================================

"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";

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

import type { Claim, ClaimFilterTab } from "../types";
import { CLAIM_FILTER_TABS } from "../types";
import { ClaimCard, ClaimCardSkeleton } from "./claim-card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClaimListProps {
  claims: Claim[];
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
  /** Custom filter tabs (defaults to CLAIM_FILTER_TABS) */
  filterTabs?: ClaimFilterTab[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClaimList({
  claims,
  isLoading = false,
  activeFilter,
  onFilterChange,
  pagination,
  onPageChange,
  basePath = "/dashboard/tenant/claims",
  counts,
  filterTabs = CLAIM_FILTER_TABS,
}: ClaimListProps) {
  // Client-side filtering for immediate tab switching
  const filteredClaims = useMemo(() => {
    const tab = filterTabs.find((t) => t.value === activeFilter);
    if (!tab?.statuses) return claims;
    return claims.filter((c) => tab.statuses!.includes(c.status));
  }, [claims, activeFilter, filterTabs]);

  // Calculate tab counts from data if not provided
  const tabCounts = useMemo(() => {
    if (counts) return counts;
    const result: Record<string, number> = { all: claims.length };
    filterTabs.forEach((tab) => {
      if (tab.statuses) {
        result[tab.value] = claims.filter((c) =>
          tab.statuses!.includes(c.status)
        ).length;
      }
    });
    return result;
  }, [claims, counts, filterTabs]);

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
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tabCounts[tab.value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ClaimCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredClaims.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No claims"
          description={
            activeFilter === "all"
              ? "No claims have been submitted yet."
              : `No ${activeFilter} claims found.`
          }
        />
      )}

      {/* Claim Cards */}
      {!isLoading && filteredClaims.length > 0 && (
        <div className="space-y-3">
          {filteredClaims.map((claim) => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page > 1)
                      onPageChange?.(pagination.page - 1);
                  }}
                  aria-disabled={pagination.page <= 1}
                  className={
                    pagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({
                length: Math.min(pagination.totalPages, 5),
              }).map((_, i) => {
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
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page < pagination.totalPages)
                      onPageChange?.(pagination.page + 1);
                  }}
                  aria-disabled={pagination.page >= pagination.totalPages}
                  className={
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

