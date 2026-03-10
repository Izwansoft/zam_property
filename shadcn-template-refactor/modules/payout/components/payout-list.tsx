// =============================================================================
// PayoutList — Owner payout history with filters and pagination
// =============================================================================
// Displays payout records with Period, Gross, Fees, Net, Status columns.
// Supports filter tabs, date range filter, and pagination.
// Session 6.6 implementation.
// =============================================================================

"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  CreditCard,
  Filter,
  X,
  Banknote,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import type { Payout, PayoutFilters } from "../types";
import {
  PayoutStatus,
  PAYOUT_FILTER_TABS,
  getStatusesForPayoutFilter,
} from "../types";
import { PayoutStatusBadge } from "./payout-status-badge";
import { usePayouts } from "../hooks/usePayouts";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // If same month, show as "March 2026"
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return startDate.toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
    });
  }

  // Otherwise show range
  return `${startDate.toLocaleDateString("en-MY", {
    month: "short",
    year: "numeric",
  })} – ${endDate.toLocaleDateString("en-MY", {
    month: "short",
    year: "numeric",
  })}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PayoutListProps {
  /** Base path for payout detail links */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayoutList({
  basePath = "/dashboard/vendor/payouts",
}: PayoutListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-driven filter state
  const activeTab = searchParams.get("tab") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const dateFrom = searchParams.get("periodStart") || "";
  const dateTo = searchParams.get("periodEnd") || "";

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Build filters from URL params
  const filters: PayoutFilters = useMemo(() => {
    const f: PayoutFilters = {
      page: currentPage,
      pageSize: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    // Tab -> status filter
    const statuses = getStatusesForPayoutFilter(activeTab);
    if (statuses && statuses.length > 0) {
      f.status = statuses;
    }

    if (dateFrom) f.periodStart = dateFrom;
    if (dateTo) f.periodEnd = dateTo;

    return f;
  }, [activeTab, currentPage, dateFrom, dateTo]);

  const { data, isLoading, error } = usePayouts(filters);

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleTabChange = (tab: string) => {
    updateParams({ tab: tab === "all" ? undefined : tab, page: undefined });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page: page > 1 ? page.toString() : undefined });
  };

  const handleClearFilters = () => {
    router.push(pathname);
    setIsFilterOpen(false);
  };

  const items = data?.items || [];
  const pagination = data?.pagination;
  const hasActiveFilters = !!(dateFrom || dateTo);

  // Summary stats from current page data
  const summaryStats = useMemo(() => {
    if (items.length === 0) return null;
    return {
      totalGross: items.reduce((sum, p) => sum + p.grossRental, 0),
      totalFees: items.reduce((sum, p) => sum + p.platformFee, 0),
      totalNet: items.reduce((sum, p) => sum + p.netPayout, 0),
      completedCount: items.filter(
        (p) => p.status === PayoutStatus.COMPLETED
      ).length,
    };
  }, [items]);

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Failed to load payout data</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats Row */}
      {!isLoading && summaryStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Rental</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Banknote className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryStats.totalGross)}
              </div>
              <p className="text-xs text-muted-foreground">
                {items.length} payout{items.length !== 1 ? "s" : ""} on this page
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                -{formatCurrency(summaryStats.totalFees)}
              </div>
              <p className="text-xs text-muted-foreground">
                Service & management fees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summaryStats.totalNet)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.completedCount} completed payout
                {summaryStats.completedCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {PAYOUT_FILTER_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange(tab.value)}
              className="text-xs"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={hasActiveFilters ? "border-primary" : ""}
          >
            <Filter className="mr-1 h-3.5 w-3.5" />
            Date Range
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                !
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Date Range Filter Panel */}
      {isFilterOpen && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Period From
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) =>
                    updateParams({
                      periodStart: e.target.value || undefined,
                      page: undefined,
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Period To
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) =>
                    updateParams({
                      periodEnd: e.target.value || undefined,
                      page: undefined,
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && <PayoutListSkeleton />}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <CreditCard className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No payouts found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Try adjusting your date range to see results."
                : "Payouts will appear here once they are calculated for your properties."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payout List */}
      {!isLoading && items.length > 0 && (
        <Card>
          {/* Desktop Table Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_120px_32px] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b">
            <span>Period</span>
            <span className="text-right">Gross</span>
            <span className="text-right">Fees</span>
            <span className="text-right">Net</span>
            <span>Status</span>
            <span />
          </div>
          <div className="divide-y">
            {items.map((payout) => (
              <PayoutRow key={payout.id} payout={payout} basePath={basePath} />
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}-
            {Math.min(
              pagination.page * pagination.pageSize,
              pagination.total
            )}{" "}
            of {pagination.total} payouts
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="px-3 text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payout Row
// ---------------------------------------------------------------------------

interface PayoutRowProps {
  payout: Payout;
  basePath: string;
}

function PayoutRow({ payout, basePath }: PayoutRowProps) {
  return (
    <Link
      href={`${basePath}/${payout.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group md:grid md:grid-cols-[1fr_1fr_1fr_1fr_120px_32px] md:gap-4"
    >
      {/* Period */}
      <div className="min-w-0 md:flex md:flex-col md:justify-center">
        <span className="text-sm font-medium group-hover:text-primary truncate">
          {formatPeriod(payout.periodStart, payout.periodEnd)}
        </span>
        <p className="text-xs text-muted-foreground truncate">
          {payout.payoutNumber}
          {payout.processedAt && ` · Paid ${formatDate(payout.processedAt)}`}
        </p>
      </div>

      {/* Gross — visible in desktop table */}
      <div className="hidden md:flex md:flex-col md:items-end md:justify-center">
        <span className="text-sm font-medium">
          {formatCurrency(payout.grossRental)}
        </span>
      </div>

      {/* Fees */}
      <div className="hidden md:flex md:flex-col md:items-end md:justify-center">
        <span className="text-sm text-amber-600 dark:text-amber-400">
          -{formatCurrency(payout.platformFee)}
        </span>
      </div>

      {/* Net */}
      <div className="hidden md:flex md:flex-col md:items-end md:justify-center">
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(payout.netPayout)}
        </span>
      </div>

      {/* Mobile: Amount summary */}
      <div className="flex flex-col items-end md:hidden shrink-0 mr-2">
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(payout.netPayout)}
        </p>
        <p className="text-xs text-muted-foreground">
          of {formatCurrency(payout.grossRental)}
        </p>
      </div>

      {/* Status */}
      <div className="hidden md:flex md:items-center">
        <PayoutStatusBadge status={payout.status} />
      </div>

      {/* Mobile: Status badge inline */}
      <div className="flex items-center gap-2 md:hidden">
        <PayoutStatusBadge status={payout.status} />
      </div>

      {/* Chevron */}
      <div className="hidden md:flex md:items-center md:justify-end">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function PayoutListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List Skeleton */}
      <Card>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
