// =============================================================================
// Customer Account Portal — Loading State
// =============================================================================
// Next.js loading.tsx — automatic Suspense fallback for account portal pages.
// Shows a page shell skeleton matching the Account portal layout.
// =============================================================================

import { PageShellSkeleton } from "@/components/common/page-skeletons";

export default function AccountLoading() {
  return <PageShellSkeleton showHeaderActions={false} contentVariant="cards" />;
}
