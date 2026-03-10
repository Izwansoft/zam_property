import { generateMeta } from "@/lib/utils";

import { PartnerAccessLandingContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Access - Platform Admin",
    description: "Partner user and access controls",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerAccessPage() {
  return <PartnerAccessLandingContent />;
}
