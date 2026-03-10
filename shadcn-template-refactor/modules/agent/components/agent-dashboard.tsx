// =============================================================================
// AgentDashboard — Main dashboard view for agent portal
// =============================================================================
// Displays aggregate stats (Listings, Deals, Revenue, Commission),
// commission summary, referral code, quick actions, and activity feed.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  TrendingUpIcon,
  ArrowRight,
  LayoutDashboard,
  Copy,
  LinkIcon,
  CheckIcon,
  WalletIcon,
  Clock,
  CheckCircle,
  BadgeDollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ActivityFeedWidget } from "@/modules/activity/components/activity-feed-widget";
import { AgentStatsCards } from "./agent-stats-cards";
import { formatCommissionAmount } from "@/modules/commission/types";
import type {
  AgentDashboardStats,
  AgentQuickAction,
} from "../types/dashboard";
import type { CommissionSummary } from "@/modules/commission/types";

// ---------------------------------------------------------------------------
// Mock data — will be replaced with API hooks when agent profile endpoint
// (GET /agents/me) is available
// ---------------------------------------------------------------------------

const MOCK_STATS: AgentDashboardStats = {
  totalListings: 12,
  totalDeals: 8,
  totalRevenue: 48600,
  totalCommission: 4250,
  previousPeriod: {
    totalListings: 10,
    totalDeals: 6,
    totalRevenue: 38200,
    totalCommission: 3100,
  },
};

const MOCK_COMMISSION_SUMMARY: CommissionSummary = {
  totalCommissions: 8,
  totalAmount: 4250,
  pendingCount: 2,
  pendingAmount: 1200,
  approvedCount: 1,
  approvedAmount: 850,
  paidCount: 5,
  paidAmount: 2200,
};

const MOCK_REFERRAL_CODE = "AGT-ZAM-7K3X";

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: AgentQuickAction[] = [
  {
    label: "My Listings",
    description: "View and manage your assigned listings",
    href: "/dashboard/agent/listings",
    icon: Building2,
  },
  {
    label: "Commissions",
    description: "Track your earnings and payouts",
    href: "/dashboard/agent/commissions",
    icon: WalletIcon,
  },
  {
    label: "Performance",
    description: "View your sales performance metrics",
    href: "/dashboard/agent/performance",
    icon: TrendingUpIcon,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentDashboard() {
  const [isLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // TODO: Replace with useMyAgent() or useAgent(agentId) hook when
  // GET /agents/me endpoint is available
  const stats = MOCK_STATS;
  const commissionSummary = MOCK_COMMISSION_SUMMARY;
  const referralCode = MOCK_REFERRAL_CODE;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your listings, deals, and commission performance.
        </p>
      </div>

      {/* Stats Cards */}
      <AgentStatsCards stats={stats} isLoading={isLoading} />

      {/* Commission Summary + Referral Code */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Commission Summary */}
        <CommissionSummaryCard
          summary={commissionSummary}
          isLoading={isLoading}
        />

        {/* Referral Code */}
        <ReferralCodeCard
          code={referralCode}
          copied={copied}
          onCopy={handleCopyReferral}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions — 1 column */}
        <QuickActionsCard actions={QUICK_ACTIONS} />

        {/* Activity Feed — 2 columns */}
        <div className="lg:col-span-2">
          <ActivityFeedWidget
            portal="agent"
            title="Recent Activity"
            description="Your latest activity and updates"
            limit={10}
            hideInternal
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commission Summary Card
// ---------------------------------------------------------------------------

function CommissionSummaryCard({
  summary,
  isLoading,
}: {
  summary: CommissionSummary;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: "Pending",
      count: summary.pendingCount,
      amount: summary.pendingAmount,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Approved",
      count: summary.approvedCount,
      amount: summary.approvedAmount,
      icon: CheckCircle,
      color: "text-blue-600",
    },
    {
      label: "Paid",
      count: summary.paidCount,
      amount: summary.paidAmount,
      icon: BadgeDollarSign,
      color: "text-green-600",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <WalletIcon className="size-4" />
            Commission Summary
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/agent/commissions">
              View All
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Icon className={`size-5 ${item.color}`} />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} commission{item.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold">
                {formatCommissionAmount(item.amount)}
              </span>
            </div>
          );
        })}

        {/* Total */}
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            Total ({summary.totalCommissions} commissions)
          </span>
          <span className="text-base font-bold">
            {formatCommissionAmount(summary.totalAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Referral Code Card
// ---------------------------------------------------------------------------

function ReferralCodeCard({
  code,
  copied,
  onCopy,
  isLoading,
}: {
  code: string;
  copied: boolean;
  onCopy: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LinkIcon className="size-4" />
          Referral Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral code with potential partners or property owners to
          earn referral bonuses.
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3">
            <code className="text-lg font-mono font-semibold">{code}</code>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onCopy}
            className="shrink-0"
          >
            {copied ? (
              <CheckIcon className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/dashboard/agent/referrals">
            View Referral History
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quick Actions Card
// ---------------------------------------------------------------------------

function QuickActionsCard({ actions }: { actions: AgentQuickAction[] }) {
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

export function AgentDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>
      <AgentStatsCards stats={undefined} isLoading />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
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
