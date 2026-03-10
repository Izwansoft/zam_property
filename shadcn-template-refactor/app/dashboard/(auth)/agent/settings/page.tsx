import { generateMeta } from "@/lib/utils";
import { AgentSettingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Settings - Agent Portal",
    description: "Manage account and notification settings",
    canonical: "/dashboard/agent/settings",
  });
}

export default function AgentSettingsPage() {
  return <AgentSettingsContent />;
}
