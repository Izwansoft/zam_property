// =============================================================================
// Vendor Portal — Loading State
// =============================================================================
// Next.js loading.tsx — automatic Suspense fallback for vendor portal pages.
// Shows a dashboard skeleton matching the Vendor portal layout.
// =============================================================================

import { DashboardSkeleton } from "@/components/common/page-skeletons";

export default function VendorLoading() {
  return <DashboardSkeleton statCards={3} showChart={true} showRecentItems={true} />;
}
