// =============================================================================
// CommissionList — Card list with filters and pagination
// =============================================================================
// Displays commissions in a card list with status/type filters, search,
// and pagination. Used in both agent portal and company portal views.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  WalletIcon,
  ArrowRight,
  Calendar,
  Building2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  Commission,
  CommissionFilters,
  CommissionStatus,
  CommissionType,
} from "../types";
import {
  DEFAULT_COMMISSION_FILTERS,
  COMMISSION_STATUS_CONFIG,
  COMMISSION_TYPE_CONFIG,
  formatCommissionAmount,
  getCommissionTypeLabel,
} from "../types";
import { useCommissions, useAgentCommissions } from "../hooks/useCommissions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommissionListProps {
  /** If provided, fetches commissions for this agent only */
  agentId?: string;
  /** Base path for commission detail links */
  basePath?: string;
  /** Title override */
  title?: string;
  /** Description override */
  description?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommissionList({
  agentId,
  basePath = "/dashboard/agent/commissions",
  title = "Commissions",
  description = "Track your commission earnings and payment status.",
}: CommissionListProps) {
  const [filters, setFilters] = useState<CommissionFilters>({
    ...DEFAULT_COMMISSION_FILTERS,
  });

  // Use agent-specific or global commissions hook
  const agentQuery = useAgentCommissions(agentId ?? "", filters);
  const globalQuery = useCommissions(filters);

  const { data, isLoading } = agentId ? agentQuery : globalQuery;

  const commissions = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status === "ALL" ? undefined : (status as CommissionStatus),
      page: 1,
    }));
  };

  const handleTypeChange = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      type: type === "ALL" ? undefined : (type as CommissionType),
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <Select
            value={filters.status ?? "ALL"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              {Object.entries(COMMISSION_STATUS_CONFIG).map(
                ([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select
            value={filters.type ?? "ALL"}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.entries(COMMISSION_TYPE_CONFIG).map(
                ([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">
          {pagination.total} commission{pagination.total !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Commission Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CommissionCardSkeleton key={i} />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {commissions.map((commission) => (
            <CommissionCard
              key={commission.id}
              commission={commission}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
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
// Commission Card
// ---------------------------------------------------------------------------

function CommissionCard({
  commission,
  basePath,
}: {
  commission: Commission;
  basePath: string;
}) {
  const statusConfig = COMMISSION_STATUS_CONFIG[commission.status];
  const listingTitle =
    commission.tenancy?.listing?.title ?? "Unknown Listing";
  const createdDate = new Date(commission.createdAt).toLocaleDateString(
    "en-MY",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <WalletIcon className="size-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{listingTitle}</p>
            <Badge variant={statusConfig.variant} className="shrink-0">
              {statusConfig.label}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {createdDate}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="size-3" />
              {getCommissionTypeLabel(commission.type)}
            </span>
            <span>Rate: {(commission.rate * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Amount + Link */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold">
            {formatCommissionAmount(commission.amount)}
          </span>
          <Button variant="ghost" size="icon" asChild>
            <Link href={`${basePath}/${commission.id}`}>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
      <WalletIcon className="size-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">No commissions found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Commission records will appear here when tenancy deals are completed.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function CommissionCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="size-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  );
}

export function CommissionListSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CommissionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

