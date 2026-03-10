import { generateMeta } from "@/lib/utils";
import { CompanyProfileContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Company Profile - Company Portal",
    description: "Manage your company profile and brand identity",
    canonical: "/dashboard/company/profile",
  });
}

export default function CompanyProfilePage() {
  return <CompanyProfileContent />;
}
