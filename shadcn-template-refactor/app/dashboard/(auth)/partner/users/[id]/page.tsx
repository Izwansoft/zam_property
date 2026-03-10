import { generateMeta } from "@/lib/utils";
import { PartnerUserDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "User Detail - Partner Admin",
    description: "View user details in your partner organization",
    canonical: "/dashboard/partner/users",
  });
}

export default function PartnerUserDetailPage() {
  return <PartnerUserDetailContent />;
}
