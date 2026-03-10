import { generateMeta } from "@/lib/utils";
import { PlatformAuditContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Audit Logs - Platform Admin",
    description:
      "View immutable audit trail of all system actions across partners",
    canonical: "/dashboard/platform/audit",
  });
}

export default function PlatformAuditPage() {
  return <PlatformAuditContent />;
}
