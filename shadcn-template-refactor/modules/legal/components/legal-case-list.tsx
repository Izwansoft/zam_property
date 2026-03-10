// =============================================================================
// LegalCaseList — List component with filter tabs, cards, and pagination
// =============================================================================

"use client";

import { useMemo } from "react";
import { Scale, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import type { LegalCase, LegalCaseFilterTab } from "../types";
import {
  LEGAL_CASE_STATUS_CONFIG,
  LEGAL_CASE_REASON_CONFIG,
  LEGAL_CASE_FILTER_TABS,
  LegalCaseReason,
  formatLegalAmount,
  isCourtPhase,
} from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LegalCaseListProps {
  cases: LegalCase[];
  isLoading?: boolean;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  basePath?: string;
  counts?: Record<string, number>;
  filterTabs?: LegalCaseFilterTab[];
}

// ---------------------------------------------------------------------------
// LegalCaseCard
// ---------------------------------------------------------------------------

function LegalCaseCard({
  legalCase,
  basePath,
}: {
  legalCase: LegalCase;
  basePath: string;
}) {
  const statusConfig = LEGAL_CASE_STATUS_CONFIG[legalCase.status];
  const reasonConfig =
    LEGAL_CASE_REASON_CONFIG[legalCase.reason as LegalCaseReason];
  const StatusIcon = statusConfig?.icon ?? Scale;
  const ReasonIcon = reasonConfig?.icon ?? Scale;
  const inCourt = isCourtPhase(legalCase.status);

  return (
    <Link href={`${basePath}/${legalCase.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Icon + Info */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  inCourt
                    ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <StatusIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {legalCase.caseNumber}
                  </span>
                  <Badge variant={statusConfig?.variant ?? "default"} className="shrink-0 text-[10px]">
                    {statusConfig?.label ?? legalCase.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {legalCase.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ReasonIcon className="h-3 w-3" />
                    {reasonConfig?.label ?? legalCase.reason}
                  </span>
                  {legalCase.tenancy?.listing && (
                    <span className="truncate max-w-50">
                      {legalCase.tenancy.listing.title}
                    </span>
                  )}
                  {legalCase.lawyer && (
                    <span className="truncate max-w-[150px]">
                      Lawyer: {legalCase.lawyer.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Amount + Date */}
            <div className="shrink-0 text-right">
              <span className="text-sm font-semibold text-destructive">
                {formatLegalAmount(legalCase.amountOwed)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(legalCase.createdAt).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              {legalCase.courtDate && (
                <p className="text-xs text-destructive mt-0.5">
                  Court: {new Date(legalCase.courtDate).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function LegalCaseCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-3/4" />
              <div className="flex gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LegalCaseListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LegalCaseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LegalCaseList({
  cases,
  isLoading = false,
  activeFilter,
  onFilterChange,
  pagination,
  onPageChange,
  basePath = "/dashboard/vendor/legal",
  counts,
  filterTabs = LEGAL_CASE_FILTER_TABS,
}: LegalCaseListProps) {
  // Client-side filtering for immediate tab switching
  const filteredCases = useMemo(() => {
    const tab = filterTabs.find((t) => t.value === activeFilter);
    if (!tab?.statuses) return cases;
    return cases.filter((c) => tab.statuses!.includes(c.status));
  }, [cases, activeFilter, filterTabs]);

  // Calculate tab counts from data if not provided
  const tabCounts = useMemo(() => {
    if (counts) return counts;
    const result: Record<string, number> = { all: cases.length };
    filterTabs.forEach((tab) => {
      if (tab.statuses) {
        result[tab.value] = cases.filter((c) =>
          tab.statuses!.includes(c.status)
        ).length;
      }
    });
    return result;
  }, [cases, counts, filterTabs]);

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
          {Array.from({ length: 5 }).map((_, i) => (
            <LegalCaseCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCases.length === 0 && (
        <EmptyState
          icon={Scale}
          title="No legal cases"
          description={
            activeFilter === "all"
              ? "No legal cases have been created yet."
              : `No cases match the "${
                  filterTabs.find((t) => t.value === activeFilter)?.label ?? activeFilter
                }" filter.`
          }
        />
      )}

      {/* Case Cards */}
      {!isLoading && filteredCases.length > 0 && (
        <div className="space-y-3">
          {filteredCases.map((legalCase) => (
            <LegalCaseCard
              key={legalCase.id}
              legalCase={legalCase}
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
                    if (pagination.page > 1) onPageChange?.(pagination.page - 1);
                  }}
                  aria-disabled={pagination.page <= 1}
                  className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
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
                      isActive={pageNum === pagination.page}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange?.(pageNum);
                      }}
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
                    if (pagination.page < pagination.totalPages) onPageChange?.(pagination.page + 1);
                  }}
                  aria-disabled={pagination.page >= pagination.totalPages}
                  className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}


