// =============================================================================
// Partner Subscription Content — Client component for subscription dashboard
// =============================================================================
// Displays current plan, usage meters, entitlements, and plan comparison.
// UI explains access; never computes billing.
// =============================================================================

"use client";

import { useState, useMemo, useCallback } from "react";

import { PageHeader } from "@/components/common/page-header";
import { useSubscription } from "@/modules/subscription/hooks/use-subscription";
import { usePlans } from "@/modules/subscription/hooks/use-plans";
import { useUsage } from "@/modules/subscription/hooks/use-usage";
import { useEntitlements } from "@/modules/subscription/hooks/use-entitlements";
import { CurrentPlanCard } from "@/modules/subscription/components/current-plan-card";
import { UsageMeters } from "@/modules/subscription/components/usage-meters";
import { EntitlementsDisplay } from "@/modules/subscription/components/entitlements-display";
import { PlanComparisonTable } from "@/modules/subscription/components/plan-comparison-table";
import { UpgradePrompt } from "@/modules/subscription/components/upgrade-prompt";
import type { UsageMetric } from "@/modules/subscription/types";
import { getUsageWarningLevel } from "@/modules/subscription/types";

export function PartnerSubscriptionContent() {
  const [showPlans, setShowPlans] = useState(false);

  // Fetch data
  const {
    data: subscription,
    isLoading: subLoading,
    dataUpdatedAt: subUpdatedAt,
  } = useSubscription();

  const {
    data: plansData,
    isLoading: plansLoading,
  } = usePlans({ isActive: true, isPublic: true });

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

  // Normalize usage: may be array or single metric
  const usageMetrics: UsageMetric[] = useMemo(() => {
    if (!usageData) return [];
    return Array.isArray(usageData) ? usageData : [usageData];
  }, [usageData]);

  // Check if any limits are reached (for upgrade prompt)
  const hasLimitWarning = useMemo(
    () =>
      usageMetrics.some(
        (m) => getUsageWarningLevel(m.percentage) !== "normal"
      ),
    [usageMetrics]
  );

  const handleViewPlans = useCallback(() => setShowPlans(true), []);
  const handleContactSales = useCallback(() => {
    window.open("mailto:sales@zamproperty.com?subject=Plan%20Upgrade%20Inquiry", "_blank");
  }, []);

  const error =
    !subLoading && !subscription
      ? "Unable to load subscription data."
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="View your current plan, usage, and available features."
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Top row: Current Plan + Upgrade Prompt */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CurrentPlanCard
          subscription={subscription}
          isLoading={subLoading}
          lastUpdated={subUpdatedAt ? new Date(subUpdatedAt) : undefined}
        />

        {/* Show upgrade prompt if there are warnings or not on highest plan */}
        {!subLoading && subscription && (
          <UpgradePrompt
            reason={hasLimitWarning ? "limit_reached" : "general"}
            currentPlan={subscription.plan.name}
            onViewPlans={handleViewPlans}
            onContactSales={handleContactSales}
          />
        )}
      </div>

      {/* Usage Meters */}
      <UsageMeters
        metrics={usageMetrics}
        isLoading={usageLoading}
        lastUpdated={usageUpdatedAt ? new Date(usageUpdatedAt) : undefined}
        onRefresh={() => refetchUsage()}
        isRefreshing={usageRefreshing}
      />

      {/* Entitlements */}
      <EntitlementsDisplay
        entitlements={entitlements}
        isLoading={entitlementsLoading}
      />

      {/* Plan Comparison (expandable) */}
      {(showPlans || plansData) && (
        <div className="space-y-4">
          {!showPlans && (
            <button
              onClick={handleViewPlans}
              className="text-sm font-medium text-primary hover:underline"
            >
              Compare all available plans →
            </button>
          )}
          {showPlans && (
            <PlanComparisonTable
              plans={plansData?.items ?? []}
              currentPlanId={subscription?.planId}
              isLoading={plansLoading}
            />
          )}
        </div>
      )}
    </div>
  );
}
