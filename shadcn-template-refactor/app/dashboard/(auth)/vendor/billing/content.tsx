// =============================================================================
// VendorBillingContent — Owner billing dashboard page content
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  OwnerBillingDashboard,
  OwnerBillingDashboardSkeleton,
} from "@/modules/billing/components";

export function VendorBillingContent() {
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
              <Receipt className="h-6 w-6" />
              Billing
            </h1>
            <p className="text-muted-foreground">
              Collection status across all your properties
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <OwnerBillingDashboard
        basePath="/dashboard/vendor/billing"
        showGrouping
      />
    </div>
  );
}

// Export skeleton for loading state
export function VendorBillingContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>
      <OwnerBillingDashboardSkeleton />
    </div>
  );
}
