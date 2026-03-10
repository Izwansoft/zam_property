// =============================================================================
// Agent Dashboard — Client Content
// =============================================================================
// Wraps AgentDashboard with dynamic import (SSR disabled).
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { AgentDashboardSkeleton } from "@/modules/agent/components/agent-dashboard";

const AgentDashboard = dynamic(
  () =>
    import("@/modules/agent/components/agent-dashboard").then(
      (mod) => mod.AgentDashboard
    ),
  {
    ssr: false,
    loading: () => <AgentDashboardSkeleton />,
  }
);

export function AgentDashboardContent() {
  return <AgentDashboard />;
}
