import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Vendor Onboarding - Zam Property",
    description: "Complete your vendor registration to start listing properties",
    canonical: "/dashboard/vendor/onboarding",
  });
}

export default function VendorOnboardingPage() {
  return <VendorOnboardingContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorOnboardingContent } from "./content";
