import { generateMeta } from "@/lib/utils";
import { VendorDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Vendor Dashboard - Zam Property",
    description: "Vendor portal dashboard",
    canonical: "/dashboard/vendor"
  });
}

export default function VendorDashboardPage() {
  return <VendorDashboardContent />;
}
