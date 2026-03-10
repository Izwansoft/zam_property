import { generateMeta } from "@/lib/utils";
import { PartnerListingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Listings - Platform Admin",
    description: "View listings for this partner",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerListingsPage() {
  return <PartnerListingsContent />;
}
