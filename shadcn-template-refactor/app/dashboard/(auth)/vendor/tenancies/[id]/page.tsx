import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Tenancy Detail - Vendor Portal",
    description: "View tenancy details, manage Partner and payments",
    canonical: "/dashboard/vendor/tenancies",
  });
}

export default function VendorTenancyDetailPage() {
  return <VendorTenancyDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorTenancyDetailContent } from "./content";
