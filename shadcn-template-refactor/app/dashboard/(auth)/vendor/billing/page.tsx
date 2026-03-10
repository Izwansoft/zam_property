import { generateMeta } from "@/lib/utils";
import { VendorBillingContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Billing - Vendor Portal",
    description: "View and manage billing across all your properties",
    canonical: "/dashboard/vendor/billing",
  });
}

export default function VendorBillingPage() {
  return <VendorBillingContent />;
}
