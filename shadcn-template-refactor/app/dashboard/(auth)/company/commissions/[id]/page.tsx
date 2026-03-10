import { generateMeta } from "@/lib/utils";
import { CompanyCommissionDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Commission Detail - Company Portal",
    description: "View commission details and payout status",
    canonical: "/dashboard/company/commissions",
  });
}

export default function CompanyCommissionDetailPage() {
  return <CompanyCommissionDetailContent />;
}
