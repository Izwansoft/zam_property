// =============================================================================
// PayoutStatement — Professional printable invoice-style payout statement
// =============================================================================
// Renders a clean, printable payout statement document.
// Designed for @media print with clean CSS.
// Session 6.7 implementation.
// =============================================================================

"use client";

import { Separator } from "@/components/ui/separator";
import type { Payout, PayoutLineItem } from "../types";
import { PayoutLineItemType, PayoutStatus, PAYOUT_STATUS_CONFIG } from "../types";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatStatementDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${startDate.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })} — ${endDate.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

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

interface PayoutStatementProps {
  payout: Payout;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayoutStatement({ payout }: PayoutStatementProps) {
  const incomeItems = (payout.lineItems ?? []).filter((i) => i.amount >= 0);
  const deductionItems = (payout.lineItems ?? []).filter((i) => i.amount < 0);
  const totalDeductions =
    payout.platformFee + payout.maintenanceCost + payout.otherDeductions;
  const statusConfig = PAYOUT_STATUS_CONFIG[payout.status];

  return (
    <div className="bg-white dark:bg-background border rounded-lg p-8 max-w-3xl mx-auto print:border-0 print:p-0 print:max-w-none print:shadow-none">
      {/* Statement Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Payout Statement
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zam-Property Platform
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-muted-foreground">
            {payout.payoutNumber}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Generated: {formatStatementDate(new Date().toISOString())}
          </p>
          <div className="mt-2">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                payout.status === PayoutStatus.COMPLETED
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : payout.status === PayoutStatus.FAILED
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              }`}
            >
              {statusConfig?.label ?? payout.status}
            </span>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Payee & Period Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            Payee
          </h3>
          <p className="text-sm font-medium">{payout.ownerName || "—"}</p>
          {payout.bankName && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{payout.bankName}</p>
              <p className="font-mono">{payout.bankAccount}</p>
              <p>{payout.bankAccountName}</p>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            Period
          </h3>
          <p className="text-sm">
            {formatPeriod(payout.periodStart, payout.periodEnd)}
          </p>
          {payout.processedAt && (
            <div className="mt-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Processed
              </h3>
              <p className="text-sm">
                {formatStatementDate(payout.processedAt)}
              </p>
            </div>
          )}
          {payout.bankReference && (
            <div className="mt-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Bank Reference
              </h3>
              <p className="text-sm font-mono">{payout.bankReference}</p>
            </div>
          )}
        </div>
      </div>

      {/* Income Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
          Income
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-muted-foreground">
                #
              </th>
              <th className="text-left py-2 font-medium text-muted-foreground">
                Description
              </th>
              <th className="text-left py-2 font-medium text-muted-foreground">
                Type
              </th>
              <th className="text-right py-2 font-medium text-muted-foreground">
                Amount (RM)
              </th>
            </tr>
          </thead>
          <tbody>
            {incomeItems.map((item, idx) => (
              <tr key={item.id} className="border-b border-dashed">
                <td className="py-2 text-muted-foreground">{idx + 1}</td>
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-muted-foreground">
                  {getLineItemTypeLabel(item.type)}
                </td>
                <td className="py-2 text-right font-mono">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2">
              <td colSpan={3} className="py-2 font-semibold text-right">
                Gross Rental
              </td>
              <td className="py-2 text-right font-mono font-semibold">
                {formatCurrency(payout.grossRental)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Deductions Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
          Deductions
        </h3>
        {deductionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No deductions for this period
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Description
                </th>
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-right py-2 font-medium text-muted-foreground">
                  Amount (RM)
                </th>
              </tr>
            </thead>
            <tbody>
              {deductionItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-dashed">
                  <td className="py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-muted-foreground">
                    {getLineItemTypeLabel(item.type)}
                  </td>
                  <td className="py-2 text-right font-mono text-red-600">
                    ({formatCurrency(Math.abs(item.amount))})
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td colSpan={3} className="py-2 font-semibold text-right">
                  Total Deductions
                </td>
                <td className="py-2 text-right font-mono font-semibold text-red-600">
                  ({formatCurrency(totalDeductions)})
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <Separator className="my-6" />

      {/* Net Payout */}
      <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
        <div>
          <p className="text-lg font-semibold">Net Payout</p>
          <p className="text-xs text-muted-foreground">
            Gross Rental − Total Deductions
          </p>
        </div>
        <p className="text-2xl font-bold text-green-600">
          {formatCurrency(payout.netPayout)}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t text-center">
        <p className="text-xs text-muted-foreground">
          This is a computer-generated statement. No signature is required.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Zam-Property Platform • {payout.payoutNumber}
        </p>
      </div>
    </div>
  );
}
