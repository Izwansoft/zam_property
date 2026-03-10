// =============================================================================
// Company Dashboard — Client Content
// =============================================================================
// Wraps CompanyDashboard with dynamic import (SSR disabled).
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { CompanyDashboardSkeleton } from "@/modules/company/components/company-dashboard";

const CompanyDashboard = dynamic(
  () =>
    import("@/modules/company/components/company-dashboard").then(
      (mod) => mod.CompanyDashboard
    ),
  {
    ssr: false,
    loading: () => <CompanyDashboardSkeleton />,
  }
);

export function CompanyDashboardContent() {
  return <CompanyDashboard />;
}
