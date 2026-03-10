import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Tenancy Detail - Tenant Portal",
    description: "View tenancy details, contract, financial summary, and actions",
    canonical: "/dashboard/tenant/tenancy",
  });
}

export default function TenantTenancyDetailPage() {
  return <TenantTenancyDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { TenantTenancyDetailContent } from "./content";
