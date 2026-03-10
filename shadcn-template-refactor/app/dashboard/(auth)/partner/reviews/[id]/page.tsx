import { generateMeta } from "@/lib/utils";
import { PartnerReviewDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Review Detail - Partner Admin",
    description: "View and moderate review details",
    canonical: "/dashboard/partner/reviews",
  });
}

export default function PartnerReviewDetailPage() {
  return <PartnerReviewDetailContent />;
}
