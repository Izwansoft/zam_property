// =============================================================================
// VendorTenanciesContent — Owner's view of all tenancies
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  OwnerTenancyList,
  OwnerTenancyListSkeleton,
} from "@/modules/tenancy/components";

export function VendorTenanciesContent() {
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
              <Building2 className="h-6 w-6" />
              My Tenancies
            </h1>
            <p className="text-muted-foreground">
              Manage tenancies across all your properties
            </p>
          </div>
        </div>
      </div>

      {/* Tenancy List with Summary, Filters, and Grouping */}
      <OwnerTenancyList
        basePath="/dashboard/vendor/tenancies"
        showSummary
        defaultViewMode="grouped"
      />
    </div>
  );
}

// Export skeleton for loading state
export function VendorTenanciesContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
        </div>
      </div>
      <OwnerTenancyListSkeleton />
    </div>
  );
}
