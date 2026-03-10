import { generateMeta } from "@/lib/utils";
import { AgentTenanciesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Tenancies - Agent Portal",
    description: "Track your active tenancies and renewals",
    canonical: "/dashboard/agent/tenancies",
  });
}

export default function AgentTenanciesPage() {
  return <AgentTenanciesContent />;
}
