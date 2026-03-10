import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Subscription - Vendor Portal",
    description: "View your plan limits and usage",
    canonical: "/dashboard/vendor/subscription",
  });
}

export default function VendorSubscriptionPage() {
  return <VendorSubscriptionContent />;
}

import { VendorSubscriptionContent } from "./content";
