// =============================================================================
// Receipt — Printable payment receipt viewer
// =============================================================================
// Displays a professional, printer-friendly receipt with payment details.
// Includes receipt number, payment info, amount, date/time, and property info.
// Print styles hide non-essential UI elements.
// =============================================================================

"use client";

import React from "react";
import {
  Receipt as ReceiptIcon,
  Printer,
  Calendar,
  CreditCard,
  Hash,
  Building2,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/common/page-header";
import type { PaymentStatusResponse } from "../types";
import { PaymentStatus, PaymentMethod } from "../types";
import { ReceiptDownload } from "./receipt-download";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = "MYR"): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    [PaymentMethod.CARD]: "Credit/Debit Card",
    [PaymentMethod.FPX]: "FPX Online Banking",
    [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
    [PaymentMethod.CASH]: "Cash",
    [PaymentMethod.OTHER]: "Other",
  };
  return labels[method] ?? method;
}

function getStatusInfo(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return {
        label: "Paid",
        icon: CheckCircle2,
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      };
    case PaymentStatus.PENDING:
      return {
        label: "Pending",
        icon: Clock,
        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      };
    case PaymentStatus.PROCESSING:
      return {
        label: "Processing",
        icon: Clock,
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      };
    default:
      return {
        label: status,
        icon: AlertCircle,
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      };
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReceiptViewerProps {
  /** The payment record to display */
  payment: PaymentStatusResponse;
  /** Bill number for display */
  billNumber?: string;
  /** Property name for display */
  propertyName?: string;
  /** Payer name */
  payerName?: string;
  /** Back navigation path */
  backPath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReceiptViewer({
  payment,
  billNumber,
  propertyName,
  payerName,
  backPath,
}: ReceiptViewerProps) {
  const statusInfo = getStatusInfo(payment.status);
  const StatusIcon = statusInfo.icon;

  const handlePrint = React.useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header — hidden in print */}
      <div className="print:hidden">
        <PageHeader
          title="Payment Receipt"
          description={payment.receiptNumber ?? payment.paymentNumber}
          icon={ReceiptIcon}
          backHref={backPath}
          actions={[
            {
              label: "Print",
              onClick: handlePrint,
              icon: Printer,
              variant: "outline" as const,
            },
          ]}
          breadcrumbOverrides={[
            { segment: "bills", label: "Bills" },
            ...(payment.billingId
              ? [{ segment: payment.billingId, label: billNumber ?? "Bill" }]
              : []),
            { segment: "receipt", label: "Receipt" },
          ]}
        />
      </div>

      {/* Receipt Card — main printable area */}
      <Card className="mx-auto max-w-2xl print:border-0 print:shadow-none">
        <CardContent className="p-6 sm:p-8 print:p-0">
          {/* Receipt Header */}
          <div className="mb-6 text-center print:mb-8">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 print:bg-transparent print:border print:border-primary">
              <ReceiptIcon className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight print:text-3xl">
              Payment Receipt
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Zam Property Sdn Bhd
            </p>
          </div>

          {/* Status Badge */}
          <div className="mb-6 flex justify-center">
            <Badge className={`gap-1.5 px-4 py-1.5 text-sm ${statusInfo.className}`}>
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </Badge>
          </div>

          <Separator className="my-6" />

          {/* Receipt Details */}
          <div className="space-y-4">
            {/* Receipt Number */}
            {payment.receiptNumber && (
              <DetailRow
                icon={Hash}
                label="Receipt Number"
                value={payment.receiptNumber}
                highlight
              />
            )}

            {/* Payment Number */}
            <DetailRow
              icon={Hash}
              label="Payment Number"
              value={payment.paymentNumber}
            />

            {/* Bill Reference */}
            {billNumber && (
              <DetailRow
                icon={ReceiptIcon}
                label="Bill Reference"
                value={billNumber}
              />
            )}

            {/* Property */}
            {propertyName && (
              <DetailRow
                icon={Building2}
                label="Property"
                value={propertyName}
              />
            )}

            {/* Payer */}
            {payerName && (
              <DetailRow icon={User} label="Paid By" value={payerName} />
            )}

            <Separator className="my-4" />

            {/* Payment Method */}
            <DetailRow
              icon={CreditCard}
              label="Payment Method"
              value={getMethodLabel(payment.method)}
            />

            {/* Reference */}
            {payment.reference && (
              <DetailRow
                icon={Hash}
                label="Transaction Reference"
                value={payment.reference}
              />
            )}

            {/* Payment Date */}
            <DetailRow
              icon={Calendar}
              label="Payment Date"
              value={
                payment.paymentDate
                  ? formatDateTime(payment.paymentDate)
                  : formatDateTime(payment.createdAt)
              }
            />

            {/* Processed At */}
            {payment.processedAt && (
              <DetailRow
                icon={Calendar}
                label="Processed At"
                value={formatDateTime(payment.processedAt)}
              />
            )}

            <Separator className="my-4" />

            {/* Amount */}
            <div className="rounded-lg bg-muted/50 p-4 text-center print:border print:border-gray-200">
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="mt-1 text-3xl font-bold text-primary print:text-black">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground uppercase">
                {payment.currency}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>This is a computer-generated receipt.</p>
            <p>No signature is required.</p>
            {payment.createdAt && (
              <p className="mt-2">
                Generated on {formatDate(payment.createdAt)}
              </p>
            )}
          </div>

          {/* Actions — hidden in print */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row print:hidden">
            <ReceiptDownload payment={payment} className="flex-1" />
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DetailRow sub-component
// ---------------------------------------------------------------------------

function DetailRow({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <span
        className={`text-sm text-right ${highlight ? "font-semibold text-primary" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ReceiptViewerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3 print:hidden">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      {/* Receipt card skeleton */}
      <Card className="mx-auto max-w-2xl">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Status */}
          <div className="mb-6 flex justify-center">
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>

          <Skeleton className="h-px w-full" />

          {/* Details */}
          <div className="my-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>

          {/* Amount */}
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            <Skeleton className="mx-auto h-4 w-20" />
            <Skeleton className="mx-auto mt-2 h-10 w-36" />
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
