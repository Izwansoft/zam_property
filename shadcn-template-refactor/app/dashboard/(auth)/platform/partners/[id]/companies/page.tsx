import { generateMeta } from "@/lib/utils";
import { PartnerCompaniesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Companies - Platform Admin",
    description: "View companies for this partner",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerCompaniesPage() {
  return <PartnerCompaniesContent />;
}
