import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Review Detail - Vendor Portal",
    description: "View review details and reply to customer feedback",
    canonical: "/dashboard/vendor/reviews",
  });
}

export default function VendorReviewDetailPage() {
  return <VendorReviewDetailContent />;
}

import { VendorReviewDetailContent } from "./content";
