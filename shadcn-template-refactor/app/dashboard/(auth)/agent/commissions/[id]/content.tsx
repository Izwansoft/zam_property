// =============================================================================
// Commission Detail — Client Content
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { CommissionDetailSkeleton } from "@/modules/commission/components/commission-detail";

const CommissionDetail = dynamic(
  () =>
    import("@/modules/commission/components/commission-detail").then(
      (mod) => mod.CommissionDetail
    ),
  {
    ssr: false,
    loading: () => <CommissionDetailSkeleton />,
  }
);

export function CommissionDetailContent() {
  const params = useParams();
  const commissionId = params.id as string;

  return (
    <CommissionDetail
      commissionId={commissionId}
      backPath="/dashboard/agent/commissions"
    />
  );
}
