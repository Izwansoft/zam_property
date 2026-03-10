import { generateMeta } from "@/lib/utils";
import { PartnerDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Dashboard - Zam Property",
    description: "Partner administration dashboard",
    canonical: "/dashboard/partner"
  });
}

export default function PartnerDashboardPage() {
  return <PartnerDashboardContent />;
}
