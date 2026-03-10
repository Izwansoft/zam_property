import { generateMeta } from "@/lib/utils";

import { PlatformAgentsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Agents - Platform Admin",
    description: "Global agent index across all partners",
    canonical: "/dashboard/platform/agents",
  });
}

export default function PlatformAgentsPage() {
  return <PlatformAgentsContent />;
}
