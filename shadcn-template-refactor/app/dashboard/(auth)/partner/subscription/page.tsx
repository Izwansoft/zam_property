import { generateMeta } from "@/lib/utils";
import { PartnerSubscriptionContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Subscription - Partner Portal",
    description: "View your current subscription plan, usage, and entitlements",
    canonical: "/dashboard/partner/subscription",
  });
}

export default function PartnerSubscriptionPage() {
  return <PartnerSubscriptionContent />;
}
