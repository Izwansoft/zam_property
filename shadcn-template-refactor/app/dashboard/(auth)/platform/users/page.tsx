import { generateMeta } from "@/lib/utils";
import { PlatformUsersContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "All Users - Platform Admin",
    description: "Cross-partner user list for platform administration",
    canonical: "/dashboard/platform/users",
  });
}

export default function PlatformUsersPage() {
  return <PlatformUsersContent />;
}
