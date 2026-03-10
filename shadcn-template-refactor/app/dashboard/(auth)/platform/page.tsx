import { generateMeta } from "@/lib/utils";
import { PlatformDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Platform Admin - Zam Property",
    description: "Platform administration dashboard",
    canonical: "/dashboard/platform"
  });
}

export default function PlatformDashboardPage() {
  return <PlatformDashboardContent />;
}
