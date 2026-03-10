// =============================================================================
// PartnerDetailView — Composite detail view for a single partner
// =============================================================================

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  Building,
  Globe,
  Mail,
  Users,
  FileText,
  Clock,
  Eye,
  Calendar,
  Shield,
  AlertTriangle,
  Settings,
  HardDrive,
  CreditCard,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewAuditHistoryLink } from "@/modules/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { VerticalSelector, useVerticalContextStore } from "@/modules/vertical";

import { PageHeader } from "@/components/common/page-header";

import { PartnerStatus, type PartnerDetail as PartnerDetailType } from "../types";
import {
  PARTNER_STATUS_CONFIG,
  PARTNER_PLAN_CONFIG,
  formatDate,
  formatDateTime,
  formatUsage,
  getUsagePercentage,
  formatStorage,
} from "../utils";
import { PartnerStatusActions } from "./partner-status-actions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartnerDetailHeaderProps {
  partner: PartnerDetailType;
  basePath: string;
}

interface PartnerDetailViewProps {
  partner: PartnerDetailType;
  /** Base path for navigation */
  basePath: string;
  /** Hide header (when rendered separately above tabs) */
  hideHeader?: boolean;
}

// ---------------------------------------------------------------------------
// Partner Header (for rendering above tabs)
// ---------------------------------------------------------------------------

/** Get initials from partner name (max 2 chars) */
function getPartnerInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function PartnerDetailHeader({
  partner,
  basePath,
}: PartnerDetailHeaderProps) {
  const router = useRouter();
  const statusConfig = PARTNER_STATUS_CONFIG[partner.status];
  const showVerticalSelector = partner.enabledVerticals.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(basePath)}
          className="shrink-0 mt-1"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        {/* Partner Avatar */}
        <Avatar className="h-14 w-14 rounded-lg shrink-0">
          <AvatarImage src={partner.logos?.light ?? partner.logos?.dark ?? undefined} alt={partner.name} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-semibold">
            {getPartnerInitials(partner.name)}
          </AvatarFallback>
        </Avatar>
        {/* Header content */}
        <div className="flex-1 min-w-0">
          <PageHeader
            title={partner.name}
            description={`${partner.slug}${partner.domain ? ` • ${partner.domain}` : ""}`}
            status={{ label: statusConfig.label, variant: statusConfig.variant }}
            hideBreadcrumb
            actions={[
              {
                label: "Settings",
                onClick: () => {},
                icon: Settings,
                variant: "outline",
              },
            ]}
          />
        </div>
      </div>
      {showVerticalSelector && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-sm text-muted-foreground">View data for:</span>
          <VerticalSelector
            enabledVerticals={partner.enabledVerticals}
            variant="pills"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerDetailView({
  partner,
  basePath,
  hideHeader = false,
}: PartnerDetailViewProps) {
  const statusConfig = PARTNER_STATUS_CONFIG[partner.status];
  const planConfig = PARTNER_PLAN_CONFIG[partner.plan];

  return (
    <div className="space-y-6">
      {/* Page Header (only if not hidden) */}
      {!hideHeader && (
        <PartnerDetailHeader partner={partner} basePath={basePath} />
      )}

      {/* Status Actions with Audit History */}
      <PartnerStatusActions
        partner={partner}
        endSlot={
          <ViewAuditHistoryLink
            targetType="partner"
            targetId={partner.id}
            portal="platform"
          />
        }
      />

      {/* Suspension/Deactivation reason banners */}
      {partner.status === PartnerStatus.SUSPENDED && partner.suspensionReason && (
        <div className="rounded-xl border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <Shield className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                Suspension Reason
              </p>
              <p className="mt-0.5 text-sm text-orange-600/80 dark:text-orange-300/70">
                {partner.suspensionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {partner.status === PartnerStatus.DEACTIVATED && partner.deactivationReason && (
        <div className="rounded-xl border-l-4 border-l-destructive bg-destructive/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-destructive">
                Deactivation Reason
              </p>
              <p className="mt-0.5 text-sm text-destructive/70">
                {partner.deactivationReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left: Info (2 cols on xl) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Top row: Partner Info + Enabled Verticals */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Partner Info Card */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  Partner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Name" value={partner.name} />
                <InfoRow label="Slug" value={partner.slug} />
                <InfoRow
                  label="Domain"
                  value={
                    partner.domain ? (
                      <span className="flex items-center gap-1.5 text-primary">
                        <Globe className="h-3.5 w-3.5" />
                        {partner.domain}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
                <Separator className="my-2" />
                <InfoRow
                  label="Plan"
                  value={
                    <Badge variant={planConfig.variant} className="font-medium">
                      {planConfig.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Admin"
                value={
                  <div className="text-right">
                    <p className="font-medium">{partner.adminName}</p>
                    <a
                      href={`mailto:${partner.adminEmail}`}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      {partner.adminEmail}
                    </a>
                  </div>
                }
              />
            </CardContent>
          </Card>

            {/* Enabled Verticals */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Enabled Verticals</CardTitle>
              </CardHeader>
              <CardContent>
                {partner.enabledVerticals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {partner.enabledVerticals.map((v) => (
                      <Badge key={v} variant="secondary" className="rounded-full px-3 py-1">
                        {v.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No verticals enabled
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle row: Usage + Subscription side by side */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Usage Stats */}
            {partner.usage && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <HardDrive className="h-4 w-4 text-blue-600" />
                    </div>
                    Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <UsageBar
                    label="Vendors"
                    used={partner.usage.vendorsUsed}
                    limit={partner.usage.vendorsLimit}
                  />
                  <UsageBar
                    label="Listings"
                    used={partner.usage.listingsUsed}
                    limit={partner.usage.listingsLimit}
                  />
                  <UsageBar
                    label="Storage"
                    used={partner.usage.storageUsedMB}
                    limit={partner.usage.storageLimitMB}
                    formatFn={formatStorage}
                  />
                </CardContent>
              </Card>
            )}

            {/* Subscription */}
            {partner.subscription && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow
                    label="Plan"
                    value={<span className="font-semibold">{partner.subscription.plan}</span>}
                  />
                  <InfoRow
                    label="Status"
                    value={
                      <Badge
                        variant={
                          partner.subscription.status === "ACTIVE"
                            ? "default"
                            : partner.subscription.status === "TRIALING"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {partner.subscription.status}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="Current Period"
                    value={`${formatDate(partner.subscription.currentPeriodStart)} — ${formatDate(partner.subscription.currentPeriodEnd)}`}
                  />
                  {partner.subscription.cancelAtPeriodEnd && (
                    <InfoRow
                      label="Cancellation"
                      value={
                        <span className="text-destructive text-sm font-medium">
                          Cancels at end of period
                        </span>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Vendors link */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-600" />
                </div>
                Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold tracking-tight">{partner.vendorCount}</p>
                  <p className="text-xs text-muted-foreground">
                    Total vendors
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/platform/partners/${partner.id}`}>
                    View Vendors
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats sidebar (1 col) */}
        <div className="space-y-6">
          {/* Stats card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatItem
                icon={Users}
                label="Vendors"
                value={String(partner.vendorCount)}
                color="violet"
              />
              <StatItem
                icon={FileText}
                label="Total Listings"
                value={String(partner.listingCount)}
                color="blue"
              />
              <StatItem
                icon={Eye}
                label="Active Listings"
                value={String(partner.activeListingCount)}
                color="emerald"
              />
            </CardContent>
          </Card>

          {/* Timeline card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TimelineItem
                icon={Calendar}
                label="Created"
                value={formatDate(partner.createdAt)}
              />
              <TimelineItem
                icon={Clock}
                label="Last Updated"
                value={formatDateTime(partner.updatedAt)}
              />
              {partner.lastActivityAt && (
                <TimelineItem
                  icon={Eye}
                  label="Last Activity"
                  value={formatDateTime(partner.lastActivityAt)}
                />
              )}
            </CardContent>
          </Card>

          {/* Settings link */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start rounded-none h-14 px-4 hover:bg-primary/5"
                asChild
              >
                <Link href={`${basePath}/${partner.id}/settings`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted mr-3">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Manage Settings</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub components
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

const STAT_COLORS = {
  violet: "bg-violet-500/10 text-violet-600",
  blue: "bg-blue-500/10 text-blue-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  primary: "bg-primary/10 text-primary",
} as const;

function StatItem({
  icon: Icon,
  label,
  value,
  color = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: keyof typeof STAT_COLORS;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${STAT_COLORS[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex items-baseline justify-between gap-2 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-xs font-medium truncate">{value}</span>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
  formatFn,
}: {
  label: string;
  used: number;
  limit: number;
  formatFn?: (value: number) => string;
}) {
  const percentage = getUsagePercentage(used, limit);
  const displayUsed = formatFn ? formatFn(used) : String(used);
  const displayLimit = formatFn ? formatFn(limit) : String(limit);
  const isHigh = percentage >= 80;
  const isMedium = percentage >= 60 && percentage < 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-semibold tabular-nums">
          {formatFn
            ? `${displayUsed} / ${displayLimit}`
            : formatUsage(used, limit)}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            isHigh
              ? "bg-red-500"
              : isMedium
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className={`text-xs text-right font-medium ${isHigh ? "text-red-600" : isMedium ? "text-amber-600" : "text-muted-foreground"}`}>
        {percentage}% used
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function PartnerDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-16" />
            </CardHeader>
            <CardContent className="space-y-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex justify-between flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
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
