// =============================================================================
// Company Dashboard — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { CompanyDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Company Dashboard - Zam Property",
    description: "Manage your company's properties, agents, and performance",
    canonical: "/dashboard/company",
  });
}

export default function CompanyDashboardPage() {
  return <CompanyDashboardContent />;
}
