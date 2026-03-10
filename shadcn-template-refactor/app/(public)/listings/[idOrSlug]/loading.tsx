/**
 * Public Listing Detail - Loading State
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ListingLoading() {
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

      {/* Gallery Skeleton */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:grid-rows-2">
        <div className="aspect-[4/3] animate-pulse rounded-lg bg-muted md:col-span-2 md:row-span-2 md:aspect-auto md:h-80" />
        <div className="hidden aspect-[4/3] animate-pulse rounded-lg bg-muted md:block" />
        <div className="hidden aspect-[4/3] animate-pulse rounded-lg bg-muted md:block" />
        <div className="hidden aspect-[4/3] animate-pulse rounded-lg bg-muted md:block" />
        <div className="hidden aspect-[4/3] animate-pulse rounded-lg bg-muted md:block" />
      </div>

      {/* Content Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader className="space-y-4 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="h-8 w-72 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-8 w-36 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-3 pt-6">
              <div className="h-6 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-36 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-20 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
