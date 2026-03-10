import { generateMeta } from "@/lib/utils";
import { PlatformListingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Listing Moderation - Platform Admin",
    description:
      "Review, moderate, and manage all listings across all partners",
    canonical: "/dashboard/platform/listings",
  });
}

export default function PlatformListingsPage() {
  return <PlatformListingsContent />;
}
