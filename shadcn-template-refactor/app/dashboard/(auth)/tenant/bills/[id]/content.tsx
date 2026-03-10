// =============================================================================
// Tenant Bill Detail — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/common/page-header";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import { useBilling } from "@/modules/billing/hooks/useBilling";
import { usePaymentsByBilling } from "@/modules/billing/hooks/usePaymentsByBilling";
import {
  BillDetail,
  BillDetailSkeleton,
} from "@/modules/billing/components/bill-detail";

export function TenantBillDetailContent() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const partnerId = usePartnerId();
  const PartnerKey = partnerId ?? "__no_tenant__";

  const { data: billing, isLoading, error } = useBilling(params.id);
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
  } = usePaymentsByBilling(params.id);

  const handlePaymentSuccess = () => {
    // Invalidate billing detail and payment list to reflect new payment
    queryClient.invalidateQueries({
      queryKey: queryKeys.rentBillings.detail(PartnerKey, params.id),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.rentPayments.byBilling(PartnerKey, params.id),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.rentBillings.all(PartnerKey),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <BillDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader title="Bill Detail" backHref="/dashboard/tenant/bills" />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load bill
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader title="Bill Detail" backHref="/dashboard/tenant/bills" />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Bill not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The bill you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <BillDetail
        billing={billing}
        payments={paymentsData?.items ?? []}
        paymentsLoading={paymentsLoading}
        backPath="/dashboard/tenant/bills"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
