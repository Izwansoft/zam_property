// =============================================================================
// CurrentPlanCard — Displays current subscription status & renewal info
// =============================================================================
// Shows plan name, billing period, status badge, and renewal/expiry date.
// UI only; never computes billing. All data from backend.
// =============================================================================

"use client";

import {
  Calendar,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { Subscription, SubscriptionStatus } from "../types";
import { SUBSCRIPTION_STATUS_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CurrentPlanCardProps {
  subscription?: Subscription | null;
  isLoading?: boolean;
  lastUpdated?: Date;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_ICONS: Record<SubscriptionStatus, React.ElementType> = {
  ACTIVE: CheckCircle2,
  PAST_DUE: AlertCircle,
  PAUSED: PauseCircle,
  CANCELLED: XCircle,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatPrice(price: string, currency?: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  return `${currency ?? "MYR"} ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CurrentPlanCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="mt-1 h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CurrentPlanCard({
  subscription,
  isLoading,
  lastUpdated,
  className,
}: CurrentPlanCardProps) {
  if (isLoading) {
    return <CurrentPlanCardSkeleton />;
  }

  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Current Plan</CardTitle>
          <CardDescription>No active subscription found.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact your administrator to set up a subscription plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status];
  const StatusIcon = STATUS_ICONS[subscription.status];
  const daysRemaining = getDaysRemaining(subscription.currentPeriodEnd);
  const isExpiringSoon = daysRemaining <= 7 && subscription.status === "ACTIVE";

  return (
    <Card className={cn("relative", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">
              {subscription.plan.name}
            </CardTitle>
          </div>
          <Badge variant={statusConfig.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription>
          {formatPrice(subscription.plan.priceMonthly)}/month
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Billing Period Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Current Period
              </p>
              <p className="text-sm">
                {formatDate(subscription.currentPeriodStart)} —{" "}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {subscription.status === "CANCELLED" ? "Cancelled" : "Renewal"}
              </p>
              {subscription.status === "CANCELLED" ? (
                <p className="text-sm text-destructive">
                  {subscription.cancelledAt
                    ? formatDate(subscription.cancelledAt)
                    : "—"}
                </p>
              ) : (
                <p
                  className={cn(
                    "text-sm",
                    isExpiringSoon && "font-medium text-amber-600 dark:text-amber-400"
                  )}
                >
                  {daysRemaining === 0
                    ? "Renews today"
                    : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Expiring soon warning */}
        {isExpiringSoon && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Your billing period ends soon. Renewal is automatic unless cancelled.
            </span>
          </div>
        )}

        {/* Past due warning */}
        {subscription.status === "PAST_DUE" && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Payment is overdue. Please contact your administrator to avoid
              service interruption.
            </span>
          </div>
        )}

        {/* Subscription metadata */}
        {subscription.externalProvider && (
          <div className="text-xs text-muted-foreground">
            Managed by {subscription.externalProvider}
            {subscription.externalId && ` (${subscription.externalId})`}
          </div>
        )}

        {/* Last updated timestamp */}
        {lastUpdated && (
          <div className="border-t pt-2 text-xs text-muted-foreground">
            Last updated: {formatTimestamp(lastUpdated)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { CurrentPlanCardSkeleton };
