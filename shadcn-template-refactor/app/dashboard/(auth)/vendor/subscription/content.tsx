// =============================================================================
// Vendor Subscription Content — Read-only view of plan limits & usage
// =============================================================================
// Vendors can see their plan name, basic allowances, and usage counters.
// Vendors CANNOT change plans or see partner-level billing data.
// =============================================================================

"use client";

import { useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { useSubscription } from "@/modules/subscription/hooks/use-subscription";
import { useUsage } from "@/modules/subscription/hooks/use-usage";
import { useEntitlements } from "@/modules/subscription/hooks/use-entitlements";
import { CurrentPlanCard } from "@/modules/subscription/components/current-plan-card";
import { UsageMeters } from "@/modules/subscription/components/usage-meters";
import { EntitlementsDisplay } from "@/modules/subscription/components/entitlements-display";
import { UpgradePrompt } from "@/modules/subscription/components/upgrade-prompt";
import type { UsageMetric } from "@/modules/subscription/types";
import { getUsageWarningLevel } from "@/modules/subscription/types";

export function VendorSubscriptionContent() {
  // Fetch data (read-only)
  const {
    data: subscription,
    isLoading: subLoading,
    dataUpdatedAt: subUpdatedAt,
  } = useSubscription();

  const {
    data: usageData,
    isLoading: usageLoading,
    dataUpdatedAt: usageUpdatedAt,
    refetch: refetchUsage,
    isFetching: usageRefreshing,
  } = useUsage();

  const {
    data: entitlements,
    isLoading: entitlementsLoading,
  } = useEntitlements();

  const usageMetrics: UsageMetric[] = useMemo(() => {
    if (!usageData) return [];
    return Array.isArray(usageData) ? usageData : [usageData];
  }, [usageData]);

  const hasLimitWarning = useMemo(
    () =>
      usageMetrics.some(
        (m) => getUsageWarningLevel(m.percentage) !== "normal"
      ),
    [usageMetrics]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Plan & Usage"
        description="View your plan limits and current usage. Contact your administrator for plan changes."
      />

      {/* Current Plan (read-only) */}
      <CurrentPlanCard
        subscription={subscription}
        isLoading={subLoading}
        lastUpdated={subUpdatedAt ? new Date(subUpdatedAt) : undefined}
      />

      {/* Usage Meters */}
      <UsageMeters
        metrics={usageMetrics}
        isLoading={usageLoading}
        lastUpdated={usageUpdatedAt ? new Date(usageUpdatedAt) : undefined}
        onRefresh={() => refetchUsage()}
        isRefreshing={usageRefreshing}
      />

      {/* Entitlements (what's included) */}
      <EntitlementsDisplay
        entitlements={entitlements}
        isLoading={entitlementsLoading}
      />

      {/* Upgrade info (informational — directs to admin) */}
      {hasLimitWarning && !subLoading && (
        <UpgradePrompt
          reason="limit_reached"
          currentPlan={subscription?.plan.name}
          variant="banner"
          onContactSales={() => {
            window.open(
              "mailto:admin@zamproperty.com?subject=Usage%20Limit%20-%20Plan%20Upgrade%20Request",
              "_blank"
            );
          }}
        />
      )}
    </div>
  );
}
