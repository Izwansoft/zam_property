"use client";

import { PageHeader } from "@/components/common/page-header";
import { OnboardingForm } from "@/modules/vendor/components/onboarding-form";

export function AccountVendorOnboardingContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Registration"
        description="Set up your vendor profile and submit your application for partner review."
      />

      <OnboardingForm />
    </div>
  );
}
