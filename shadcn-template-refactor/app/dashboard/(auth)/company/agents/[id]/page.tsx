// =============================================================================
// Agent Detail — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { AgentDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Agent Detail - Zam Property",
    description: "View agent profile, assigned listings, and performance",
    canonical: "/dashboard/company/agents",
  });
}

export default function AgentDetailPage() {
  return <AgentDetailContent />;
}
