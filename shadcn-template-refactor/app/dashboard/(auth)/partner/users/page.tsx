import { generateMeta } from "@/lib/utils";
import { PartnerUsersContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Users - Partner Admin",
    description: "Manage users and roles within your partner organization",
    canonical: "/dashboard/partner/users",
  });
}

export default function PartnerUsersPage() {
  return <PartnerUsersContent />;
}
