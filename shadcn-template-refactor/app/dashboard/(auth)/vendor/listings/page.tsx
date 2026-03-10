import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "My Listings - Vendor Portal",
    description: "Manage your property listings",
    canonical: "/dashboard/vendor/listings",
  });
}

export default function VendorListingsPage() {
  return <VendorListingsContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorListingsContent } from "./content";
