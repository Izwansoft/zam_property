import { generateMeta } from "@/lib/utils";
import { AgentListingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Listings - Agent Portal",
    description: "Submit and track your listing drafts",
    canonical: "/dashboard/agent/listings",
  });
}

export default function AgentListingsPage() {
  return <AgentListingsContent />;
}
