import { generateMeta } from "@/lib/utils";
import { CompanyListingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Company Listings - Company Portal",
    description: "Submit and manage company listing drafts",
    canonical: "/dashboard/company/listings",
  });
}

export default function CompanyListingsPage() {
  return <CompanyListingsContent />;
}
