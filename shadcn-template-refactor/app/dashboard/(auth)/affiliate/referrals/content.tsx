// =============================================================================
// Affiliate Referrals — Client Content
// =============================================================================
// Wraps ReferralList with dynamic import (SSR disabled).
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { useAuthUser } from "@/modules/auth";
import { ReferralListSkeleton } from "@/modules/affiliate/components/referral-list";

const ReferralList = dynamic(
  () =>
    import("@/modules/affiliate/components/referral-list").then(
      (mod) => mod.ReferralList
    ),
  {
    ssr: false,
    loading: () => <ReferralListSkeleton />,
  }
);

export function AffiliateReferralsContent() {
  const user = useAuthUser();
  const affiliateId = user.id;

  return (
    <ReferralList
      affiliateId={affiliateId}
      title="My Referrals"
      description="View and track all your affiliate referrals."
    />
  );
}
