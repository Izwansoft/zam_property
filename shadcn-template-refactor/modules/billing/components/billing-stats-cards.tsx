// =============================================================================
// BillingStatsCards — Summary cards for owner billing dashboard
// =============================================================================
// Displays aggregate billing statistics: Total Due, Collected, Overdue.
// Session 6.5 implementation.
// =============================================================================

"use client";

import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { BillingSummary } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BillingStatsCardsProps {
  summary: BillingSummary | undefined;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "destructive" | "warning";
}

function StatCard({
  title,
  value,
  description,
  icon,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "text-primary",
    success: "text-green-600 dark:text-green-400",
    destructive: "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
  };

  const bgStyles = {
    default: "bg-primary/10",
    success: "bg-green-100 dark:bg-green-900/30",
    destructive: "bg-destructive/10",
    warning: "bg-amber-100 dark:bg-amber-900/30",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgStyles[variant]}`}
        >
          <span className={variantStyles[variant]}>{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BillingStatsCards({
  summary,
  isLoading,
}: BillingStatsCardsProps) {
  if (isLoading) {
    return <BillingStatsCardsSkeleton />;
  }

  if (!summary) {
    return null;
  }

  const collectionRate =
    summary.totalBilled > 0
      ? Math.round((summary.totalPaid / summary.totalBilled) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Due"
        value={formatCurrency(summary.totalOutstanding)}
        description={`${summary.totalBills} total bill${summary.totalBills !== 1 ? "s" : ""}`}
        icon={<DollarSign className="h-4 w-4" />}
        variant="warning"
      />
      <StatCard
        title="Collected"
        value={formatCurrency(summary.totalPaid)}
        description={`${collectionRate}% collection rate`}
        icon={<TrendingUp className="h-4 w-4" />}
        variant="success"
      />
      <StatCard
        title="Overdue"
        value={
          summary.overdueCount > 0
            ? `${summary.overdueCount} bill${summary.overdueCount !== 1 ? "s" : ""}`
            : "None"
        }
        description={
          summary.overdueCount > 0
            ? "Requires follow-up"
            : "All payments on track"
        }
        icon={<AlertTriangle className="h-4 w-4" />}
        variant={summary.overdueCount > 0 ? "destructive" : "default"}
      />
      <StatCard
        title="Total Billed"
        value={formatCurrency(summary.totalBilled)}
        description={
          summary.lastPaymentDate
            ? `Last payment: ${new Date(summary.lastPaymentDate).toLocaleDateString("en-MY", { month: "short", day: "numeric" })}`
            : "No payments yet"
        }
        icon={<Receipt className="h-4 w-4" />}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function BillingStatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
