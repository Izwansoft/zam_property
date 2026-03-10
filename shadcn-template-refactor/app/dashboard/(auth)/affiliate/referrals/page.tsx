// =============================================================================
// Affiliate Referrals — Server Page
// =============================================================================

import { generateMeta } from "@/lib/utils";
import { AffiliateReferralsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Referrals - Zam Property",
    description: "View and track all your affiliate referrals",
    canonical: "/dashboard/affiliate/referrals",
  });
}

export default function AffiliateReferralsPage() {
  return <AffiliateReferralsContent />;
}
