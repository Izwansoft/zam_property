import { generateMeta } from "@/lib/utils";
import { PartnerListingApprovalsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Approval Queue - Partner Admin",
    description: "Review and approve submitted draft listings",
    canonical: "/dashboard/partner/listings/approvals",
  });
}

export default function PartnerListingApprovalsPage() {
  return <PartnerListingApprovalsContent />;
}
