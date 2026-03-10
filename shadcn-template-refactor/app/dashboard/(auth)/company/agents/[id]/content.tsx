// =============================================================================
// Agent Detail — Client Content
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AgentDetailSkeleton } from "@/modules/agent/components/agent-detail";

const AgentDetail = dynamic(
  () =>
    import("@/modules/agent/components/agent-detail").then(
      (mod) => mod.AgentDetail
    ),
  {
    ssr: false,
    loading: () => <AgentDetailSkeleton />,
  }
);

export function AgentDetailContent() {
  const params = useParams();
  const agentId = params.id as string;

  return <AgentDetail agentId={agentId} />;
}
