import { generateMeta } from "@/lib/utils";
import { AgentListingDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Listing Detail - Agent Portal",
    description: "Track approval status and moderation timeline",
    canonical: "/dashboard/agent/listings",
  });
}

export default function AgentListingDetailPage() {
  return <AgentListingDetailContent />;
}
