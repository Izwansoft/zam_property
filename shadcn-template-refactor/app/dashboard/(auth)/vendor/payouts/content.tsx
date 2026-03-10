// =============================================================================
// VendorPayoutsContent — Owner payout list page content
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PayoutList, PayoutListSkeleton } from "@/modules/payout/components";

export function VendorPayoutsContent() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/vendor")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Payouts
            </h1>
            <p className="text-muted-foreground">
              Track your earnings and payout history
            </p>
          </div>
        </div>
      </div>

      {/* Payout List */}
      <PayoutList basePath="/dashboard/vendor/payouts" />
    </div>
  );
}

// Export skeleton for loading state
export function VendorPayoutsContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>
      <PayoutListSkeleton />
    </div>
  );
}
