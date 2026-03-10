import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Listing Detail - Platform Admin",
    description: "View and manage listing details",
    canonical: "/dashboard/platform/listings",
  });
}

export default function PlatformListingDetailPage() {
  return <PlatformListingDetailContent />;
}

import { PlatformListingDetailContent } from "./content";
