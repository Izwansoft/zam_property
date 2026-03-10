import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Edit Listing - Vendor Portal",
    description: "Edit your property listing",
    canonical: "/dashboard/vendor/listings/edit",
  });
}

export default function VendorEditListingPage() {
  return <VendorEditListingContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorEditListingContent } from "./content";
