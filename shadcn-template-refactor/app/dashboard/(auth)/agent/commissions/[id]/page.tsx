// =============================================================================
// Commission Detail — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { CommissionDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Commission Detail - Zam Property",
    description: "View commission details and payment status",
    canonical: "/dashboard/agent/commissions",
  });
}

export default function CommissionDetailPage() {
  return <CommissionDetailContent />;
}
