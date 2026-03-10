import { generateMeta } from "@/lib/utils";
import { PartnerVendorsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Vendors - Platform Admin",
    description: "View vendors for this partner",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerVendorsPage() {
  return <PartnerVendorsContent />;
}
