"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ReferralList = dynamic(
  () =>
    import("@/modules/affiliate/components/referral-list").then(
      (mod) => mod.ReferralList,
    ),
  {
    ssr: false,
    loading: () => <AgentReferralsContentSkeleton />,
  },
);

export function AgentReferralsContent() {
  return (
    <ReferralList
      title="Referrals"
      description="Track referral links, signups, and payout eligibility."
    />
  );
}

export function AgentReferralsContentSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
