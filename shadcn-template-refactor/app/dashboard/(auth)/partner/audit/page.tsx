import { generateMeta } from "@/lib/utils";
import { PartnerAuditContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Audit Logs - Partner Admin",
    description:
      "View audit trail of all actions within your partner",
    canonical: "/dashboard/partner/audit",
  });
}

export default function PartnerAuditPage() {
  return <PartnerAuditContent />;
}
