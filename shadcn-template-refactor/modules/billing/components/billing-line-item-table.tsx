// =============================================================================
// BillingLineItemTable — Table showing billing line item breakdown
// =============================================================================
// Displays line items grouped by type with subtotals.
// Shows: Rent + Utilities + Late Fees − Deductions = Total Due
// =============================================================================

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import type { BillingLineItem } from "../types";
import { BillingLineItemType } from "../types";

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

/** Display label for line item types */
const LINE_ITEM_TYPE_LABELS: Record<BillingLineItemType, string> = {
  [BillingLineItemType.RENT]: "Rent",
  [BillingLineItemType.UTILITY]: "Utility",
  [BillingLineItemType.LATE_FEE]: "Late Fee",
  [BillingLineItemType.CLAIM_DEDUCTION]: "Deduction",
  [BillingLineItemType.OTHER]: "Other",
};

/** Badge variant for line item types */
function getTypeVariant(
  type: BillingLineItemType
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case BillingLineItemType.RENT:
      return "default";
    case BillingLineItemType.UTILITY:
      return "secondary";
    case BillingLineItemType.LATE_FEE:
      return "destructive";
    case BillingLineItemType.CLAIM_DEDUCTION:
      return "outline";
    default:
      return "secondary";
  }
}

/** Check if a line item type is a deduction (negative amount contribution) */
function isDeduction(type: BillingLineItemType): boolean {
  return type === BillingLineItemType.CLAIM_DEDUCTION;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillingLineItemTableProps {
  lineItems: BillingLineItem[];
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillingLineItemTable({
  lineItems,
  totalAmount,
}: BillingLineItemTableProps) {
  if (!lineItems || lineItems.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        No line items available
      </div>
    );
  }

  // Sort: RENT first, then UTILITY, LATE_FEE, OTHER, CLAIM_DEDUCTION last
  const sortOrder: Record<BillingLineItemType, number> = {
    [BillingLineItemType.RENT]: 0,
    [BillingLineItemType.UTILITY]: 1,
    [BillingLineItemType.LATE_FEE]: 2,
    [BillingLineItemType.OTHER]: 3,
    [BillingLineItemType.CLAIM_DEDUCTION]: 4,
  };

  const sorted = [...lineItems].sort(
    (a, b) =>
      (sortOrder[a.type] ?? 99) - (sortOrder[b.type] ?? 99)
  );

  // Calculate subtotals by type
  const charges = sorted.filter((li) => !isDeduction(li.type));
  const deductions = sorted.filter((li) => isDeduction(li.type));
  const chargesTotal = charges.reduce((sum, li) => sum + li.amount, 0);
  const deductionsTotal = deductions.reduce((sum, li) => sum + li.amount, 0);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Charges */}
          {charges.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.description}</TableCell>
              <TableCell>
                <Badge variant={getTypeVariant(item.type)} className="text-xs">
                  {LINE_ITEM_TYPE_LABELS[item.type] ?? item.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.amount)}
              </TableCell>
            </TableRow>
          ))}

          {/* Deductions (shown separately with negative sign) */}
          {deductions.length > 0 && (
            <>
              <TableRow className="bg-muted/30">
                <TableCell
                  colSpan={2}
                  className="text-xs font-medium text-muted-foreground uppercase"
                >
                  Subtotal (Charges)
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(chargesTotal)}
                </TableCell>
              </TableRow>
              {deductions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getTypeVariant(item.type)}
                      className="text-xs"
                    >
                      {LINE_ITEM_TYPE_LABELS[item.type] ?? item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    −{formatCurrency(Math.abs(item.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="font-semibold">
              Total Due
            </TableCell>
            <TableCell className="text-right font-bold text-lg">
              {formatCurrency(totalAmount)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function BillingLineItemTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-5 w-24" />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
