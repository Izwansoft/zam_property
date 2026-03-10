"use client";

import dynamic from "next/dynamic";
import { CommissionListSkeleton } from "@/modules/commission/components/commission-list";

const CommissionList = dynamic(
  () =>
    import("@/modules/commission/components/commission-list").then(
      (mod) => mod.CommissionList,
    ),
  {
    ssr: false,
    loading: () => <CommissionListSkeleton />,
  },
);

export function CompanyCommissionsContent() {
  return (
    <CommissionList
      basePath="/dashboard/company/commissions"
      title="Company Commissions"
      description="Monitor team commission pipelines, approvals, and payout readiness."
    />
  );
}
