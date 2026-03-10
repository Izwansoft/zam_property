import { generateMeta } from "@/lib/utils";
import { PlatformPricingContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Pricing Management - Platform Admin",
    description:
      "Manage pricing configurations, rules, and charge events for vendor billing",
    canonical: "/dashboard/platform/pricing",
  });
}

export default function PlatformPricingPage() {
  return <PlatformPricingContent />;
}
