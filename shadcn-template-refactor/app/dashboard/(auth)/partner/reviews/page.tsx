import { generateMeta } from "@/lib/utils";
import { PartnerReviewsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Reviews - Partner Admin",
    description: "View and moderate all customer reviews",
    canonical: "/dashboard/partner/reviews",
  });
}

export default function PartnerReviewsPage() {
  return <PartnerReviewsContent />;
}
