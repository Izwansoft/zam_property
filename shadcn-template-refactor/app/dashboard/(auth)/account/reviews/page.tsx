import { generateMeta } from "@/lib/utils";
import { CustomerReviewsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Reviews - Zam Property",
    description: "View reviews you have written",
    canonical: "/dashboard/account/reviews",
  });
}

export default function CustomerReviewsPage() {
  return <CustomerReviewsContent />;
}
