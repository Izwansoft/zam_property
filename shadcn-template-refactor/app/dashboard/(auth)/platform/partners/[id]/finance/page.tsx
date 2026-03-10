import { generateMeta } from "@/lib/utils";

import { PartnerFinanceLandingContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Finance - Platform Admin",
    description: "Partner transaction and payout overview",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerFinancePage() {
  return <PartnerFinanceLandingContent />;
}
