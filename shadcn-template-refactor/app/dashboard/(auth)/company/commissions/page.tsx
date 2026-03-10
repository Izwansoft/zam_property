import { generateMeta } from "@/lib/utils";
import { CompanyCommissionsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Commissions - Company Portal",
    description: "Monitor company commissions and payout status",
    canonical: "/dashboard/company/commissions",
  });
}

export default function CompanyCommissionsPage() {
  return <CompanyCommissionsContent />;
}
