import { generateMeta } from "@/lib/utils";
import { CompanyTenanciesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Tenancies - Company Portal",
    description: "Manage tenancy lifecycle across your company",
    canonical: "/dashboard/company/tenancies",
  });
}

export default function CompanyTenanciesPage() {
  return <CompanyTenanciesContent />;
}
