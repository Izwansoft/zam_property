// =============================================================================
// Platform Admin Portal — Loading State
// =============================================================================
// Next.js loading.tsx — automatic Suspense fallback for platform portal pages.
// Shows a dashboard skeleton matching the Platform Admin layout.
// =============================================================================

import { DashboardSkeleton } from "@/components/common/page-skeletons";

export default function PlatformLoading() {
  return <DashboardSkeleton statCards={4} showChart={true} showRecentItems={true} />;
}
