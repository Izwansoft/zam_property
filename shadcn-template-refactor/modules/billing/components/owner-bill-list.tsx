// =============================================================================
// OwnerBillList — Owner view of bills with property grouping
// =============================================================================
// Supports filter tabs, property grouping, date range filter, and pagination.
// Session 6.5 implementation.
// =============================================================================

"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Receipt,
  User,
  Search,
  Filter,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

import type {
  Billing,
  OwnerBillingFilters,
  PropertyBillingGroup,
} from "../types";
import {
  BillingStatus,
  OWNER_BILLING_FILTER_TABS,
  getStatusesForBillingFilter,
} from "../types";
import { BillingStatusBadge } from "./billing-status-badge";
import { useOwnerBillings } from "../hooks/useOwnerBillings";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBillingPeriod(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
  });
}

/** Group billings by property (using tenancy reference data) */
function groupByProperty(billings: Billing[]): PropertyBillingGroup[] {
  const groupMap = new Map<string, PropertyBillingGroup>();

  for (const bill of billings) {
    const tenancy = bill.tenancy;
    const listingId = tenancy?.listing?.id || bill.tenancyId;
    const listingTitle =
      tenancy?.listing?.title || `Property (${bill.tenancyId.slice(0, 8)})`;
    const tenantName =
      tenancy?.tenant?.user?.fullName || "Unknown Tenant";
    const tenancyId = bill.tenancyId;

    let group = groupMap.get(listingId);
    if (!group) {
      group = {
        listingId,
        listingTitle,
        tenancyId,
        tenantName,
        billings: [],
        totalDue: 0,
        totalCollected: 0,
        totalOverdue: 0,
      };
      groupMap.set(listingId, group);
    }

    group.billings.push(bill);
    group.totalDue += bill.balanceDue;
    group.totalCollected += bill.paidAmount;
    if (bill.status === BillingStatus.OVERDUE) {
      group.totalOverdue += bill.balanceDue;
    }
  }

  // Sort groups: those with overdue bills first, then alphabetically
  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.totalOverdue > 0 && b.totalOverdue === 0) return -1;
    if (a.totalOverdue === 0 && b.totalOverdue > 0) return 1;
    return a.listingTitle.localeCompare(b.listingTitle);
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OwnerBillListProps {
  /** Base path for bill detail links */
  basePath?: string;
  /** Whether to show property grouping (default: true) */
  showGrouping?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OwnerBillList({
  basePath = "/dashboard/vendor/billing",
  showGrouping = true,
}: OwnerBillListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-driven filter state
  const activeTab = searchParams.get("tab") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const dateFrom = searchParams.get("fromDate") || "";
  const dateTo = searchParams.get("toDate") || "";
  const searchQuery = searchParams.get("q") || "";

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Build filters from URL params
  const filters: OwnerBillingFilters = useMemo(() => {
    const f: OwnerBillingFilters = {
      page: currentPage,
      pageSize: 20,
      sortBy: "billingPeriod",
      sortOrder: "desc",
    };

    // Tab -> status filter
    const statuses = getStatusesForBillingFilter(activeTab);
    if (statuses && statuses.length > 0) {
      f.status = statuses;
    }

    if (dateFrom) f.fromDate = dateFrom;
    if (dateTo) f.toDate = dateTo;

    return f;
  }, [activeTab, currentPage, dateFrom, dateTo]);

  const { data, isLoading, error } = useOwnerBillings(filters);

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
  const hasActiveFilters = dateFrom || dateTo || searchQuery;

  // Group billings by property if enabled
  const propertyGroups = useMemo(() => {
    if (!showGrouping || items.length === 0) return [];
    return groupByProperty(items);
  }, [items, showGrouping]);

  // Filter items by search query locally (bill number or property name)
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (bill) =>
        bill.billNumber.toLowerCase().includes(q) ||
        bill.tenancy?.listing?.title?.toLowerCase().includes(q) ||
        bill.tenancy?.tenant?.user?.fullName?.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Failed to load billing data</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {OWNER_BILLING_FILTER_TABS.map((tab) => (
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
            Filters
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

      {/* Filter Panel */}
      {isFilterOpen && (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Bill number, property..."
                    value={searchQuery}
                    onChange={(e) =>
                      updateParams({
                        q: e.target.value || undefined,
                        page: undefined,
                      })
                    }
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) =>
                    updateParams({
                      fromDate: e.target.value || undefined,
                      page: undefined,
                    })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) =>
                    updateParams({
                      toDate: e.target.value || undefined,
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
      {isLoading && <OwnerBillListSkeleton />}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No bills found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters to see results."
                : "Bills will appear here once generated for your properties."}
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

      {/* Grouped View */}
      {!isLoading && showGrouping && propertyGroups.length > 0 && (
        <div className="space-y-4">
          {propertyGroups.map((group) => (
            <PropertyGroupCard
              key={group.listingId}
              group={group}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {/* Flat View (fallback) */}
      {!isLoading && !showGrouping && filteredItems.length > 0 && (
        <div className="space-y-2">
          {filteredItems.map((bill) => (
            <OwnerBillRow key={bill.id} bill={bill} basePath={basePath} />
          ))}
        </div>
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
            of {pagination.total} bills
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
// Property Group Card
// ---------------------------------------------------------------------------

interface PropertyGroupCardProps {
  group: PropertyBillingGroup;
  basePath: string;
}

function PropertyGroupCard({ group, basePath }: PropertyGroupCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const overdueCount = group.billings.filter(
    (b) => b.status === BillingStatus.OVERDUE
  ).length;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {group.listingTitle}
                    {overdueCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {overdueCount} overdue
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {group.tenantName} · {group.billings.length} bill
                    {group.billings.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Summary amounts */}
                <div className="hidden sm:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p
                      className={`text-sm font-semibold ${
                        group.totalDue > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(group.totalDue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collected</p>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(group.totalCollected)}
                    </p>
                  </div>
                </div>

                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="divide-y">
            {group.billings.map((bill) => (
              <OwnerBillRow key={bill.id} bill={bill} basePath={basePath} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Owner Bill Row
// ---------------------------------------------------------------------------

interface OwnerBillRowProps {
  bill: Billing;
  basePath: string;
}

function OwnerBillRow({ bill, basePath }: OwnerBillRowProps) {
  const isOverdue = bill.status === BillingStatus.OVERDUE;

  return (
    <Link
      href={`/dashboard/tenant/bills/${bill.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
            isOverdue ? "bg-destructive/10" : "bg-muted"
          }`}
        >
          <Receipt
            className={`h-4 w-4 ${
              isOverdue ? "text-destructive" : "text-muted-foreground"
            }`}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium group-hover:text-primary truncate">
              {formatBillingPeriod(bill.billingPeriod)}
            </span>
            <BillingStatusBadge status={bill.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {bill.billNumber} · Due {formatDate(bill.dueDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold">
            {formatCurrency(bill.totalAmount)}
          </p>
          {bill.balanceDue > 0 && bill.balanceDue !== bill.totalAmount && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {formatCurrency(bill.balanceDue)} due
            </p>
          )}
          {bill.balanceDue === 0 && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Fully paid
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function OwnerBillListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden sm:block text-right">
                  <Skeleton className="h-3 w-8 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="hidden sm:block text-right">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <div className="divide-y">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
