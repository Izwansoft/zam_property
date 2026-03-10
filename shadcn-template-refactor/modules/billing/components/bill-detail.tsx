// =============================================================================
// BillDetail — Composite detail view for a single billing record
// =============================================================================
// Shows: Header, amount summary, line item table, payment history,
// pay button, and PDF download button.
// Breakdown: Rent + Utilities + Late Fees − Deductions = Total Due
// =============================================================================

"use client";

import React from "react";
import {
  Receipt,
  Calendar,
  Home,
  User,
  CreditCard,
  Download,
  FileText,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/common/page-header";
import { PaymentDialog } from "@/modules/payment/components/payment-dialog";

import type { Billing, BillingPayment } from "../types";
import { BillingStatus, BILLING_STATUS_CONFIG } from "../types";
import { BillingStatusBadge } from "./billing-status-badge";
import { BillingLineItemTable, BillingLineItemTableSkeleton } from "./billing-line-item-table";
import { PaymentHistory, PaymentHistorySkeleton } from "./payment-history";

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

function formatBillingPeriod(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
  });
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillDetailProps {
  billing: Billing;
  payments: BillingPayment[];
  paymentsLoading?: boolean;
  backPath?: string;
  /** Callback after successful payment — typically invalidates queries */
  onPaymentSuccess?: (paymentId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillDetail({
  billing,
  payments,
  paymentsLoading = false,
  backPath = "/dashboard/tenant/bills",
  onPaymentSuccess,
}: BillDetailProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const payable = isPayable(billing);
  const isOverdue = billing.status === BillingStatus.OVERDUE;
  const statusConfig = BILLING_STATUS_CONFIG[billing.status];

  // Page actions
  const actions = [];

  if (payable) {
    actions.push({
      label: "Pay Now",
      onClick: () => setPaymentDialogOpen(true),
      icon: CreditCard,
      variant: isOverdue ? ("destructive" as const) : ("default" as const),
    });
  }

  actions.push({
    label: "Download PDF",
    onClick: () => {
      // TODO: Implement PDF download
    },
    icon: Download,
    variant: "outline" as const,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={formatBillingPeriod(billing.billingPeriod)}
        description={billing.billNumber}
        icon={Receipt}
        backHref={backPath}
        status={{
          label: statusConfig.label,
          variant:
            statusConfig.variant === "success"
              ? "default"
              : statusConfig.variant === "warning"
                ? "secondary"
                : statusConfig.variant === "destructive"
                  ? "destructive"
                  : "outline",
        }}
        actions={actions}
        breadcrumbOverrides={[
          { segment: "bills", label: "Bills" },
          {
            segment: billing.id,
            label: billing.billNumber,
          },
        ]}
      />

      {/* Amount Summary Card */}
      <Card
        className={
          isOverdue
            ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
            : ""
        }
      >
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Total Amount */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(billing.totalAmount)}</p>
            </div>

            {/* Paid */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(billing.paidAmount)}
              </p>
            </div>

            {/* Balance Due */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Balance Due</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  billing.balanceDue > 0
                    ? isOverdue
                      ? "text-destructive"
                      : "text-primary"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {formatCurrency(billing.balanceDue)}
              </p>
            </div>

            {/* Due Date */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p
                className={`mt-1 text-lg font-semibold ${
                  isOverdue ? "text-destructive" : ""
                }`}
              >
                {formatDate(billing.dueDate)}
              </p>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Line items and payment history (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Line Items */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4" />
              Bill Breakdown
            </h2>
            <BillingLineItemTable
              lineItems={billing.lineItems ?? []}
              totalAmount={billing.totalAmount}
            />
          </div>

          {/* Payment History */}
          <PaymentHistory
            payments={payments}
            isLoading={paymentsLoading}
            billingId={billing.id}
          />
        </div>

        {/* Right: Bill Info sidebar (1 col) */}
        <div className="space-y-6">
          {/* Bill Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                icon={Calendar}
                label="Billing Period"
                value={formatBillingPeriod(billing.billingPeriod)}
              />
              <InfoRow
                icon={Calendar}
                label="Issue Date"
                value={formatDate(billing.issueDate)}
              />
              <InfoRow
                icon={Calendar}
                label="Due Date"
                value={formatDate(billing.dueDate)}
              />
              {billing.paidDate && (
                <InfoRow
                  icon={Calendar}
                  label="Paid Date"
                  value={formatDate(billing.paidDate)}
                />
              )}

              <Separator />

              {/* Amount breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent</span>
                  <span>{formatCurrency(billing.rentAmount)}</span>
                </div>
                {billing.lateFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Fee</span>
                    <span className="text-destructive">
                      {formatCurrency(billing.lateFee)}
                    </span>
                  </div>
                )}
                {billing.adjustments !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adjustments</span>
                    <span
                      className={
                        billing.adjustments < 0
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      }
                    >
                      {billing.adjustments < 0 ? "−" : ""}
                      {formatCurrency(Math.abs(billing.adjustments))}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(billing.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Info Card (from tenancy reference) */}
          {billing.tenancy && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Property Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={Home}
                  label="Property"
                  value={billing.tenancy.listing.title}
                />
                <InfoRow
                  icon={User}
                  label="Owner"
                  value={billing.tenancy.owner.name}
                />
                <InfoRow
                  icon={User}
                  label="Partner"
                  value={billing.tenancy.tenant.user.fullName}
                />
              </CardContent>
            </Card>
          )}

          {/* Quick Pay Card (if payable) */}
          {payable && (
            <Card className="border-primary/50 bg-primary/5 dark:bg-primary/10">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium">
                    {isOverdue ? "Overdue Balance" : "Amount Due"}
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      isOverdue ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {formatCurrency(billing.balanceDue)}
                  </p>
                  <Button
                    className="w-full"
                    variant={isOverdue ? "destructive" : "default"}
                    onClick={() => setPaymentDialogOpen(true)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      {payable && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          billing={billing}
          onPaymentSuccess={onPaymentSuccess}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoRow sub-component
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function BillDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>

      {/* Amount summary skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="mx-auto h-4 w-20" />
                <Skeleton className="mx-auto h-8 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <Skeleton className="mb-3 h-5 w-32" />
            <BillingLineItemTableSkeleton />
          </div>
          <PaymentHistorySkeleton />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
