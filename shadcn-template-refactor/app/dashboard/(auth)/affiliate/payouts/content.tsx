// =============================================================================
// Affiliate Payouts — Client Content
// =============================================================================
// Wraps AffiliatePayoutRequest with dynamic import (SSR disabled).
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { useAuthUser } from "@/modules/auth";
import { AffiliatePayoutSkeleton } from "@/modules/affiliate/components/affiliate-payout-request";

const AffiliatePayoutRequest = dynamic(
  () =>
    import("@/modules/affiliate/components/affiliate-payout-request").then(
      (mod) => mod.AffiliatePayoutRequest
    ),
  {
    ssr: false,
    loading: () => <AffiliatePayoutSkeleton />,
  }
);

export function AffiliatePayoutsContent() {
  const user = useAuthUser();
  const affiliateId = user.id;

  return (
    <AffiliatePayoutRequest
      affiliateId={affiliateId}
      title="Payouts"
      description="View payout history and request new payouts."
    />
  );
}
