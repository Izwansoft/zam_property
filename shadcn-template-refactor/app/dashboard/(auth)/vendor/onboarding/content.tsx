// =============================================================================
// Vendor Onboarding — Client content component
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { OnboardingForm } from "@/modules/vendor/components/onboarding-form";

export function VendorOnboardingContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Onboarding"
        description="Complete the registration steps below to become a vendor on our platform."
      />

      <OnboardingForm />
    </div>
  );
}
