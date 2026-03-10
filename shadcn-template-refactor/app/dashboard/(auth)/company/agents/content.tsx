// =============================================================================
// Company Agents — Client Content
// =============================================================================
// Wraps AgentList with dynamic import (SSR disabled).
// Uses a placeholder companyId (resolved from auth context at runtime).
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { AgentListSkeleton } from "@/modules/agent/components/agent-list";
import { useCompanyContext } from "@/modules/company/hooks/useCompanyContext";

const AgentList = dynamic(
  () =>
    import("@/modules/agent/components/agent-list").then(
      (mod) => mod.AgentList
    ),
  {
    ssr: false,
    loading: () => <AgentListSkeleton />,
  }
);

export function AgentsContent() {
  const { companyId } = useCompanyContext();

  if (!companyId) {
    return <AgentListSkeleton />;
  }

  return <AgentList companyId={companyId} />;
}
