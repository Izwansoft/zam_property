import { generateMeta } from "@/lib/utils";

import { PlatformBillingDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Bill Detail - Platform Admin",
    description: "View full billing details",
    canonical: "/dashboard/platform/billing",
  });
}

export default function PlatformBillingDetailPage() {
  return <PlatformBillingDetailContent />;
}
