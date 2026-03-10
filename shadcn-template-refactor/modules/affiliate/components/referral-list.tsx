// =============================================================================
// ReferralList — Full referral list with filters and pagination
// =============================================================================
// Displays all referrals for the current affiliate with status/type filters,
// card-based layout, and pagination controls.
// =============================================================================

"use client";

import { useState } from "react";
import {
  Users,
  Building2,
  UserPlus,
  Briefcase,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  REFERRAL_STATUS_CONFIG,
  REFERRAL_TYPE_CONFIG,
  formatAffiliateAmount,
} from "../types";
import type {
  AffiliateReferral,
  ReferralType,
  ReferralStatus,
  ReferralFilters,
} from "../types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_REFERRALS: AffiliateReferral[] = [
  {
    id: "ref-1",
    affiliateId: "aff-1",
    referralType: "partner_BOOKING",
    referredId: "user-1",
    commissionRate: 0.05,
    commissionAmount: 300,
    status: "CONFIRMED",
    confirmedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    paidAt: null,
    notes: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "ref-2",
    affiliateId: "aff-1",
    referralType: "OWNER_REGISTRATION",
    referredId: "user-2",
    commissionRate: 0.1,
    commissionAmount: 500,
    status: "PENDING",
    confirmedAt: null,
    paidAt: null,
    notes: null,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "ref-3",
    affiliateId: "aff-1",
    referralType: "AGENT_SIGNUP",
    referredId: "user-3",
    commissionRate: 0.03,
    commissionAmount: 125,
    status: "PAID",
    confirmedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    notes: null,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "ref-4",
    affiliateId: "aff-1",
    referralType: "partner_BOOKING",
    referredId: "user-4",
    commissionRate: 0.05,
    commissionAmount: 250,
    status: "PAID",
    confirmedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    notes: null,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: "ref-5",
    affiliateId: "aff-1",
    referralType: "OWNER_REGISTRATION",
    referredId: "user-5",
    commissionRate: 0.1,
    commissionAmount: 0,
    status: "CANCELLED",
    confirmedAt: null,
    paidAt: null,
    notes: "Registration incomplete",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReferralListProps {
  /** Affiliate ID to fetch referrals for */
  affiliateId?: string;
  /** Page title override */
  title?: string;
  /** Page description override */
  description?: string;
}

// ---------------------------------------------------------------------------
// Referral Type Icons
// ---------------------------------------------------------------------------

const REFERRAL_TYPE_ICON: Record<
  ReferralType,
  React.ComponentType<{ className?: string }>
> = {
  OWNER_REGISTRATION: Building2,
  partner_BOOKING: UserPlus,
  AGENT_SIGNUP: Briefcase,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReferralList({
  title = "Referrals",
  description = "View all your referral activity and commissions earned",
}: ReferralListProps) {
  const [isLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | "ALL">(
    "ALL"
  );
  const [typeFilter, setTypeFilter] = useState<ReferralType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // TODO: Replace with useAffiliateReferrals(affiliateId, filters) when integrated
  const allReferrals = MOCK_REFERRALS;

  // Client-side filtering (will be replaced by server-side when hooked up)
  const filteredReferrals = allReferrals.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && r.referralType !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredReferrals.length / pageSize);
  const paginatedReferrals = filteredReferrals.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryStat
          label="Total"
          count={allReferrals.length}
          amount={allReferrals.reduce((s, r) => s + r.commissionAmount, 0)}
          isLoading={isLoading}
        />
        <SummaryStat
          label="Pending"
          count={allReferrals.filter((r) => r.status === "PENDING").length}
          amount={allReferrals
            .filter((r) => r.status === "PENDING")
            .reduce((s, r) => s + r.commissionAmount, 0)}
          isLoading={isLoading}
        />
        <SummaryStat
          label="Confirmed"
          count={allReferrals.filter((r) => r.status === "CONFIRMED").length}
          amount={allReferrals
            .filter((r) => r.status === "CONFIRMED")
            .reduce((s, r) => s + r.commissionAmount, 0)}
          isLoading={isLoading}
        />
        <SummaryStat
          label="Paid"
          count={allReferrals.filter((r) => r.status === "PAID").length}
          amount={allReferrals
            .filter((r) => r.status === "PAID")
            .reduce((s, r) => s + r.commissionAmount, 0)}
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filters:
          </span>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ReferralStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {(Object.keys(REFERRAL_STATUS_CONFIG) as ReferralStatus[]).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {REFERRAL_STATUS_CONFIG[status].label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as ReferralType | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {(Object.keys(REFERRAL_TYPE_CONFIG) as ReferralType[]).map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {REFERRAL_TYPE_CONFIG[type].label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Referral Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ReferralCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedReferrals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No referrals found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "Try adjusting your filters."
                : "Share your referral link to start earning commissions!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedReferrals.map((referral) => (
            <ReferralCard key={referral.id} referral={referral} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredReferrals.length)} of{" "}
            {filteredReferrals.length} referrals
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Stat Card
// ---------------------------------------------------------------------------

function SummaryStat({
  label,
  count,
  amount,
  isLoading,
}: {
  label: string;
  count: number;
  amount: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-1 h-6 w-12" />
          <Skeleton className="mt-1 h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">
          {formatAffiliateAmount(amount)}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Referral Card
// ---------------------------------------------------------------------------

function ReferralCard({ referral }: { referral: AffiliateReferral }) {
  const typeConfig = REFERRAL_TYPE_CONFIG[referral.referralType];
  const statusConfig = REFERRAL_STATUS_CONFIG[referral.status];
  const Icon = REFERRAL_TYPE_ICON[referral.referralType];

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{typeConfig.label}</p>
            <p className="text-xs text-muted-foreground">
              {typeConfig.description}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Created:{" "}
                {new Date(referral.createdAt).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {referral.confirmedAt && (
                <span>
                  Confirmed:{" "}
                  {new Date(referral.confirmedAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {referral.paidAt && (
                <span>
                  Paid:{" "}
                  {new Date(referral.paidAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <span className="text-sm font-semibold">
            {formatAffiliateAmount(referral.commissionAmount)}
          </span>
          {referral.commissionRate > 0 && (
            <span className="text-xs text-muted-foreground">
              {(referral.commissionRate * 100).toFixed(1)}% rate
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function ReferralCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-48" />
            <Skeleton className="mt-1 h-3 w-40" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ReferralListSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-1 h-6 w-12" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-45" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ReferralCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

