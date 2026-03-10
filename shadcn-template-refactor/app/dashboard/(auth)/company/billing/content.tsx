"use client";

import dynamic from "next/dynamic";
import { OwnerBillingDashboardSkeleton } from "@/modules/billing/components/owner-billing-dashboard";

const OwnerBillingDashboard = dynamic(
  () =>
    import("@/modules/billing/components/owner-billing-dashboard").then(
      (mod) => mod.OwnerBillingDashboard,
    ),
  {
    ssr: false,
    loading: () => <OwnerBillingDashboardSkeleton />,
  },
);

export function CompanyBillingContent() {
  return (
    <OwnerBillingDashboard
      basePath="/dashboard/company/billing"
      showGrouping
    />
  );
}
