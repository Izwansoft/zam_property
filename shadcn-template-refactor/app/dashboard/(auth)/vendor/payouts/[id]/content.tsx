// =============================================================================
// VendorPayoutDetailContent — Payout detail page content
// =============================================================================

"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  PayoutDetail,
  PayoutDetailSkeleton,
} from "@/modules/payout/components";

export function VendorPayoutDetailContent() {
  const router = useRouter();
  const params = useParams();
  const payoutId = params.id as string;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/vendor/payouts")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Payout Detail
            </h1>
            <p className="text-muted-foreground">
              View payout breakdown, line items, and statement
            </p>
          </div>
        </div>
      </div>

      {/* Detail */}
      <PayoutDetail payoutId={payoutId} />
    </div>
  );
}

// Export skeleton for loading state
export function VendorPayoutDetailContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>
      <PayoutDetailSkeleton />
    </div>
  );
}
