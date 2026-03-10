import { generateMeta } from "@/lib/utils";
import { PartnerAnalyticsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Analytics - Partner Admin",
    description: "Partner insights and growth analytics",
    canonical: "/dashboard/partner/analytics",
  });
}

export default function PartnerAnalyticsPage() {
  return <PartnerAnalyticsContent />;
}
