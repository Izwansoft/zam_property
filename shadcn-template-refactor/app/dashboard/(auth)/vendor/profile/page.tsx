import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Vendor Profile - Zam Property",
    description: "View and manage your vendor business profile",
    canonical: "/dashboard/vendor/profile",
  });
}

export default function VendorProfilePage() {
  return <VendorProfileContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorProfileContent } from "./content";
