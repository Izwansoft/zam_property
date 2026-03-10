// =============================================================================
// PaymentHistory — Payment history list for a billing record
// =============================================================================
// Displays all payments associated with a billing, with status badges,
// method labels, receipt links, and empty state.
// =============================================================================

"use client";

import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  RotateCcw,
  AlertTriangle,
  Receipt,
  ExternalLink,
  FileText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { BillingPayment, PaymentStatus, PaymentStatusVariant } from "../types";
import {
  PAYMENT_STATUS_CONFIG,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Map status icons */
function getStatusIcon(status: PaymentStatus) {
  const config = PAYMENT_STATUS_CONFIG[status];
  switch (config.icon) {
    case "check-circle":
      return <CheckCircle className="h-4 w-4" />;
    case "x-circle":
      return <XCircle className="h-4 w-4" />;
    case "clock":
      return <Clock className="h-4 w-4" />;
    case "loader":
      return <Loader className="h-4 w-4 animate-spin" />;
    case "rotate-ccw":
      return <RotateCcw className="h-4 w-4" />;
    case "alert-triangle":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

/** Badge variant mapping from payment status variant */
function getBadgeVariant(
  variant: PaymentStatusVariant
): "default" | "secondary" | "destructive" | "outline" {
  switch (variant) {
    case "success":
      return "default";
    case "warning":
      return "secondary";
    case "destructive":
      return "destructive";
    case "outline":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusBadgeClassName(variant: PaymentStatusVariant): string {
  switch (variant) {
    case "success":
      return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "warning":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    case "destructive":
      return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "";
  }
}

function getMethodLabel(method: string): string {
  return (
    PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PaymentHistoryProps {
  payments: BillingPayment[];
  isLoading?: boolean;
  /** Billing ID — used to build receipt links */
  billingId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaymentHistory({ payments, isLoading, billingId }: PaymentHistoryProps) {
  if (isLoading) {
    return <PaymentHistorySkeleton />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          Payment History
          {payments.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {payments.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No payments recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
              const badgeVariant = getBadgeVariant(statusConfig.variant);
              const badgeClassName = getStatusBadgeClassName(statusConfig.variant);

              return (
                <div
                  key={payment.id}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  {/* Left: Payment info */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {payment.paymentNumber}
                        </span>
                        <Badge
                          variant={badgeVariant}
                          className={`text-xs ${badgeClassName}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {getMethodLabel(payment.method)}
                        {payment.reference && ` • Ref: ${payment.reference}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {payment.paymentDate
                          ? formatDateTime(payment.paymentDate)
                          : formatDateTime(payment.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount and receipt */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">
                      {formatCurrency(payment.amount)}
                    </span>
                    {payment.receiptNumber && billingId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs"
                        asChild
                      >
                        <Link
                          href={`/dashboard/tenant/bills/${billingId}/receipt?paymentId=${payment.id}`}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          View Receipt
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function PaymentHistorySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start justify-between rounded-lg border p-3"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
