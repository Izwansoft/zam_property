import { generateMeta } from "@/lib/utils";
import { PartnerVendorsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Vendors - Partner Admin",
    description: "Manage and moderate all vendors in your partner",
    canonical: "/dashboard/partner/vendors",
  });
}

export default function PartnerVendorsPage() {
  return <PartnerVendorsContent />;
}
