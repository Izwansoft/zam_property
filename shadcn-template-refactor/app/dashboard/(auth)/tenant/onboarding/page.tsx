// =============================================================================
// Tenant Onboarding Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { TenantOnboardingContent } from "./content";

export const metadata: Metadata = {
  title: "Complete Your Profile | Zam Property",
  description: "Complete your tenant profile to continue with your tenancy application.",
};

export default function TenantOnboardingPage() {
  return <TenantOnboardingContent />;
}
