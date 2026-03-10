// =============================================================================
// Tenant Tenancy List Loading — Suspense fallback
// =============================================================================

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function TenancyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="aspect-[4/3] w-full shrink-0 rounded-none sm:aspect-square sm:w-40" />
        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="hidden h-5 w-20 sm:block" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function TenancyListLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* Cards skeleton */}
      <div className="space-y-4">
        <TenancyCardSkeleton />
        <TenancyCardSkeleton />
        <TenancyCardSkeleton />
      </div>
    </div>
  );
}
