import { generateMeta } from "@/lib/utils";
import { VendorPayoutsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Payouts - Vendor Portal",
    description: "View payout history and earnings across all your properties",
    canonical: "/dashboard/vendor/payouts",
  });
}

export default function VendorPayoutsPage() {
  return <VendorPayoutsContent />;
}
