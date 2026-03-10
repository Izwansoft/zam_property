import { generateMeta } from "@/lib/utils";
import { PlatformTeamContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Platform Team - Platform Admin",
    description: "Manage Super Admin users and platform-level roles",
    canonical: "/dashboard/platform/team",
  });
}

export default function PlatformTeamPage() {
  return <PlatformTeamContent />;
}
