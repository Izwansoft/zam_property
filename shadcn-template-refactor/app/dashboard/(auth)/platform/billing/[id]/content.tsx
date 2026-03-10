"use client";

import { useParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { formatRelativeDate } from "@/modules/listing";
import type { Billing } from "@/modules/billing/types";

function formatCurrency(value: number): string {
  return `RM ${value.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`;
}

export function PlatformBillingDetailContent() {
  const params = useParams<{ id: string }>();
  const billId = params.id;

  const { data: bill, isLoading, error } = useApiQuery<Billing>({
    queryKey: queryKeys.rentBillings.detail("__admin__", billId),
    path: `/rent-billings/${billId}`,
    enabled: !!billId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading bill details...</div>;
  }

  if (error || !bill) {
    return (
      <div className="space-y-4">
        <PageHeader title="Bill Detail" backHref="/dashboard/platform/billing" />
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load bill details.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bill ${bill.billNumber}`}
        description={`Period ${bill.billingPeriod}`}
        backHref="/dashboard/platform/billing"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium">{bill.status}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-medium">{formatCurrency(bill.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-sm font-medium">{formatCurrency(bill.paidAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-sm font-medium">{formatCurrency(bill.balanceDue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Issued</p>
            <p className="text-sm font-medium">{formatRelativeDate(bill.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due</p>
            <p className="text-sm font-medium">{formatRelativeDate(bill.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm font-medium">{formatRelativeDate(bill.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Updated</p>
            <p className="text-sm font-medium">{formatRelativeDate(bill.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
