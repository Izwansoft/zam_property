import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Settings - Platform Admin",
    description: "Configure Partner settings",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PlatformPartnerSettingsPage() {
  return <PlatformPartnerSettingsContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { PlatformPartnerSettingsContent } from "./content";
