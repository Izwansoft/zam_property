// =============================================================================
// Vendor Dashboard — Client Content
// =============================================================================
// Uses useVendorAnalytics + useVendorListingAnalytics for vendor performance:
// KPI cards, listing-level breakdown table, and export.
// =============================================================================

"use client";

import {
  useVendorAnalytics,
  useVendorListingAnalytics,
} from "@/modules/analytics/hooks/use-vendor-analytics";
import { useAnalyticsDateRange } from "@/modules/analytics/hooks/use-analytics-date-range";
import { DashboardStats } from "@/modules/analytics/components/dashboard-stats";
import { AnalyticsDateRangePicker } from "@/modules/analytics/components/analytics-date-range-picker";
import { TopItemsTable } from "@/modules/analytics/components/top-items-table";
import { ExportButton } from "@/modules/analytics/components/export-button";
import { ActivityFeedWidget } from "@/modules/activity/components/activity-feed-widget";
import { useAuthUser } from "@/modules/auth";
import type { TopItem } from "@/modules/analytics/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LISTING_COLUMNS = {
  viewsCount: "Views",
  leadsCount: "Leads",
  enquiriesCount: "Enquiries",
  bookingsCount: "Bookings",
};

const EXPORT_COLUMNS = {
  listingId: "Listing ID",
  verticalType: "Vertical",
  viewsCount: "Views",
  leadsCount: "Leads",
  enquiriesCount: "Enquiries",
  bookingsCount: "Bookings",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorDashboardContent() {
  const user = useAuthUser();
  const vendorId = user.primaryVendorId ?? "";

  const {
    dateRange,
    preset,
    startDate,
    endDate,
    setPreset,
    setCustomRange,
  } = useAnalyticsDateRange("30d");

  const { data: overview, isLoading: overviewLoading } = useVendorAnalytics({
    vendorId,
    ...dateRange,
  });

  const { data: listings, isLoading: listingsLoading } =
    useVendorListingAnalytics({
      vendorId,
      ...dateRange,
    });

  // Transform listing items to TopItem format
  const topItems: TopItem[] =
    listings?.items
      ?.sort((a, b) => b.viewsCount - a.viewsCount)
      .map((item) => ({
        id: item.listingId,
        label: item.listingId,
        subLabel: item.verticalType,
        metrics: {
          viewsCount: item.viewsCount,
          leadsCount: item.leadsCount,
          enquiriesCount: item.enquiriesCount,
          bookingsCount: item.bookingsCount,
        },
      })) ?? [];

  // Export data
  const exportData =
    listings?.items?.map((item) => ({
      listingId: item.listingId,
      verticalType: item.verticalType,
      viewsCount: item.viewsCount,
      leadsCount: item.leadsCount,
      enquiriesCount: item.enquiriesCount,
      bookingsCount: item.bookingsCount,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header with date picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your listing performance, leads, and enquiries.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AnalyticsDateRangePicker
            preset={preset}
            startDate={startDate}
            endDate={endDate}
            onPresetChange={setPreset}
            onCustomRangeChange={setCustomRange}
          />
          <ExportButton
            data={exportData}
            columns={EXPORT_COLUMNS}
            fileName={`vendor-analytics-${dateRange.startDate}-${dateRange.endDate}`}
            disabled={listingsLoading}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardStats
        totals={overview?.totals}
        isLoading={overviewLoading}
      />

      {/* Top Listings Table */}
      <TopItemsTable
        title="Top Listings"
        description="Your best-performing listings by views"
        items={topItems}
        columns={LISTING_COLUMNS}
        limit={5}
        isLoading={listingsLoading}
      />

      {/* Recent Activity */}
      <ActivityFeedWidget
        portal="vendor"
        title="Recent Activity"
        description="Your latest listing and inquiry activity"
        limit={8}
        hideInternal
      />
    </div>
  );
}
