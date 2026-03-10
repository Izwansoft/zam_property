// =============================================================================
// Agent Dashboard Types — Stats, quick actions, and dashboard data
// =============================================================================

import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Agent Dashboard Stats
// ---------------------------------------------------------------------------

export interface AgentDashboardStats {
  /** Total listings assigned to the agent */
  totalListings: number;
  /** Total deals closed by the agent */
  totalDeals: number;
  /** Total revenue generated (MYR) */
  totalRevenue: number;
  /** Total commission earned (MYR) */
  totalCommission: number;
  /** Previous period stats for trending */
  previousPeriod?: {
    totalListings: number;
    totalDeals: number;
    totalRevenue: number;
    totalCommission: number;
  };
}

// ---------------------------------------------------------------------------
// Quick Action
// ---------------------------------------------------------------------------

export interface AgentQuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant?: "default" | "outline";
}
