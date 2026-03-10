import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Create Listing - Vendor Portal",
    description: "Create a new property listing",
    canonical: "/dashboard/vendor/listings/create",
  });
}

export default function VendorCreateListingPage() {
  return <VendorCreateListingContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorCreateListingContent } from "./content";
