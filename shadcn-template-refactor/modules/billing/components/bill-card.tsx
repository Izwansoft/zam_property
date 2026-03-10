// =============================================================================
// BillCard — Card component for bill list views
// =============================================================================

"use client";

import Link from "next/link";
import {
  Calendar,
  Receipt,
  ChevronRight,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { Billing } from "../types";
import { BillingStatus } from "../types";
import { BillingStatusBadge } from "./billing-status-badge";

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatBillingPeriod(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
  });
}

/**
 * Check if a bill is overdue based on due date and status.
 */
function isOverdue(bill: Billing): boolean {
  return bill.status === BillingStatus.OVERDUE;
}

/**
 * Check if the bill is payable (has outstanding balance).
 */
function isPayable(bill: Billing): boolean {
  return (
    bill.balanceDue > 0 &&
    [
      BillingStatus.SENT,
      BillingStatus.PARTIALLY_PAID,
      BillingStatus.OVERDUE,
    ].includes(bill.status)
  );
}

/**
 * Get days until/past due.
 */
function getDueDaysLabel(dueDate: string): string | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return `${absDays} day${absDays !== 1 ? "s" : ""} overdue`;
  }
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillCardProps {
  bill: Billing;
  /** Base path for detail link */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillCard({
  bill,
  basePath = "/dashboard/tenant/bills",
}: BillCardProps) {
  const overdue = isOverdue(bill);
  const payable = isPayable(bill);
  const dueLabel = getDueDaysLabel(bill.dueDate);

  return (
    <Link href={`${basePath}/${bill.id}`} className="group block">
      <Card
        className={`overflow-hidden transition-shadow hover:shadow-md ${
          overdue
            ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
            : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Bill info */}
            <div className="flex flex-1 items-start gap-3">
              {/* Icon */}
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  overdue
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {overdue ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Receipt className="h-5 w-5" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold leading-tight group-hover:text-primary">
                    {formatBillingPeriod(bill.billingPeriod)}
                  </h3>
                  <BillingStatusBadge
                    status={bill.status}
                    showUrgency={true}
                  />
                </div>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  {bill.billNumber}
                </p>

                {/* Due date info */}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due {formatDate(bill.dueDate)}
                  </span>
                  {bill.issueDate && (
                    <span>Issued {formatDate(bill.issueDate)}</span>
                  )}
                </div>

                {/* Urgency label */}
                {dueLabel && payable && (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      overdue
                        ? "text-destructive"
                        : dueLabel.includes("today") ||
                            dueLabel.includes("tomorrow")
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {dueLabel}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Amount and action */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
              {/* Total amount */}
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    overdue ? "text-destructive" : "text-primary"
                  }`}
                >
                  {formatCurrency(bill.totalAmount)}
                </p>
                {bill.paidAmount > 0 && bill.balanceDue > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Balance: {formatCurrency(bill.balanceDue)}
                  </p>
                )}
                {bill.status === BillingStatus.PAID && bill.paidDate && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Paid {formatDate(bill.paidDate)}
                  </p>
                )}
              </div>

              {/* Pay button or chevron */}
              {payable ? (
                <Button
                  size="sm"
                  variant={overdue ? "destructive" : "default"}
                  className="shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    // Navigation handled by parent Link — but pay action can stop propagation
                  }}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Pay Now
                </Button>
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              )}
            </div>
          </div>

          {/* Late fee indicator */}
          {bill.lateFee > 0 && (
            <div className="mt-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              Late fee applied: {formatCurrency(bill.lateFee)}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function BillCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
