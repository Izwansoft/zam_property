// =============================================================================
// Tenant Receipt — Client content component
// =============================================================================
// Fetches payment data based on ?paymentId query param and displays receipt.
// Route: /dashboard/tenant/bills/[id]/receipt?paymentId=xxx
// =============================================================================

"use client";

import { useParams, useSearchParams } from "next/navigation";

import { useBilling } from "@/modules/billing/hooks/useBilling";
import { useReceipt } from "@/modules/payment/hooks/useReceipt";
import {
  ReceiptViewer,
  ReceiptViewerSkeleton,
} from "@/modules/payment/components/receipt";
import { PageHeader } from "@/components/common/page-header";

export function TenantReceiptContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");

  const { data: billing } = useBilling(params.id);
  const {
    data: payment,
    isLoading,
    error,
  } = useReceipt({
    paymentId: paymentId ?? undefined,
    enabled: !!paymentId,
  });

  const backPath = `/dashboard/tenant/bills/${params.id}`;

  if (!paymentId) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader title="Payment Receipt" backHref={backPath} />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">No payment specified</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a payment from the bill detail page to view its
            receipt.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <ReceiptViewerSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader title="Payment Receipt" backHref={backPath} />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load receipt
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader title="Payment Receipt" backHref={backPath} />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Receipt not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The payment receipt you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <ReceiptViewer
        payment={payment}
        billNumber={billing?.billNumber}
        propertyName={billing?.tenancy?.listing.title}
        payerName={billing?.tenancy?.tenant.user.fullName}
        backPath={backPath}
      />
    </div>
  );
}
