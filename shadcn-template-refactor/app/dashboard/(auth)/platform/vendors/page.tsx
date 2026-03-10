import { generateMeta } from "@/lib/utils";

import { PlatformVendorsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Vendors - Platform Admin",
    description: "Global vendor index across all partners",
    canonical: "/dashboard/platform/vendors",
  });
}

export default function PlatformVendorsPage() {
  return <PlatformVendorsContent />;
}
