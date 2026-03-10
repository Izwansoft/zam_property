import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Agent Detail - Partner",
    description: "View agent details within a partner context",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerAgentDetailPage() {
  return <PartnerAgentDetailContent />;
}

import { PartnerAgentDetailContent } from "./content";
