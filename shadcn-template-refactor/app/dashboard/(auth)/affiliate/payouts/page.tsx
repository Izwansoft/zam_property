// =============================================================================
// Affiliate Payouts — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { AffiliatePayoutsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Payouts - Zam Property",
    description: "View payout history and request new payouts",
    canonical: "/dashboard/affiliate/payouts",
  });
}

export default function AffiliatePayoutsPage() {
  return <AffiliatePayoutsContent />;
}
