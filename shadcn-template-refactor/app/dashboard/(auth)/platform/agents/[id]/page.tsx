import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Agent Detail - Platform Admin",
    description: "View and manage agent details",
    canonical: "/dashboard/platform/agents",
  });
}

export default function PlatformAgentDetailPage() {
  return <PlatformAgentDetailContent />;
}

import { PlatformAgentDetailContent } from "./content";
