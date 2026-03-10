// =============================================================================
// Affiliate Dashboard — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { AffiliateDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Affiliate Dashboard - Zam Property",
    description: "View your referrals, earnings, and payout status",
    canonical: "/dashboard/affiliate",
  });
}

export default function AffiliateDashboardPage() {
  return <AffiliateDashboardContent />;
}
