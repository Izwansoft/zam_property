import { generateMeta } from "@/lib/utils";

import { PlatformSubscriptionDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Plan Detail - Platform Admin",
    description: "View and manage plan details",
    canonical: "/dashboard/platform/subscriptions",
  });
}

export default function PlatformSubscriptionDetailPage() {
  return <PlatformSubscriptionDetailContent />;
}
