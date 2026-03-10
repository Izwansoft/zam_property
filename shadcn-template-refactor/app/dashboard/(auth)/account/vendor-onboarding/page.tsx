import type { Metadata } from "next";

import { AccountVendorOnboardingContent } from "./content";

export const metadata: Metadata = {
  title: "Vendor Registration - Zam Property",
  description: "Complete your vendor registration and submit your onboarding application.",
  alternates: {
    canonical: "/dashboard/account/vendor-onboarding",
  },
};

export default function AccountVendorOnboardingPage() {
  return <AccountVendorOnboardingContent />;
}
