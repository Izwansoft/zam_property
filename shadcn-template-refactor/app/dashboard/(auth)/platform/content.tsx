// =============================================================================
// Platform Dashboard — Client Content
// =============================================================================
// Modern bento grid dashboard with gradients, hero stats, and visual charts.
// =============================================================================

"use client";

import {
  FileText,
  Clock,
  AlertTriangle,
  Store,
  Activity,
  BarChart3,
} from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Bar,
  BarChart,
  XAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { usePlatformAnalytics } from "@/modules/analytics/hooks/use-platform-analytics";
import { statusArrayToMap } from "@/modules/analytics/types";
import { ActivityFeedWidget } from "@/modules/activity/components/activity-feed-widget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Chart Configs
// ---------------------------------------------------------------------------

const vendorStatusConfig: ChartConfig = {
  ACTIVE: { label: "Active", color: "hsl(142 76% 36%)" },
  PENDING: { label: "Pending", color: "hsl(38 92% 50%)" },
  SUSPENDED: { label: "Suspended", color: "hsl(0 84% 60%)" },
  INACTIVE: { label: "Inactive", color: "hsl(215 16% 47%)" },
};

const listingStatusConfig: ChartConfig = {
  PUBLISHED: { label: "Published", color: "hsl(142 76% 36%)" },
  DRAFT: { label: "Draft", color: "hsl(215 16% 47%)" },
  PENDING_REVIEW: { label: "Pending", color: "hsl(38 92% 50%)" },
  ARCHIVED: { label: "Archived", color: "hsl(262 83% 58%)" },
  REJECTED: { label: "Rejected", color: "hsl(0 84% 60%)" },
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "hsl(142 76% 36%)",
  PENDING: "hsl(38 92% 50%)",
  SUSPENDED: "hsl(0 84% 60%)",
  INACTIVE: "hsl(215 16% 47%)",
  PUBLISHED: "hsl(142 76% 36%)",
  DRAFT: "hsl(215 16% 47%)",
  PENDING_REVIEW: "hsl(38 92% 50%)",
  ARCHIVED: "hsl(262 83% 58%)",
  REJECTED: "hsl(0 84% 60%)",
};

// ---------------------------------------------------------------------------
// Hero Stat Card (Gradient)
// ---------------------------------------------------------------------------

interface HeroStatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg?: string;
}

function HeroStatCard({ title, value, subtitle, icon: Icon, gradient, iconBg = "bg-white/20" }: HeroStatCardProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-6 text-white", gradient)}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">{value.toLocaleString()}</p>
          {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
        </div>
        <div className={cn("rounded-xl p-3", iconBg)}>
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}

function HeroStatSkeleton({ gradient }: { gradient: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-6", gradient)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="h-10 w-20 bg-white/20" />
          <Skeleton className="h-3 w-32 bg-white/20" />
        </div>
        <Skeleton className="size-12 rounded-xl bg-white/20" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bento Stat Card (Small)
// ---------------------------------------------------------------------------

interface BentoStatProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
}

function BentoStat({ title, value, icon: Icon, iconColor, bgColor }: BentoStatProps) {
  return (
    <Card className="border-0 bg-linear-to-br from-background to-muted/30 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("rounded-xl p-3", bgColor)}>
          <Icon className={cn("size-5", iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BentoStatSkeleton() {
  return (
    <Card className="border-0 bg-linear-to-br from-background to-muted/30">
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="size-11 rounded-xl" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Radial Progress Card (Bento)
// ---------------------------------------------------------------------------

interface RadialProgressProps {
  title: string;
  value: number;
  max: number;
  label: string;
  color: string;
  description?: string;
}

function RadialProgress({ title, value, max, label, color, description }: RadialProgressProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const endAngle = 90 - (percentage / 100) * 360;
  
  const chartData = [{ value: 100, fill: color }];
  const chartConfig = { value: { label, color } } satisfies ChartConfig;

  return (
    <Card className="border-0 bg-linear-to-br from-background to-muted/30 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-4">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-32 w-full">
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={endAngle}
            innerRadius={45}
            outerRadius={60}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[49, 41]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 4} className="fill-foreground text-xl font-bold">
                          {percentage}%
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-[10px]">
                          {value}/{max}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function RadialProgressSkeleton() {
  return (
    <Card className="border-0 bg-linear-to-br from-background to-muted/30">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-4">
        <Skeleton className="size-32 rounded-full" />
        <Skeleton className="mt-2 h-3 w-16" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart Card
// ---------------------------------------------------------------------------

interface DonutChartProps {
  title: string;
  description?: string;
  data: { name: string; value: number; fill: string }[];
  config: ChartConfig;
  total: number;
  className?: string;
}

function DonutChart({ title, description, data, config, total, className }: DonutChartProps) {
  const hasData = data.length > 0 && data.some(d => d.value > 0);
  
  return (
    <Card className={cn("border-0 bg-linear-to-br from-background to-muted/30 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {hasData ? (
            <ChartContainer config={config} className="aspect-square h-32 w-32 shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={35}
                  outerRadius={50}
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-lg font-bold">
                              {total}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-32 w-32 items-center justify-center">
              <p className="text-xs text-muted-foreground">No data</p>
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-col gap-1.5">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="text-muted-foreground truncate">{config[item.name]?.label || item.name}</span>
                <span className="font-semibold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-0 bg-linear-to-br from-background to-muted/30", className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Skeleton className="size-32 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bar Chart Card
// ---------------------------------------------------------------------------

interface BarChartCardProps {
  title: string;
  description?: string;
  data: { name: string; count: number }[];
  className?: string;
}

function BarChartCard({ title, description, data, className }: BarChartCardProps) {
  const chartConfig = {
    count: { label: "Count", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;
  
  const hasData = data.length > 0 && data.some(d => d.count > 0);

  return (
    <Card className={cn("border-0 bg-linear-to-br from-background to-muted/30 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <BarChart3 className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 10 }} 
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted-foreground">No interaction data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-0 bg-linear-to-br from-background to-muted/30", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PlatformDashboardContent() {
  const { data, isLoading } = usePlatformAnalytics();

  // Convert arrays to maps for easier access
  const vendorsByStatus = data?.vendorsByStatus ? statusArrayToMap(data.vendorsByStatus) : {};
  const listingsByStatus = data?.listingsByStatus ? statusArrayToMap(data.listingsByStatus) : {};
  const interactionsByType = data?.interactionsLast7DaysByType ? statusArrayToMap(data.interactionsLast7DaysByType) : {};
  
  // Compute totals
  const totalVendors = Object.values(vendorsByStatus).reduce((a, b) => a + b, 0);
  const totalListings = Object.values(listingsByStatus).reduce((a, b) => a + b, 0);
  const activeVendors = vendorsByStatus["ACTIVE"] ?? 0;
  const publishedListings = listingsByStatus["PUBLISHED"] ?? 0;
  const pendingVendors = data?.pendingVendors ?? 0;
  const pendingReviews = data?.pendingReviews ?? 0;

  // Chart data
  const vendorPieData = Object.entries(vendorsByStatus).map(([name, value]) => ({
    name,
    value,
    fill: STATUS_COLORS[name] || "hsl(var(--muted))",
  }));

  const listingPieData = Object.entries(listingsByStatus).map(([name, value]) => ({
    name,
    value,
    fill: STATUS_COLORS[name] || "hsl(var(--muted))",
  }));

  const interactionBarData = Object.entries(interactionsByType).map(([name, count]) => ({
    name: name.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of your marketplace platform.</p>
      </div>

      {/* Hero Stats - Gradient Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          <>
            <HeroStatSkeleton gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
            <HeroStatSkeleton gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          </>
        ) : (
          <>
            <HeroStatCard
              title="Total Vendors"
              value={totalVendors}
              subtitle={`${activeVendors} currently active`}
              icon={Store}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <HeroStatCard
              title="Total Listings"
              value={totalListings}
              subtitle={`${publishedListings} published live`}
              icon={FileText}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
          </>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Small Stats */}
        {isLoading ? (
          <>
            <BentoStatSkeleton />
            <BentoStatSkeleton />
          </>
        ) : (
          <>
            <BentoStat
              title="Pending Vendors"
              value={pendingVendors}
              icon={Clock}
              iconColor="text-amber-600"
              bgColor="bg-amber-100 dark:bg-amber-500/20"
            />
            <BentoStat
              title="Pending Reviews"
              value={pendingReviews}
              icon={AlertTriangle}
              iconColor="text-red-600"
              bgColor="bg-red-100 dark:bg-red-500/20"
            />
          </>
        )}
        
        {/* Radial Progress */}
        {isLoading ? (
          <>
            <RadialProgressSkeleton />
            <RadialProgressSkeleton />
          </>
        ) : (
          <>
            <RadialProgress
              title="Active Vendors"
              value={activeVendors}
              max={totalVendors}
              label="Active Rate"
              color="hsl(142 76% 36%)"
              description="Currently active"
            />
            <RadialProgress
              title="Published Listings"
              value={publishedListings}
              max={totalListings}
              label="Publish Rate"
              color="hsl(221 83% 53%)"
              description="Live on platform"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {isLoading ? (
          <>
            <DonutChartSkeleton />
            <DonutChartSkeleton />
            <BarChartSkeleton className="lg:col-span-1" />
          </>
        ) : (
          <>
            <DonutChart
              title="Vendors by Status"
              description="Distribution breakdown"
              data={vendorPieData}
              config={vendorStatusConfig}
              total={totalVendors}
            />
            <DonutChart
              title="Listings by Status"
              description="Distribution breakdown"
              data={listingPieData}
              config={listingStatusConfig}
              total={totalListings}
            />
            <BarChartCard
              title="Interactions"
              description="Last 7 days by type"
              data={interactionBarData}
            />
          </>
        )}
      </div>

      {/* Activity Feed */}
      <Card className="border-0 bg-linear-to-br from-background to-muted/30 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Activity className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest platform actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ActivityFeedWidget
            portal="platform"
            limit={8}
            showInternalBadge
          />
        </CardContent>
      </Card>
    </div>
  );
}
