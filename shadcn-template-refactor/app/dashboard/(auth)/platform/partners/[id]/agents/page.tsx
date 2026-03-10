import { generateMeta } from "@/lib/utils";
import { PartnerAgentsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Agents - Platform Admin",
    description: "View agents for this partner",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerAgentsPage() {
  return <PartnerAgentsContent />;
}
