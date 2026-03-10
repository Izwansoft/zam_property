import { generateMeta } from "@/lib/utils";
import { AgentProfileContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Profile - Agent Portal",
    description: "Manage your public profile and contact preferences",
    canonical: "/dashboard/agent/profile",
  });
}

export default function AgentProfilePage() {
  return <AgentProfileContent />;
}
