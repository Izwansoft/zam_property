// =============================================================================
// CompanyDashboard — Main dashboard view for company admins
// =============================================================================
// Displays aggregate stats (Properties, Agents, Active Tenancies, Revenue),
// quick actions, and a recent activity feed.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Building2,
  ClipboardList,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ActivityFeedWidget } from "@/modules/activity/components/activity-feed-widget";
import { CompanyStatsCards } from "./company-stats-cards";
import type {
  CompanyDashboardStats,
  CompanyQuickAction,
} from "../types/dashboard";

// ---------------------------------------------------------------------------
// Mock data — will be replaced with API hooks in future sessions
// ---------------------------------------------------------------------------

const MOCK_STATS: CompanyDashboardStats = {
  totalProperties: 42,
  totalAgents: 8,
  activeTenancies: 31,
  totalRevenue: 156800,
  previousPeriod: {
    totalProperties: 38,
    totalAgents: 7,
    activeTenancies: 28,
    totalRevenue: 142500,
  },
};

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: CompanyQuickAction[] = [
  {
    label: "Add Agent",
    description: "Register a new agent to your company",
    href: "/dashboard/company/agents",
    icon: UserPlus,
  },
  {
    label: "View Properties",
    description: "Manage your company's property listings",
    href: "/dashboard/company/listings",
    icon: Building2,
  },
  {
    label: "View Tenancies",
    description: "Track active tenancy agreements",
    href: "/dashboard/company/tenancies",
    icon: ClipboardList,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompanyDashboard() {
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with useCompanyDashboardStats hook when backend endpoint exists
  const stats = MOCK_STATS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Company Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your company&apos;s properties, agents, and performance.
        </p>
      </div>

      {/* Stats Cards */}
      <CompanyStatsCards stats={stats} isLoading={isLoading} />

      {/* Quick Actions + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions — 1 column */}
        <QuickActionsCard actions={QUICK_ACTIONS} />

        {/* Activity Feed — 2 columns */}
        <div className="lg:col-span-2">
          <ActivityFeedWidget
            portal="company"
            title="Recent Activity"
            description="Latest updates across your company"
            limit={10}
            hideInternal
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick Actions Card
// ---------------------------------------------------------------------------

function QuickActionsCard({ actions }: { actions: CompanyQuickAction[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LayoutDashboard className="size-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              asChild
            >
              <Link href={action.href}>
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
                <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function CompanyDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>
      <CompanyStatsCards stats={undefined} isLoading />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
