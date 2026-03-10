import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Reviews - Vendor Portal",
    description: "View and respond to customer reviews",
    canonical: "/dashboard/vendor/reviews",
  });
}

export default function VendorReviewsPage() {
  return <VendorReviewsContent />;
}

import { VendorReviewsContent } from "./content";
