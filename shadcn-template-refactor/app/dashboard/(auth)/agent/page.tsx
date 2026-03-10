// =============================================================================
// Agent Dashboard — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { AgentDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Agent Dashboard - Zam Property",
    description: "View your listings, deals, and commission performance",
    canonical: "/dashboard/agent",
  });
}

export default function AgentDashboardPage() {
  return <AgentDashboardContent />;
}
