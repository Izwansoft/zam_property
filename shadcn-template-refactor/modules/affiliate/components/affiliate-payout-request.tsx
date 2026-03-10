// =============================================================================
// AffiliatePayoutRequest — Payout history + request payout dialog
// =============================================================================
// Displays payout history for the affiliate and provides a request payout
// action with confirmation dialog.
// =============================================================================

"use client";

import { useState } from "react";
import {
  WalletIcon,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  BanknoteIcon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PAYOUT_STATUS_CONFIG,
  formatAffiliateAmount,
} from "../types";
import type {
  AffiliatePayout,
  AffiliatePayoutStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PAYOUTS: AffiliatePayout[] = [
  {
    id: "pay-1",
    affiliateId: "aff-1",
    amount: 2500,
    status: "COMPLETED",
    processedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    reference: "PAY-2026-001",
    notes: null,
    createdAt: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
  {
    id: "pay-2",
    affiliateId: "aff-1",
    amount: 1200,
    status: "PENDING",
    processedAt: null,
    reference: null,
    notes: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "pay-3",
    affiliateId: "aff-1",
    amount: 800,
    status: "PROCESSING",
    processedAt: null,
    reference: "PAY-2026-002",
    notes: "Being processed",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "pay-4",
    affiliateId: "aff-1",
    amount: 350,
    status: "COMPLETED",
    processedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    reference: "PAY-2026-003",
    notes: null,
    createdAt: new Date(Date.now() - 32 * 86400000).toISOString(),
  },
  {
    id: "pay-5",
    affiliateId: "aff-1",
    amount: 200,
    status: "FAILED",
    processedAt: null,
    reference: null,
    notes: "Invalid bank details",
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
];

const MOCK_UNPAID_BALANCE = 1200;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AffiliatePayoutRequestProps {
  /** Affiliate ID for payout requests */
  affiliateId?: string;
  /** Page title override */
  title?: string;
  /** Page description override */
  description?: string;
}

// ---------------------------------------------------------------------------
// Payout Status Icons
// ---------------------------------------------------------------------------

const PAYOUT_STATUS_ICON: Record<
  AffiliatePayoutStatus,
  React.ComponentType<{ className?: string }>
> = {
  PENDING: Clock,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
};

const PAYOUT_STATUS_COLOR: Record<AffiliatePayoutStatus, string> = {
  PENDING: "text-yellow-600",
  PROCESSING: "text-blue-600",
  COMPLETED: "text-green-600",
  FAILED: "text-red-600",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AffiliatePayoutRequest({
  title = "Payouts",
  description = "View payout history and request new payouts",
}: AffiliatePayoutRequestProps) {
  const [isLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    AffiliatePayoutStatus | "ALL"
  >("ALL");
  const [page, setPage] = useState(1);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const pageSize = 20;

  // TODO: Replace with useAffiliatePayouts(affiliateId, filters) when integrated
  const allPayouts = MOCK_PAYOUTS;
  const unpaidBalance = MOCK_UNPAID_BALANCE;

  // Client-side filtering (will be server-side when hooked up)
  const filteredPayouts = allPayouts.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredPayouts.length / pageSize);
  const paginatedPayouts = filteredPayouts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Summaries
  const totalPaid = allPayouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = allPayouts
    .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((sum, p) => sum + p.amount, 0);

  const handleRequestPayout = async () => {
    setIsRequesting(true);
    // TODO: Call useRequestPayout() mutation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRequesting(false);
    setRequestDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Request Payout Button */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={unpaidBalance <= 0}>
              <BanknoteIcon className="mr-2 size-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Request a payout of your unpaid affiliate earnings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Available Balance
                  </span>
                  <span className="text-2xl font-bold">
                    {formatAffiliateAmount(unpaidBalance)}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Payouts are processed within 3-5 business days. Ensure your
                  bank details are up to date before requesting.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRequestDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRequestPayout} disabled={isRequesting}>
                {isRequesting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Confirm Payout Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <DollarSign className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Total Paid
                </p>
                <p className="text-lg font-bold">
                  {formatAffiliateAmount(totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Clock className="size-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Pending / Processing
                </p>
                <p className="text-lg font-bold">
                  {formatAffiliateAmount(totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <WalletIcon className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Available Balance
                </p>
                <p className="text-lg font-bold">
                  {formatAffiliateAmount(unpaidBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Status:
          </span>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as AffiliatePayoutStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {(
              Object.keys(PAYOUT_STATUS_CONFIG) as AffiliatePayoutStatus[]
            ).map((status) => (
              <SelectItem key={status} value={status}>
                {PAYOUT_STATUS_CONFIG[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payout List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PayoutCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedPayouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <WalletIcon className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No payouts found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter !== "ALL"
                ? "Try adjusting your filter."
                : "Request a payout when you have available balance."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginatedPayouts.map((payout) => (
            <PayoutCard key={payout.id} payout={payout} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredPayouts.length)} of{" "}
            {filteredPayouts.length} payouts
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
// Payout Card
// ---------------------------------------------------------------------------

function PayoutCard({ payout }: { payout: AffiliatePayout }) {
  const statusConfig = PAYOUT_STATUS_CONFIG[payout.status];
  const StatusIcon = PAYOUT_STATUS_ICON[payout.status];
  const statusColor = PAYOUT_STATUS_COLOR[payout.status];

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <StatusIcon className={`size-5 ${statusColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {formatAffiliateAmount(payout.amount)}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Requested:{" "}
                {new Date(payout.createdAt).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {payout.processedAt && (
                <span>
                  Processed:{" "}
                  {new Date(payout.processedAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
            {payout.reference && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ref: <code className="rounded bg-muted px-1">{payout.reference}</code>
              </p>
            )}
            {payout.notes && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {payout.notes}
              </p>
            )}
          </div>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function PayoutCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  );
}

export function AffiliatePayoutSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-1 h-5 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-9 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <PayoutCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

