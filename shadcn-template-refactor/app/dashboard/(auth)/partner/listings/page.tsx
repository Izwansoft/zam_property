import { generateMeta } from "@/lib/utils";
import { PartnerListingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Listings - Partner Admin",
    description: "View and moderate all listings in your partner",
    canonical: "/dashboard/partner/listings",
  });
}

export default function PartnerListingsPage() {
  return <PartnerListingsContent />;
}
