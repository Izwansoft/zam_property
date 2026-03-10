// =============================================================================
// Partner Dashboard — Client Content
// =============================================================================
// Uses usePartnerAnalytics to display marketplace analytics:
// KPI cards (views, leads, enquiries, bookings) with date range picker.
// =============================================================================

"use client";

import { usePartnerAnalytics } from "@/modules/analytics/hooks/use-partner-analytics";
import { useAnalyticsDateRange } from "@/modules/analytics/hooks/use-analytics-date-range";
import { DashboardStats } from "@/modules/analytics/components/dashboard-stats";
import { AnalyticsDateRangePicker } from "@/modules/analytics/components/analytics-date-range-picker";
import { AnalyticsBarChart } from "@/modules/analytics/components/analytics-charts";
import { ActivityFeedWidget } from "@/modules/activity/components/activity-feed-widget";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Building2, CalendarRange, Eye, PhoneCall, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Chart Config
// ---------------------------------------------------------------------------

const metricsConfig: ChartConfig = {
  viewsCount: { label: "Views", color: "var(--chart-1)" },
  leadsCount: { label: "Leads", color: "var(--chart-2)" },
  enquiriesCount: { label: "Enquiries", color: "var(--chart-3)" },
  bookingsCount: { label: "Bookings", color: "var(--chart-4)" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerDashboardContent() {
  const {
    dateRange,
    preset,
    startDate,
    endDate,
    setPreset,
    setCustomRange,
  } = useAnalyticsDateRange("30d");

  const { data, isLoading } = usePartnerAnalytics(dateRange);
  const totals = data?.totals;

  const conversionRate = totals && totals.viewsCount > 0
    ? Math.round((totals.leadsCount / totals.viewsCount) * 1000) / 10
    : 0;

  // Build bar chart data from totals (single row comparison)
  const barData = totals
    ? [
        { name: "Views", count: totals.viewsCount },
        { name: "Leads", count: totals.leadsCount },
        { name: "Enquiries", count: totals.enquiriesCount },
        { name: "Bookings", count: totals.bookingsCount },
      ]
    : [];

  const barConfig: ChartConfig = {
    count: { label: "Count", color: "var(--chart-1)" },
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-0 bg-linear-to-br from-cyan-600 via-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Marketplace Intelligence
              </Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Partner Overview</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/85 md:text-base">
                  Live signal on demand generation, lead quality, and conversion momentum.
                </p>
              </div>
            </div>
            <AnalyticsDateRangePicker
              preset={preset}
              startDate={startDate}
              endDate={endDate}
              onPresetChange={setPreset}
              onCustomRangeChange={setCustomRange}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/75">Conversion</p>
              <p className="mt-2 text-2xl font-semibold">{isLoading ? "--" : `${conversionRate}%`}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/75">Date Window</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                <CalendarRange className="h-4 w-4" />
                {dateRange.startDate} to {dateRange.endDate}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/75">Top Driver</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                <ArrowUpRight className="h-4 w-4" />
                Views remain your strongest top-of-funnel signal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DashboardStats totals={totals} isLoading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <AnalyticsBarChart
          title="Performance Overview"
          description={`${dateRange.startDate} to ${dateRange.endDate}`}
          data={barData}
          dataKeys={["count"]}
          config={barConfig}
          isLoading={isLoading}
          className="lg:col-span-2"
        />

        <Card>
          <CardHeader>
            <CardTitle>Demand Spotlight</CardTitle>
            <CardDescription>Quick health checks for your pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-cyan-600" />
                Listing views
              </div>
              <span className="font-semibold">{isLoading ? "--" : totals?.viewsCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <PhoneCall className="h-4 w-4 text-emerald-600" />
                Total enquiries
              </div>
              <span className="font-semibold">{isLoading ? "--" : totals?.enquiriesCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Confirmed bookings
              </div>
              <span className="font-semibold">{isLoading ? "--" : totals?.bookingsCount ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <ActivityFeedWidget
        portal="partner"
        title="Recent Activity"
        description="Latest actions in your marketplace"
        limit={10}
      />
    </div>
  );
}
