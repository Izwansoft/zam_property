import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "User Detail - Partner",
    description: "View user details within a partner context",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerUserDetailPage() {
  return <PartnerUserDetailContent />;
}

import { PartnerUserDetailContent } from "./content";
