import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Vendor Detail - Platform Admin",
    description: "View and manage vendor details",
    canonical: "/dashboard/platform/vendors",
  });
}

export default function PlatformVendorDetailPage() {
  return <PlatformVendorDetailContent />;
}

import { PlatformVendorDetailContent } from "./content";
