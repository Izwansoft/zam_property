"use client";

import { Building2 } from "lucide-react";
import {
  OwnerTenancyList,
  OwnerTenancyListSkeleton,
} from "@/modules/tenancy/components";

export function CompanyTenanciesContent() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Company Tenancies
        </h1>
        <p className="text-muted-foreground">
          Track all tenancy lifecycle activity across your managed properties.
        </p>
      </div>

      <OwnerTenancyList
        basePath="/dashboard/company/tenancies"
        showSummary
        defaultViewMode="grouped"
      />
    </div>
  );
}

export function CompanyTenanciesContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <OwnerTenancyListSkeleton />
    </div>
  );
}
