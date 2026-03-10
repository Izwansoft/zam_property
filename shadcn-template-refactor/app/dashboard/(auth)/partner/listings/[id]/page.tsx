import { generateMeta } from "@/lib/utils";
import { PartnerListingDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Listing Detail - Partner Portal",
    description: "View and moderate listing details",
    canonical: "/dashboard/partner/listings",
  });
}

export default function PartnerListingDetailPage() {
  return <PartnerListingDetailContent />;
}
