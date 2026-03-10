// =============================================================================
// OwnerBillingDashboard — Main dashboard for owner billing overview
// =============================================================================
// Composes BillingStatsCards + OwnerBillList for a complete billing view.
// Session 6.5 implementation.
// =============================================================================

"use client";

import { Suspense } from "react";
import { BillingStatsCards, BillingStatsCardsSkeleton } from "./billing-stats-cards";
import { OwnerBillList, OwnerBillListSkeleton } from "./owner-bill-list";
import { useOwnerBillingSummary } from "../hooks/useOwnerBillingSummary";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OwnerBillingDashboardProps {
  /** Base path for navigation */
  basePath?: string;
  /** Show property grouping in bill list */
  showGrouping?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OwnerBillingDashboard({
  basePath = "/dashboard/vendor/billing",
  showGrouping = true,
}: OwnerBillingDashboardProps) {
  const { data: summary, isLoading: summaryLoading } =
    useOwnerBillingSummary();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <BillingStatsCards summary={summary} isLoading={summaryLoading} />

      {/* Bill List with Property Grouping */}
      <OwnerBillList basePath={basePath} showGrouping={showGrouping} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function OwnerBillingDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <BillingStatsCardsSkeleton />
      <OwnerBillListSkeleton />
    </div>
  );
}
