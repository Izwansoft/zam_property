// =============================================================================
// Analytics Charts — Line, Bar, and Pie chart wrappers
// =============================================================================
// Wraps shadcn's ChartContainer with Recharts for analytics dashboards.
// Provides simple, readable charts with consistent styling.
// =============================================================================

"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDataPoint, PieChartSlice } from "../types";

// ---------------------------------------------------------------------------
// Default Colors
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// ---------------------------------------------------------------------------
// Line Chart
// ---------------------------------------------------------------------------

export interface AnalyticsLineChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  /** Data keys to plot (e.g. ["viewsCount", "leadsCount"]) */
  dataKeys: string[];
  /** Chart config for labels & colors */
  config: ChartConfig;
  /** X-axis data key (default: "name") */
  xAxisKey?: string;
  /** Height in pixels (default: 300) */
  height?: number;
  isLoading?: boolean;
  className?: string;
}

export function AnalyticsLineChart({
  title,
  description,
  data,
  dataKeys,
  config,
  xAxisKey = "name",
  height = 300,
  isLoading = false,
  className,
}: AnalyticsLineChartProps) {
  if (isLoading) {
    return <ChartSkeleton title={title} height={height} className={className} />;
  }

  if (data.length === 0) {
    return <ChartEmpty title={title} description={description} height={height} className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className={`h-[${height}px] w-full`}>
          <RechartsLineChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {dataKeys.length > 1 && (
              <ChartLegend content={<ChartLegendContent />} />
            )}
            {dataKeys.map((key, idx) => (
              <Line
                key={key}
                dataKey={key}
                type="monotone"
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bar Chart
// ---------------------------------------------------------------------------

export interface AnalyticsBarChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  /** Data keys to plot */
  dataKeys: string[];
  /** Chart config for labels & colors */
  config: ChartConfig;
  /** X-axis data key (default: "name") */
  xAxisKey?: string;
  /** Whether bars should be stacked */
  stacked?: boolean;
  /** Height in pixels (default: 300) */
  height?: number;
  isLoading?: boolean;
  className?: string;
}

export function AnalyticsBarChart({
  title,
  description,
  data,
  dataKeys,
  config,
  xAxisKey = "name",
  stacked = false,
  height = 300,
  isLoading = false,
  className,
}: AnalyticsBarChartProps) {
  if (isLoading) {
    return <ChartSkeleton title={title} height={height} className={className} />;
  }

  if (data.length === 0) {
    return <ChartEmpty title={title} description={description} height={height} className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className={`h-[${height}px] w-full`}>
          <RechartsBarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {dataKeys.length > 1 && (
              <ChartLegend content={<ChartLegendContent />} />
            )}
            {dataKeys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Pie Chart
// ---------------------------------------------------------------------------

export interface AnalyticsPieChartProps {
  title: string;
  description?: string;
  data: PieChartSlice[];
  /** Chart config for labels & colors */
  config: ChartConfig;
  /** Height in pixels (default: 300) */
  height?: number;
  isLoading?: boolean;
  className?: string;
}

export function AnalyticsPieChart({
  title,
  description,
  data,
  config,
  height = 300,
  isLoading = false,
  className,
}: AnalyticsPieChartProps) {
  if (isLoading) {
    return <ChartSkeleton title={title} height={height} className={className} />;
  }

  if (data.length === 0) {
    return <ChartEmpty title={title} description={description} height={height} className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className={`h-[${height}px] w-full`}>
          <RechartsPieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.name}
                  fill={entry.fill ?? CHART_COLORS[idx % CHART_COLORS.length]}
                />
              ))}
            </Pie>
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Chart Skeleton (shared)
// ---------------------------------------------------------------------------

function ChartSkeleton({
  title,
  height = 300,
  className,
}: {
  title: string;
  height?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className={`h-[${height}px] w-full`} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Chart Empty State
// ---------------------------------------------------------------------------

function ChartEmpty({
  title,
  description,
  height = 300,
  className,
}: {
  title: string;
  description?: string;
  height?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div
          className="flex items-center justify-center rounded-md border border-dashed text-muted-foreground"
          style={{ height }}
        >
          No data available for this period
        </div>
      </CardContent>
    </Card>
  );
}
