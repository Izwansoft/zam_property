// =============================================================================
// Partner Admin Portal — Loading State
// =============================================================================
// Next.js loading.tsx — automatic Suspense fallback for partner portal pages.
// Shows a dashboard skeleton matching the Partner Admin layout.
// =============================================================================

import { DashboardSkeleton } from "@/components/common/page-skeletons";

export default function PartnerLoading() {
  return <DashboardSkeleton statCards={4} showChart={true} showRecentItems={true} />;
}
