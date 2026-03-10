import { generateMeta } from "@/lib/utils";
import { PartnerUsersContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Users - Platform Admin",
    description: "View users and roles for this partner",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PartnerUsersPage() {
  return <PartnerUsersContent />;
}
