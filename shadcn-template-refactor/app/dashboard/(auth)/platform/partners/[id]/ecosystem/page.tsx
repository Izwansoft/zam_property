import { generateMeta } from "@/lib/utils";

import { PartnerEcosystemLandingContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Ecosystem - Platform Admin",
    description: "Partner vendors, companies, and agents",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerEcosystemPage() {
  return <PartnerEcosystemLandingContent />;
}
