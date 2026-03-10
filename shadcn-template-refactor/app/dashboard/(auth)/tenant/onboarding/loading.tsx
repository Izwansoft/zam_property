// =============================================================================
// Tenant Onboarding Loading — Suspense fallback
// =============================================================================

import { OnboardingWizardSkeleton } from "@/modules/tenant/components/onboarding-wizard";

export default function TenantOnboardingLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>

      {/* Wizard skeleton */}
      <OnboardingWizardSkeleton />
    </div>
  );
}
