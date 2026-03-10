import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Listing Detail - Vendor Portal",
    description: "View listing details, manage status and media",
    canonical: "/dashboard/vendor/listings",
  });
}

export default function VendorListingDetailPage() {
  return <VendorListingDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorListingDetailContent } from "./content";
