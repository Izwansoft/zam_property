import { generateMeta } from "@/lib/utils";
import { VendorSettingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Vendor Settings - Zam Property",
    description: "Manage your vendor business settings",
    canonical: "/dashboard/vendor/settings",
  });
}

export default function VendorSettingsPage() {
  return <VendorSettingsContent />;
}
