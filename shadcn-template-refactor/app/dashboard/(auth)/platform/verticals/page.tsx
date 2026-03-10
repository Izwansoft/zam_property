import { generateMeta } from "@/lib/utils";
import { PlatformVerticalsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Marketplace Types - Platform Admin",
    description: "Manage marketplace types available on the platform",
    canonical: "/dashboard/platform/verticals",
  });
}

export default function PlatformVerticalsPage() {
  return <PlatformVerticalsContent />;
}
