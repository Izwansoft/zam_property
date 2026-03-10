// =============================================================================
// Company Dashboard Types — Stats, quick actions, and dashboard data
// =============================================================================

import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Company Dashboard Stats
// ---------------------------------------------------------------------------

export interface CompanyDashboardStats {
  /** Total properties managed by the company */
  totalProperties: number;
  /** Total agents in the company */
  totalAgents: number;
  /** Active tenancies across company properties */
  activeTenancies: number;
  /** Total revenue (MYR) */
  totalRevenue: number;
  /** Previous period stats for trending */
  previousPeriod?: {
    totalProperties: number;
    totalAgents: number;
    activeTenancies: number;
    totalRevenue: number;
  };
}

// ---------------------------------------------------------------------------
// Quick Action
// ---------------------------------------------------------------------------

export interface CompanyQuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant?: "default" | "outline";
}
