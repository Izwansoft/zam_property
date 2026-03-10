import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Company Detail - Partner",
    description: "View company details within a partner context",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerCompanyDetailPage() {
  return <PartnerCompanyDetailContent />;
}

import { PartnerCompanyDetailContent } from "./content";
