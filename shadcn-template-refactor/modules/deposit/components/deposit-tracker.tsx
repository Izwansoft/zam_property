// =============================================================================
// DepositTracker — Visual deposit tracking component
// =============================================================================
// Shows all deposits for a tenancy with status badges, progress indicators,
// and lifecycle visualization (Pending → Collected → Held → Refunded).
// =============================================================================

"use client";

import { Shield, Zap, Key, Check, Clock, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  DepositType,
  DepositStatus,
  DEPOSIT_STATUS_CONFIG,
  DEPOSIT_TYPE_CONFIG,
  type Deposit,
  type DepositSummary,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string = "MYR"): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDepositIcon(type: DepositType) {
  switch (type) {
    case DepositType.SECURITY:
      return Shield;
    case DepositType.UTILITY:
      return Zap;
    case DepositType.KEY:
      return Key;
    default:
      return Shield;
  }
}

function getStatusIcon(status: DepositStatus) {
  switch (status) {
    case DepositStatus.PENDING:
      return Clock;
    case DepositStatus.COLLECTED:
      return Check;
    case DepositStatus.HELD:
      return AlertTriangle;
    case DepositStatus.PARTIALLY_REFUNDED:
      return RefreshCw;
    case DepositStatus.FULLY_REFUNDED:
      return Check;
    case DepositStatus.FORFEITED:
      return XCircle;
    default:
      return Clock;
  }
}

function getLifecycleProgress(status: DepositStatus): number {
  switch (status) {
    case DepositStatus.PENDING:
      return 0;
    case DepositStatus.COLLECTED:
      return 33;
    case DepositStatus.HELD:
      return 66;
    case DepositStatus.PARTIALLY_REFUNDED:
    case DepositStatus.FULLY_REFUNDED:
    case DepositStatus.FORFEITED:
      return 100;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

interface DepositItemProps {
  deposit: Deposit;
  compact?: boolean;
}

function DepositItem({ deposit, compact = false }: DepositItemProps) {
  const typeConfig = DEPOSIT_TYPE_CONFIG[deposit.type];
  const statusConfig = DEPOSIT_STATUS_CONFIG[deposit.status];
  const Icon = getDepositIcon(deposit.type);
  const StatusIcon = getStatusIcon(deposit.status);
  const progress = getLifecycleProgress(deposit.status);

  const refundable = deposit.refundedAmount
    ? deposit.amount - (deposit.refundedAmount ?? 0)
    : deposit.amount - (deposit.deductionClaims?.reduce((sum, d) => sum + d.amount, 0) ?? 0);

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{typeConfig.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{formatCurrency(deposit.amount, deposit.currency)}</span>
          <Badge variant="secondary" className={cn("text-xs", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium">{typeConfig.label}</h4>
            <p className="text-xs text-muted-foreground">{typeConfig.description}</p>
          </div>
        </div>
        <Badge variant="secondary" className={statusConfig.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-semibold">{formatCurrency(deposit.amount, deposit.currency)}</span>
      </div>

      {/* Deductions (if any) */}
      {deposit.deductionClaims && deposit.deductionClaims.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deductions</span>
            <span className="text-destructive">
              -{formatCurrency(
                deposit.deductionClaims.reduce((sum, d) => sum + d.amount, 0),
                deposit.currency
              )}
            </span>
          </div>
          <div className="pl-4 space-y-1">
            {deposit.deductionClaims.map((deduction, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-50">{deduction.description}</span>
                <span>-{formatCurrency(deduction.amount, deposit.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refundable Amount */}
      {(deposit.status === DepositStatus.COLLECTED ||
        deposit.status === DepositStatus.HELD ||
        deposit.status === DepositStatus.PARTIALLY_REFUNDED) && (
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Refundable</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(Math.max(0, refundable), deposit.currency)}
          </span>
        </div>
      )}

      {/* Refunded Amount */}
      {(deposit.status === DepositStatus.PARTIALLY_REFUNDED ||
        deposit.status === DepositStatus.FULLY_REFUNDED) &&
        deposit.refundedAmount && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Refunded</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {formatCurrency(deposit.refundedAmount, deposit.currency)}
          </span>
        </div>
      )}

      {/* Lifecycle Progress */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Lifecycle Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Pending</span>
          <span>Collected</span>
          <span>Held</span>
          <span>Refunded</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Card
// ---------------------------------------------------------------------------

interface DepositSummaryCardProps {
  summary: DepositSummary;
  currency?: string;
}

function DepositSummaryCard({ summary, currency = "MYR" }: DepositSummaryCardProps) {
  const collectionRate = summary.totalDeposits > 0
    ? Math.round((summary.totalCollected / summary.totalDeposits) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Deposit Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total vs Collected */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Required</span>
            <span className="font-semibold">{formatCurrency(summary.totalDeposits, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Collected</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(summary.totalCollected, currency)}
            </span>
          </div>
          {summary.totalPending > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatCurrency(summary.totalPending, currency)}
              </span>
            </div>
          )}
          {summary.totalDeductions > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Deductions</span>
              <span className="font-semibold text-destructive">
                -{formatCurrency(summary.totalDeductions, currency)}
              </span>
            </div>
          )}
          {summary.totalRefunded > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Refunded</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.totalRefunded, currency)}
              </span>
            </div>
          )}
        </div>

        {/* Collection Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Collection Progress</span>
            <span className="font-medium">{collectionRate}%</span>
          </div>
          <Progress value={collectionRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface DepositTrackerProps {
  deposits: Deposit[];
  summary?: DepositSummary;
  currency?: string;
  compact?: boolean;
  showSummary?: boolean;
  isLoading?: boolean;
}

export function DepositTracker({
  deposits,
  summary,
  currency = "MYR",
  compact = false,
  showSummary = true,
  isLoading = false,
}: DepositTrackerProps) {
  if (isLoading) {
    return <DepositTrackerSkeleton compact={compact} showSummary={showSummary} />;
  }

  if (!deposits || deposits.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No deposits recorded</p>
        </CardContent>
      </Card>
    );
  }

  // Sort deposits by type (Security, Utility, Key)
  const sortedDeposits = [...deposits].sort((a, b) => {
    const order = { SECURITY: 0, UTILITY: 1, KEY: 2 };
    return (order[a.type] ?? 99) - (order[b.type] ?? 99);
  });

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {sortedDeposits.map((deposit) => (
              <DepositItem key={deposit.id} deposit={deposit} compact />
            ))}
          </div>
          {summary && showSummary && summary.totalPending > 0 && (
            <div className="mt-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-800 dark:text-amber-400">Pending Collection</span>
                <span className="font-medium text-amber-800 dark:text-amber-400">
                  {formatCurrency(summary.totalPending, currency)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {summary && showSummary && <DepositSummaryCard summary={summary} currency={currency} />}

      {/* Deposit List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Deposit Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedDeposits.map((deposit) => (
            <DepositItem key={deposit.id} deposit={deposit} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

interface DepositTrackerSkeletonProps {
  compact?: boolean;
  showSummary?: boolean;
}

export function DepositTrackerSkeleton({
  compact = false,
  showSummary = true,
}: DepositTrackerSkeletonProps) {
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showSummary && (
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

