import { generateMeta } from "@/lib/utils";
import { TenantDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Tenant Dashboard - Zam Property",
    description: "Manage your tenancy, bills, and maintenance requests",
    canonical: "/dashboard/tenant",
  });
}

export default function TenantDashboardPage() {
  return <TenantDashboardContent />;
}
