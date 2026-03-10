// =============================================================================
// Tenant Onboarding Content — Client Component
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { OnboardingWizard } from "@/modules/tenant/components/onboarding-wizard";

export function TenantOnboardingContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Complete Your Profile"
        description="Please provide the required information to complete your tenant profile. This helps us verify your identity and process your tenancy applications faster."
      />

      <OnboardingWizard />
    </div>
  );
}
