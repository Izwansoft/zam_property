// =============================================================================
// PayoutDetail — Full payout detail view with line items and breakdown
// =============================================================================
// Shows: Period, line items (rental income), deductions, net payout,
//        bank transfer details, status timeline, and download statement.
// Session 6.7 implementation.
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import {
  Banknote,
  Building2,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Hash,
  Landmark,
  Loader2,
  MinusCircle,
  PlusCircle,
  Printer,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { Payout, PayoutLineItem } from "../types";
import { PayoutLineItemType, PayoutStatus } from "../types";
import { PayoutStatusBadge } from "./payout-status-badge";
import { PayoutTimeline } from "./payout-timeline";
import { PayoutStatement } from "./payout-statement";
import { usePayout } from "../hooks/usePayout";
import { usePayoutStatement } from "../hooks/usePayoutStatement";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return startDate.toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
    });
  }

  return `${startDate.toLocaleDateString("en-MY", {
    month: "short",
    year: "numeric",
  })} – ${endDate.toLocaleDateString("en-MY", {
    month: "short",
    year: "numeric",
  })}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Group line items by type category */
function groupLineItems(items: PayoutLineItem[]) {
  const income: PayoutLineItem[] = [];
  const deductions: PayoutLineItem[] = [];

  for (const item of items) {
    if (item.amount >= 0) {
      income.push(item);
    } else {
      deductions.push(item);
    }
  }

  return { income, deductions };
}

/** Get a friendly label for line item type */
function getLineItemTypeLabel(type: string): string {
  switch (type) {
    case PayoutLineItemType.RENTAL:
      return "Rental Income";
    case PayoutLineItemType.PLATFORM_FEE:
      return "Platform Fee";
    case PayoutLineItemType.MAINTENANCE:
      return "Maintenance";
    case PayoutLineItemType.CLAIM_DEDUCTION:
      return "Claim Deduction";
    case PayoutLineItemType.OTHER:
      return "Other";
    default:
      return type;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PayoutDetailProps {
  payoutId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayoutDetail({ payoutId }: PayoutDetailProps) {
  const { data: payout, isLoading, error } = usePayout(payoutId);
  const [showStatement, setShowStatement] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const {
    data: statementData,
    isFetching: isDownloading,
  } = usePayoutStatement(payoutId, { enabled: downloadTriggered });

  // Handle download
  const handleDownload = () => {
    setDownloadTriggered(true);
  };

  // When statement data arrives, trigger download
  if (statementData?.url && downloadTriggered) {
    // In production this would open the actual PDF URL
    // For mock, we show it was triggered
    if (typeof window !== "undefined" && statementData.url.startsWith("http")) {
      window.open(statementData.url, "_blank");
    }
    // Reset trigger after processing
    if (downloadTriggered) {
      setTimeout(() => setDownloadTriggered(false), 1000);
    }
  }

  // Group line items
  const lineItemGroups = useMemo(() => {
    if (!payout?.lineItems) return { income: [], deductions: [] };
    return groupLineItems(payout.lineItems);
  }, [payout?.lineItems]);

  // Loading state
  if (isLoading) {
    return <PayoutDetailSkeleton />;
  }

  // Error state
  if (error || !payout) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Payout Not Found</h3>
          <p className="text-muted-foreground text-sm">
            The payout record could not be loaded. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Statement view
  if (showStatement) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatement(false)}
          >
            Back to Detail
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
        <PayoutStatement payout={payout} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono">
                  {payout.payoutNumber}
                </span>
              </div>
              <CardTitle className="text-xl">
                {formatPeriod(payout.periodStart, payout.periodEnd)}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatFullDate(payout.periodStart)} —{" "}
                {formatFullDate(payout.periodEnd)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PayoutStatusBadge status={payout.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatement(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Statement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <PlusCircle className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Gross Rental
              </span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(payout.grossRental)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <MinusCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">
                Platform Fee
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              -{formatCurrency(payout.platformFee)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <MinusCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">
                Deductions
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              -{formatCurrency(payout.maintenanceCost + payout.otherDeductions)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Net Payout</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(payout.netPayout)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income & Deductions — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Income Line Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-green-600" />
                Rental Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lineItemGroups.income.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rental income items
                </p>
              ) : (
                <div className="space-y-0">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-7">Description</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3 text-right">Amount</div>
                  </div>

                  {lineItemGroups.income.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 py-3 border-b last:border-0"
                    >
                      <div className="sm:col-span-7">
                        <p className="text-sm">{item.description}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Badge variant="outline" className="text-xs">
                          {getLineItemTypeLabel(item.type)}
                        </Badge>
                      </div>
                      <div className="sm:col-span-3 text-right">
                        <span className="text-sm font-medium text-green-600">
                          +{formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Subtotal */}
                  <div className="flex justify-between items-center pt-3 font-medium">
                    <span className="text-sm">Subtotal</span>
                    <span className="text-sm text-green-600">
                      +{formatCurrency(payout.grossRental)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MinusCircle className="h-4 w-4 text-amber-600" />
                Deductions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lineItemGroups.deductions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deductions for this period
                </p>
              ) : (
                <div className="space-y-0">
                  {/* Table header */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-7">Description</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3 text-right">Amount</div>
                  </div>

                  {lineItemGroups.deductions.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 py-3 border-b last:border-0"
                    >
                      <div className="sm:col-span-7">
                        <p className="text-sm">{item.description}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Badge variant="outline" className="text-xs">
                          {getLineItemTypeLabel(item.type)}
                        </Badge>
                      </div>
                      <div className="sm:col-span-3 text-right">
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Subtotal */}
                  <div className="flex justify-between items-center pt-3 font-medium">
                    <span className="text-sm">Total Deductions</span>
                    <span className="text-sm text-red-600">
                      -
                      {formatCurrency(
                        payout.platformFee +
                          payout.maintenanceCost +
                          payout.otherDeductions
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Net Payout Summary */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Net Payout</p>
                  <p className="text-xs text-muted-foreground">
                    Gross Rental − Platform Fee − Maintenance − Other Deductions
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(payout.netPayout)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline + Bank Details */}
        <div className="space-y-6">
          {/* Payout Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payout Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <PayoutTimeline
                payoutStatus={payout.status}
                createdAt={payout.createdAt}
                approvedAt={payout.approvedAt}
                processedAt={payout.processedAt}
              />
            </CardContent>
          </Card>

          {/* Bank Transfer Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payout.bankName ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="text-sm font-medium">{payout.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account Number
                    </p>
                    <p className="text-sm font-mono">{payout.bankAccount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Account Name
                    </p>
                    <p className="text-sm font-medium">
                      {payout.bankAccountName}
                    </p>
                  </div>
                  {payout.bankReference && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Bank Reference
                        </p>
                        <p className="text-sm font-mono">
                          {payout.bankReference}
                        </p>
                      </div>
                    </>
                  )}
                  {payout.processedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Processed On
                      </p>
                      <p className="text-sm">{formatDate(payout.processedAt)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Bank details will be confirmed upon approval
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function PayoutDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between py-3 border-b">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
