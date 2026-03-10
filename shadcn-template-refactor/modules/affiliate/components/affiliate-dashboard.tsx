// =============================================================================
// AffiliateDashboard — Main dashboard view for affiliate portal
// =============================================================================
// Displays referral code + shareable link, earnings stats, referral breakdown
// by type, recent referrals, payout history, and quick actions.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Users,
  UserCheck,
  WalletIcon,
  Copy,
  CheckIcon,
  LinkIcon,
  Share2,
  ArrowRight,
  LayoutDashboard,
  Clock,
  TrendingUp,
  UserPlus,
  Building2,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  MetricCard,
  MetricCardSkeleton,
} from "@/modules/analytics/components/metric-card";
import { ActivityFeedWidget } from "@/modules/activity/components/activity-feed-widget";
import {
  formatAffiliateAmount,
  generateReferralLink,
  REFERRAL_TYPE_CONFIG,
  REFERRAL_STATUS_CONFIG,
} from "../types";
import type {
  AffiliateEarnings,
  AffiliateReferral,
  AffiliatePayout,
  ReferralType,
} from "../types";

// ---------------------------------------------------------------------------
// Mock data — will be replaced with API hooks when affiliate profile
// endpoint integration is available
// ---------------------------------------------------------------------------

const MOCK_REFERRAL_CODE = "AFF-ZAM-9R4P";

const MOCK_EARNINGS: AffiliateEarnings = {
  totalEarnings: 6850,
  unpaidEarnings: 1200,
  pendingReferrals: 3,
  confirmedReferrals: 8,
  paidReferrals: 12,
  byType: [
    { type: "OWNER_REGISTRATION" as ReferralType, count: 5, totalAmount: 2500 },
    { type: "partner_BOOKING" as ReferralType, count: 12, totalAmount: 3600 },
    { type: "AGENT_SIGNUP" as ReferralType, count: 6, totalAmount: 750 },
  ],
};

const MOCK_RECENT_REFERRALS: AffiliateReferral[] = [
  {
    id: "ref-1",
    affiliateId: "aff-1",
    referralType: "partner_BOOKING",
    referredId: "user-1",
    commissionRate: 0.05,
    commissionAmount: 300,
    status: "CONFIRMED",
    confirmedAt: new Date().toISOString(),
    paidAt: null,
    notes: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "ref-2",
    affiliateId: "aff-1",
    referralType: "OWNER_REGISTRATION",
    referredId: "user-2",
    commissionRate: 0.1,
    commissionAmount: 500,
    status: "PENDING",
    confirmedAt: null,
    paidAt: null,
    notes: null,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "ref-3",
    affiliateId: "aff-1",
    referralType: "AGENT_SIGNUP",
    referredId: "user-3",
    commissionRate: 0.03,
    commissionAmount: 125,
    status: "PAID",
    confirmedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    notes: null,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

const MOCK_RECENT_PAYOUTS: AffiliatePayout[] = [
  {
    id: "pay-1",
    affiliateId: "aff-1",
    amount: 2500,
    status: "COMPLETED",
    processedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    reference: "PAY-2026-001",
    notes: null,
    createdAt: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
  {
    id: "pay-2",
    affiliateId: "aff-1",
    amount: 1200,
    status: "PENDING",
    processedAt: null,
    reference: null,
    notes: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Stat metrics configuration
// ---------------------------------------------------------------------------

interface AffiliateQuickAction {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_ACTIONS: AffiliateQuickAction[] = [
  {
    label: "View Referrals",
    description: "See all your referral activity",
    href: "/dashboard/affiliate/referrals",
    icon: Users,
  },
  {
    label: "Payout History",
    description: "View earnings and request payouts",
    href: "/dashboard/affiliate/payouts",
    icon: WalletIcon,
  },
  {
    label: "Share Link",
    description: "Copy your referral link to share",
    href: "#share",
    icon: Share2,
  },
];

// ---------------------------------------------------------------------------
// Referral Type Icons
// ---------------------------------------------------------------------------

const REFERRAL_TYPE_ICON: Record<ReferralType, React.ComponentType<{ className?: string }>> = {
  OWNER_REGISTRATION: Building2,
  partner_BOOKING: UserPlus,
  AGENT_SIGNUP: Briefcase,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AffiliateDashboard() {
  const [isLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // TODO: Replace with useAffiliateProfile(affiliateId) when integrated
  const referralCode = MOCK_REFERRAL_CODE;
  const earnings = MOCK_EARNINGS;
  const recentReferrals = MOCK_RECENT_REFERRALS;
  const recentPayouts = MOCK_RECENT_PAYOUTS;
  const referralLink = generateReferralLink(referralCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Affiliate Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track your referrals, earnings, and payouts.
        </p>
      </div>

      {/* Stats Cards */}
      <AffiliateStatsCards earnings={earnings} isLoading={isLoading} />

      {/* Referral Link Card */}
      <ReferralLinkCard
        code={referralCode}
        link={referralLink}
        codeCopied={codeCopied}
        linkCopied={linkCopied}
        onCopyCode={handleCopyCode}
        onCopyLink={handleCopyLink}
        isLoading={isLoading}
      />

      {/* Earnings by Type + Recent Referrals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EarningsByTypeCard earnings={earnings} isLoading={isLoading} />
        <RecentReferralsCard
          referrals={recentReferrals}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions — 1 column */}
        <div className="space-y-6">
          <QuickActionsCard actions={QUICK_ACTIONS} />
          <RecentPayoutsCard payouts={recentPayouts} isLoading={isLoading} />
        </div>

        {/* Activity Feed — 2 columns */}
        <div className="lg:col-span-2">
          <ActivityFeedWidget
            portal="account"
            title="Recent Activity"
            description="Your latest affiliate activity and updates"
            limit={10}
            hideInternal
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Affiliate Stats Cards
// ---------------------------------------------------------------------------

function AffiliateStatsCards({
  earnings,
  isLoading,
}: {
  earnings?: AffiliateEarnings;
  isLoading: boolean;
}) {
  if (isLoading || !earnings) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Total Earnings",
      value: earnings.totalEarnings,
      format: "currency" as const,
      icon: DollarSign,
      description: "Lifetime earnings from referrals",
    },
    {
      label: "Unpaid Balance",
      value: earnings.unpaidEarnings,
      format: "currency" as const,
      icon: WalletIcon,
      description: "Available for payout",
    },
    {
      label: "Total Referrals",
      value:
        earnings.pendingReferrals +
        earnings.confirmedReferrals +
        earnings.paidReferrals,
      format: "number" as const,
      icon: Users,
      description: `${earnings.confirmedReferrals} confirmed, ${earnings.pendingReferrals} pending`,
    },
    {
      label: "Conversion Rate",
      value:
        earnings.pendingReferrals +
          earnings.confirmedReferrals +
          earnings.paidReferrals >
        0
          ? Math.round(
              ((earnings.confirmedReferrals + earnings.paidReferrals) /
                (earnings.pendingReferrals +
                  earnings.confirmedReferrals +
                  earnings.paidReferrals)) *
                100
            )
          : 0,
      format: "percentage" as const,
      icon: TrendingUp,
      description: "Confirmed + paid referrals",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          format={metric.format}
          icon={metric.icon}
          description={metric.description}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Referral Link Card
// ---------------------------------------------------------------------------

function ReferralLinkCard({
  code,
  link,
  codeCopied,
  linkCopied,
  onCopyCode,
  onCopyLink,
  isLoading,
}: {
  code: string;
  link: string;
  codeCopied: boolean;
  linkCopied: boolean;
  onCopyCode: () => void;
  onCopyLink: () => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LinkIcon className="size-4" />
          Your Referral Link
        </CardTitle>
        <CardDescription>
          Share your unique link to earn commissions on every successful referral
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shareable Link */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Shareable Link
          </label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={link}
              className="font-mono text-sm"
            />
            <Button variant="outline" onClick={onCopyLink} className="shrink-0">
              {linkCopied ? (
                <CheckIcon className="mr-2 size-4 text-green-600" />
              ) : (
                <Copy className="mr-2 size-4" />
              )}
              {linkCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Referral Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-2.5">
              <code className="text-base font-mono font-semibold">{code}</code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onCopyCode}
              className="shrink-0"
            >
              {codeCopied ? (
                <CheckIcon className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Earnings by Type Card
// ---------------------------------------------------------------------------

function EarningsByTypeCard({
  earnings,
  isLoading,
}: {
  earnings: AffiliateEarnings;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4" />
          Earnings by Type
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {earnings.byType.map((item) => {
          const config = REFERRAL_TYPE_CONFIG[item.type];
          const Icon = REFERRAL_TYPE_ICON[item.type];
          return (
            <div
              key={item.type}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} referral{item.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold">
                {formatAffiliateAmount(item.totalAmount)}
              </span>
            </div>
          );
        })}

        {/* Total */}
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            Total ({earnings.pendingReferrals + earnings.confirmedReferrals + earnings.paidReferrals} referrals)
          </span>
          <span className="text-base font-bold">
            {formatAffiliateAmount(earnings.totalEarnings)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Recent Referrals Card
// ---------------------------------------------------------------------------

function RecentReferralsCard({
  referrals,
  isLoading,
}: {
  referrals: AffiliateReferral[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Users className="size-4" />
            Recent Referrals
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/affiliate/referrals">
              View All
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {referrals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No referrals yet. Share your link to get started!
          </p>
        ) : (
          referrals.map((referral) => {
            const typeConfig = REFERRAL_TYPE_CONFIG[referral.referralType];
            const statusConfig = REFERRAL_STATUS_CONFIG[referral.status];
            const Icon = REFERRAL_TYPE_ICON[referral.referralType];
            return (
              <div
                key={referral.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{typeConfig.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString("en-MY", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {formatAffiliateAmount(referral.commissionAmount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Recent Payouts Card
// ---------------------------------------------------------------------------

function RecentPayoutsCard({
  payouts,
  isLoading,
}: {
  payouts: AffiliatePayout[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Clock className="size-4" />
            Recent Payouts
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/affiliate/payouts">
              View All
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {payouts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No payouts yet.
          </p>
        ) : (
          payouts.map((payout) => {
            const statusConfig =
              payout.status === "COMPLETED"
                ? { label: "Completed", variant: "default" as const }
                : payout.status === "PROCESSING"
                  ? { label: "Processing", variant: "secondary" as const }
                  : payout.status === "FAILED"
                    ? { label: "Failed", variant: "destructive" as const }
                    : { label: "Pending", variant: "outline" as const };
            return (
              <div
                key={payout.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatAffiliateAmount(payout.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payout.createdAt).toLocaleDateString("en-MY", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quick Actions Card
// ---------------------------------------------------------------------------

function QuickActionsCard({ actions }: { actions: AffiliateQuickAction[] }) {
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
          const isExternal = action.href === "#share";
          return (
            <Button
              key={action.label}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              asChild={!isExternal}
              {...(isExternal ? {} : {})}
            >
              {isExternal ? (
                <span className="flex w-full items-center gap-3">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{action.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                  <ExternalLink className="ml-auto size-4 shrink-0 text-muted-foreground" />
                </span>
              ) : (
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
              )}
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

export function AffiliateDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
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
