// =============================================================================
// Agent Commissions — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { AgentCommissionsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Commissions - Zam Property",
    description: "Track your commission earnings and payment status",
    canonical: "/dashboard/agent/commissions",
  });
}

export default function AgentCommissionsPage() {
  return <AgentCommissionsContent />;
}
