import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Partner Detail - Platform Admin",
    description: "View and manage Partner details",
    canonical: "/dashboard/platform/partners",
  });
}

export default function PlatformPartnerDetailPage() {
  return <PlatformPartnerDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { PlatformPartnerDetailContent } from "./content";
