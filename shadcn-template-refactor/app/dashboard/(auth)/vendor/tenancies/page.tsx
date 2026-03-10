import { generateMeta } from "@/lib/utils";
import { VendorTenanciesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Tenancies - Vendor Portal",
    description: "Manage tenancies across all your properties",
    canonical: "/dashboard/vendor/tenancies"
  });
}

export default function VendorTenanciesPage() {
  return <VendorTenanciesContent />;
}
