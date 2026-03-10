import { generateMeta } from "@/lib/utils";
import { CompanyListingDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Listing Detail - Company Portal",
    description: "Track submission moderation and approval outcomes",
    canonical: "/dashboard/company/listings",
  });
}

export default function CompanyListingDetailPage() {
  return <CompanyListingDetailContent />;
}
