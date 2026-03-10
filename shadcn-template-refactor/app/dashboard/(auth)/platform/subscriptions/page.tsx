import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Plans & Subscriptions - Platform Admin",
    description: "Manage subscription plans and view partner subscriptions",
    canonical: "/dashboard/platform/subscriptions",
  });
}

export default function PlatformSubscriptionsPage() {
  return <PlatformSubscriptionsContent />;
}

import { PlatformSubscriptionsContent } from "./content";
