// =============================================================================
// Agent Commissions — Client Content
// =============================================================================
// Wraps CommissionList with dynamic import (SSR disabled).
// Uses current agent's ID from auth context.
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { useAuthUser } from "@/modules/auth";
import { CommissionListSkeleton } from "@/modules/commission/components/commission-list";

const CommissionList = dynamic(
  () =>
    import("@/modules/commission/components/commission-list").then(
      (mod) => mod.CommissionList
    ),
  {
    ssr: false,
    loading: () => <CommissionListSkeleton />,
  }
);

export function AgentCommissionsContent() {
  const user = useAuthUser();
  const agentId = user.id;

  return (
    <CommissionList
      agentId={agentId}
      basePath="/dashboard/agent/commissions"
      title="My Commissions"
      description="Track your commission earnings and payment status."
    />
  );
}
