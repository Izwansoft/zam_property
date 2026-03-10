// =============================================================================
// Affiliate Dashboard — Client Content
// =============================================================================
// Wraps AffiliateDashboard with dynamic import (SSR disabled).
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { AffiliateDashboardSkeleton } from "@/modules/affiliate/components/affiliate-dashboard";

const AffiliateDashboard = dynamic(
  () =>
    import("@/modules/affiliate/components/affiliate-dashboard").then(
      (mod) => mod.AffiliateDashboard
    ),
  {
    ssr: false,
    loading: () => <AffiliateDashboardSkeleton />,
  }
);

export function AffiliateDashboardContent() {
  return <AffiliateDashboard />;
}
