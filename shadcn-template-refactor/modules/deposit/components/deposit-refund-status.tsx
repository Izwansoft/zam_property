// =============================================================================
// DepositRefundStatus — Refund status and deduction breakdown
// =============================================================================
// Shows deductions linked to claims, net refundable amount, and refund status.
// Used when tenancy is terminating or terminated.
// =============================================================================

"use client";

import {
  ArrowRight,
  Check,
  Clock,
  FileText,
  Loader2,
  Minus,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  DepositStatus,
  DepositType,
  DEPOSIT_STATUS_CONFIG,
  DEPOSIT_TYPE_CONFIG,
  type Deposit,
  type RefundCalculation,
  type DeductionClaim,
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

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type RefundStatusPhase = "PENDING" | "CALCULATING" | "READY" | "PROCESSING" | "COMPLETED" | "FORFEITED";

function getRefundPhase(deposit: Deposit): RefundStatusPhase {
  switch (deposit.status) {
    case DepositStatus.PENDING:
      return "PENDING";
    case DepositStatus.COLLECTED:
      return "READY";
    case DepositStatus.HELD:
      return "CALCULATING";
    case DepositStatus.PARTIALLY_REFUNDED:
    case DepositStatus.FULLY_REFUNDED:
      return "COMPLETED";
    case DepositStatus.FORFEITED:
      return "FORFEITED";
    default:
      return "PENDING";
  }
}

const PHASE_CONFIG: Record<RefundStatusPhase, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: {
    label: "Awaiting Collection",
    color: "text-gray-500",
    icon: Clock,
  },
  CALCULATING: {
    label: "Calculating Deductions",
    color: "text-amber-500",
    icon: Loader2,
  },
  READY: {
    label: "Ready for Refund",
    color: "text-blue-500",
    icon: Wallet,
  },
  PROCESSING: {
    label: "Processing Refund",
    color: "text-purple-500",
    icon: RefreshCw,
  },
  COMPLETED: {
    label: "Refund Complete",
    color: "text-green-500",
    icon: Check,
  },
  FORFEITED: {
    label: "Forfeited",
    color: "text-red-500",
    icon: XCircle,
  },
};

// ---------------------------------------------------------------------------
// Deduction Item
// ---------------------------------------------------------------------------

interface DeductionItemProps {
  deduction: DeductionClaim;
  currency: string;
}

function DeductionItem({ deduction, currency }: DeductionItemProps) {
  return (
    <div className="flex items-start justify-between py-2 text-sm">
      <div className="flex items-start gap-2">
        <Minus className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">{deduction.description}</p>
          {deduction.claimId && (
            <p className="text-xs text-muted-foreground">
              Linked to claim #{deduction.claimId.slice(-6)}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(deduction.addedAt)}</p>
        </div>
      </div>
      <span className="font-medium text-destructive shrink-0">
        -{formatCurrency(deduction.amount, currency)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Refund Timeline
// ---------------------------------------------------------------------------

interface RefundTimelineProps {
  deposit: Deposit;
}

function RefundTimeline({ deposit }: RefundTimelineProps) {
  const phase = getRefundPhase(deposit);
  const phases: RefundStatusPhase[] = ["PENDING", "READY", "CALCULATING", "COMPLETED"];
  const currentIndex = phases.indexOf(phase);

  if (phase === "FORFEITED") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
        <XCircle className="h-5 w-5 text-red-500" />
        <div>
          <p className="font-medium text-red-700 dark:text-red-400">Deposit Forfeited</p>
          <p className="text-xs text-red-600 dark:text-red-500">
            This deposit has been forfeited and will not be refunded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Refund Progress</h4>
      <div className="flex items-center gap-2">
        {phases.map((p, idx) => {
          const config = PHASE_CONFIG[p];
          const Icon = config.icon;
          const isActive = idx <= currentIndex;
          const isCurrent = p === phase;

          return (
            <div key={p} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-muted text-muted-foreground",
                  isCurrent && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <Icon className={cn("h-4 w-4", isCurrent && p === "CALCULATING" && "animate-spin")} />
              </div>
              {idx < phases.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    idx < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className={cn("text-sm font-medium", PHASE_CONFIG[phase].color)}>
        {PHASE_CONFIG[phase].label}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Deposit Refund Card
// ---------------------------------------------------------------------------

interface DepositRefundCardProps {
  deposit: Deposit;
  refundCalculation?: RefundCalculation;
  onViewClaim?: (claimId: string) => void;
}

function DepositRefundCard({ deposit, refundCalculation, onViewClaim }: DepositRefundCardProps) {
  const typeConfig = DEPOSIT_TYPE_CONFIG[deposit.type];
  const statusConfig = DEPOSIT_STATUS_CONFIG[deposit.status];
  const totalDeductions = deposit.deductionClaims?.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  const netRefundable = deposit.amount - totalDeductions;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{typeConfig.label}</CardTitle>
          <Badge variant="secondary" className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription>{typeConfig.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Amount */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Original Amount</span>
          <span className="font-semibold">{formatCurrency(deposit.amount, deposit.currency)}</span>
        </div>

        {/* Deductions Section */}
        {deposit.deductionClaims && deposit.deductionClaims.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Deductions ({deposit.deductionClaims.length})
              </h4>
              <div className="divide-y">
                {deposit.deductionClaims.map((deduction, idx) => (
                  <DeductionItem
                    key={deduction.claimId ?? idx}
                    deduction={deduction}
                    currency={deposit.currency}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 text-sm font-medium">
                <span>Total Deductions</span>
                <span className="text-destructive">-{formatCurrency(totalDeductions, deposit.currency)}</span>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Net Refundable */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Net Refundable</span>
          <span
            className={cn(
              "text-lg font-bold",
              netRefundable > 0
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            )}
          >
            {formatCurrency(Math.max(0, netRefundable), deposit.currency)}
          </span>
        </div>

        {/* Refund Timeline */}
        <Separator />
        <RefundTimeline deposit={deposit} />

        {/* Refund Details (if refunded) */}
        {(deposit.status === DepositStatus.PARTIALLY_REFUNDED ||
          deposit.status === DepositStatus.FULLY_REFUNDED) &&
          deposit.refundedAt && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-400">Refund Processed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="font-medium">{formatCurrency(deposit.refundedAmount ?? 0, deposit.currency)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{formatDate(deposit.refundedAt)}</p>
                </div>
                {deposit.refundRef && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Reference</span>
                    <p className="font-medium font-mono text-xs">{deposit.refundRef}</p>
                  </div>
                )}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface DepositRefundStatusProps {
  deposits: Deposit[];
  refundCalculations?: RefundCalculation[];
  currency?: string;
  onViewClaim?: (claimId: string) => void;
  isLoading?: boolean;
}

export function DepositRefundStatus({
  deposits,
  refundCalculations,
  currency = "MYR",
  onViewClaim,
  isLoading = false,
}: DepositRefundStatusProps) {
  if (isLoading) {
    return <DepositRefundStatusSkeleton />;
  }

  if (!deposits || deposits.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No deposits to refund</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalOriginal = deposits.reduce((sum, d) => sum + d.amount, 0);
  const totalDeductions = deposits.reduce(
    (sum, d) => sum + (d.deductionClaims?.reduce((s, c) => s + c.amount, 0) ?? 0),
    0
  );
  const totalRefundable = totalOriginal - totalDeductions;
  const totalRefunded = deposits.reduce((sum, d) => sum + (d.refundedAmount ?? 0), 0);

  // Sort deposits by type
  const sortedDeposits = [...deposits].sort((a, b) => {
    const order = { SECURITY: 0, UTILITY: 1, KEY: 2 };
    return (order[a.type] ?? 99) - (order[b.type] ?? 99);
  });

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Refund Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Total Deposits</p>
              <p className="text-lg font-bold">{formatCurrency(totalOriginal, currency)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
              <p className="text-xs text-muted-foreground mb-1">Deductions</p>
              <p className="text-lg font-bold text-destructive">
                -{formatCurrency(totalDeductions, currency)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/10">
              <p className="text-xs text-muted-foreground mb-1">Net Refundable</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(Math.max(0, totalRefundable), currency)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
              <p className="text-xs text-muted-foreground mb-1">Refunded</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(totalRefunded, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Deposit Cards */}
      {sortedDeposits.map((deposit) => (
        <DepositRefundCard
          key={deposit.id}
          deposit={deposit}
          refundCalculation={refundCalculations?.find((r) => r.depositId === deposit.id)}
          onViewClaim={onViewClaim}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function DepositRefundStatusSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                <Skeleton className="h-3 w-20 mx-auto mb-2" />
                <Skeleton className="h-6 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
