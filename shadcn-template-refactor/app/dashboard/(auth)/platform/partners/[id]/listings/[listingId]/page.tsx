import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Listing Detail - Partner",
    description: "View listing details within a partner context",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerListingDetailPage() {
  return <PartnerListingDetailContent />;
}

import { PartnerListingDetailContent } from "./content";
