// =============================================================================
// Company Agents — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { AgentsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Agents - Zam Property",
    description: "Manage your company's registered agents and their assignments",
    canonical: "/dashboard/company/agents",
  });
}

export default function AgentsPage() {
  return <AgentsContent />;
}
