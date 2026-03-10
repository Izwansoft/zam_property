import { generateMeta } from "@/lib/utils";
import { AgentPerformanceContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Performance - Agent Portal",
    description: "View conversion and pipeline performance",
    canonical: "/dashboard/agent/performance",
  });
}

export default function AgentPerformancePage() {
  return <AgentPerformanceContent />;
}
