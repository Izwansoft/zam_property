import { generateMeta } from "@/lib/utils";
import { CompanyBillingContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Billing - Company Portal",
    description: "Review invoices and billing history",
    canonical: "/dashboard/company/billing",
  });
}

export default function CompanyBillingPage() {
  return <CompanyBillingContent />;
}
