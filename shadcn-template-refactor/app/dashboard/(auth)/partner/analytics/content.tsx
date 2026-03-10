"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListings } from "@/modules/listing/hooks/use-listings";
import { useReviews } from "@/modules/review/hooks/use-reviews";
import { useVendors } from "@/modules/vendor/hooks/use-vendors";

export function PartnerAnalyticsContent() {
  const vendors = useVendors({ page: 1, pageSize: 1 });
  const listings = useListings({ page: 1, pageSize: 1 });
  const reviews = useReviews({ page: 1, pageSize: 1 });

  const totalVendors = vendors.data?.pagination.total ?? 0;
  const totalListings = listings.data?.pagination.total ?? 0;
  const totalReviews = reviews.data?.pagination.total ?? 0;

  const pendingVendors = useVendors({ page: 1, pageSize: 1, status: "PENDING" });
  const pendingReviews = useReviews({ page: 1, pageSize: 1, status: "PENDING" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Insights for vendors, listings, and reviews in your partner organization."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Vendors</CardDescription>
            <CardTitle className="text-2xl">{totalVendors}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Listings</CardDescription>
            <CardTitle className="text-2xl">{totalListings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
            <CardTitle className="text-2xl">{totalReviews}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Moderation</CardDescription>
            <CardTitle className="text-2xl">
              {(pendingVendors.data?.pagination.total ?? 0) +
                (pendingReviews.data?.pagination.total ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations Snapshot</CardTitle>
          <CardDescription>
            Quick links to the highest impact moderation and operations pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Baseline analytics are now live. Trend charts can be layered in next.
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link className="text-sm text-primary hover:underline" href="/dashboard/partner/listings/approvals">
              View Listing Approval Queue
            </Link>
            <Link className="text-sm text-primary hover:underline" href="/dashboard/partner/reviews">
              Review Moderation Board
            </Link>
            <Link className="text-sm text-primary hover:underline" href="/dashboard/partner/vendors">
              Vendor Performance Overview
            </Link>
            <Link className="text-sm text-primary hover:underline" href="/dashboard/partner/subscription">
              Subscription and Usage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
