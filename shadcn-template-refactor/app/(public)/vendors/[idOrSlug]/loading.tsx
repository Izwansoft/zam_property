/**
 * Public Vendor Profile - Loading State
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function VendorLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>

      {/* Vendor Header Skeleton */}
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <Separator />
              <div className="space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 animate-pulse rounded-lg border bg-muted" />
                <div className="h-20 animate-pulse rounded-lg border bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4 lg:col-span-2">
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="aspect-[4/3] animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
