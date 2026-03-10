import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Partners - Platform Admin",
    description: "Manage all partners on the platform",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PlatformPartnersPage() {
  return <PlatformPartnersContent />;
}

import { PlatformPartnersContent } from "./content";
