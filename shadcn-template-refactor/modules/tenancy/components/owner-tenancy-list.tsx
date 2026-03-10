// =============================================================================
// OwnerTenancyList — List component for owner's tenancies with grouping
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Building2,
  Home,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { OwnerTenancyCard, OwnerTenancyCardSkeleton } from "./owner-tenancy-card";
import { TenancyStatus, TENANCY_STATUS_CONFIG, type Tenancy } from "../types";
import {
  useOwnerTenancies,
  groupTenanciesByProperty,
  type OwnerTenancyFilters,
} from "../hooks/useOwnerTenancies";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "list" | "grouped";
type StatusFilter = "all" | TenancyStatus;

interface OwnerTenancyListProps {
  /** Initial view mode */
  defaultViewMode?: ViewMode;
  /** Initial status filter */
  defaultStatus?: StatusFilter;
  /** Base path for detail links */
  basePath?: string;
  /** Show stats summary card */
  showSummary?: boolean;
}

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Tenancies" },
  { value: TenancyStatus.PENDING_BOOKING, label: "Pending Booking" },
  { value: TenancyStatus.PENDING_CONTRACT, label: "Pending Contract" },
  { value: TenancyStatus.PENDING_SIGNATURES, label: "Pending Signatures" },
  { value: TenancyStatus.APPROVED, label: "Approved" },
  { value: TenancyStatus.ACTIVE, label: "Active" },
  { value: TenancyStatus.OVERDUE, label: "Overdue" },
  { value: TenancyStatus.TERMINATION_REQUESTED, label: "Termination Requested" },
  { value: TenancyStatus.TERMINATING, label: "Terminating" },
  { value: TenancyStatus.TERMINATED, label: "Terminated" },
  { value: TenancyStatus.CANCELLED, label: "Cancelled" },
];

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

function TenancySummaryCard({
  tenancies,
  isLoading,
}: {
  tenancies?: Tenancy[];
  isLoading: boolean;
}) {
  const stats = useMemo(() => {
    if (!tenancies) return null;

    const active = tenancies.filter((t) => t.status === TenancyStatus.ACTIVE).length;
    const pending = tenancies.filter((t) =>
      [
        TenancyStatus.PENDING_BOOKING,
        TenancyStatus.PENDING_CONTRACT,
        TenancyStatus.PENDING_SIGNATURES,
      ].includes(t.status)
    ).length;
    const overdue = tenancies.filter((t) => t.status === TenancyStatus.OVERDUE).length;
    const totalRevenue = tenancies
      .filter((t) => t.status === TenancyStatus.ACTIVE)
      .reduce((sum, t) => sum + t.monthlyRent, 0);

    return { active, pending, overdue, totalRevenue, total: tenancies.length };
  }, [tenancies]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Tenancies
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active
          </CardTitle>
          <Badge variant="default" className="bg-green-100 text-green-800">
            {stats.active}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending
          </CardTitle>
          <Badge variant="secondary">{stats.pending}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          {stats.overdue > 0 && (
            <p className="text-xs text-destructive mt-1">
              {stats.overdue} overdue
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat("en-MY", {
              style: "currency",
              currency: "MYR",
              minimumFractionDigits: 0,
            }).format(stats.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">from active tenancies</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property Group Card (for grouped view)
// ---------------------------------------------------------------------------

function PropertyGroupCard({
  propertyId,
  propertyTitle,
  propertyAddress,
  thumbnailUrl,
  tenancies,
  basePath,
  onActionComplete,
}: {
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  thumbnailUrl?: string;
  tenancies: Tenancy[];
  basePath: string;
  onActionComplete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const activeCount = tenancies.filter((t) => t.status === TenancyStatus.ACTIVE).length;
  const pendingCount = tenancies.filter((t) =>
    [
      TenancyStatus.PENDING_BOOKING,
      TenancyStatus.PENDING_CONTRACT,
      TenancyStatus.PENDING_SIGNATURES,
    ].includes(t.status)
  ).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              {/* Property thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={propertyTitle}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Home className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Property info */}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{propertyTitle}</CardTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {propertyAddress}
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {activeCount} Active
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge variant="secondary">{pendingCount} Pending</Badge>
                )}
                <Badge variant="outline">{tenancies.length} Total</Badge>
              </div>

              {/* Expand/collapse icon */}
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {tenancies.map((tenancy) => (
              <OwnerTenancyCard
                key={tenancy.id}
                tenancy={tenancy}
                basePath={basePath}
                onActionComplete={onActionComplete}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OwnerTenancyList({
  defaultViewMode = "list",
  defaultStatus = "all",
  basePath = "/dashboard/vendor/tenancies",
  showSummary = true,
}: OwnerTenancyListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(defaultStatus);

  // Build filters
  const filters: OwnerTenancyFilters = useMemo(() => {
    const f: OwnerTenancyFilters = {};
    if (statusFilter !== "all") {
      f.status = statusFilter;
    }
    return f;
  }, [statusFilter]);

  const { data, isLoading, error, refetch, isFetching } = useOwnerTenancies(filters);

  // Group tenancies by property for grouped view
  const groupedTenancies = useMemo(() => {
    if (!data?.items) return [];
    return groupTenanciesByProperty(data.items);
  }, [data?.items]);

  const handleActionComplete = () => {
    refetch();
  };

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Failed to load tenancies</p>
        <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {showSummary && (
        <TenancySummaryCard tenancies={data?.items} isLoading={isLoading} />
      )}

      {/* Filters toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>

          {/* View mode toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grouped" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grouped")}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <OwnerTenancyCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold">No tenancies found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter !== "all"
              ? `No tenancies with status "${TENANCY_STATUS_CONFIG[statusFilter]?.label || statusFilter}"`
              : "You don't have any tenancies across your properties yet."}
          </p>
          {statusFilter !== "all" && (
            <Button
              variant="outline"
              onClick={() => setStatusFilter("all")}
              className="mt-4"
            >
              Show all tenancies
            </Button>
          )}
        </Card>
      ) : viewMode === "grouped" ? (
        // Grouped by property view
        <div className="space-y-6">
          {groupedTenancies.map((group) => (
            <PropertyGroupCard
              key={group.propertyId}
              {...group}
              basePath={basePath}
              onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      ) : (
        // List view
        <div className="space-y-4">
          {data.items.map((tenancy) => (
            <OwnerTenancyCard
              key={tenancy.id}
              tenancy={tenancy}
              basePath={basePath}
              onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {data.items.length} of {data.pagination.total} tenancies
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function OwnerTenancyListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-50" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <OwnerTenancyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

