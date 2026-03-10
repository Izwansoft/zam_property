import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Vendor Detail - Partner",
    description: "View vendor details within a partner context",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerVendorDetailPage() {
  return <PartnerVendorDetailContent />;
}

import { PartnerVendorDetailContent } from "./content";
