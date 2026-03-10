import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Contract - Tenancy Agreement",
    description: "View and sign your tenancy agreement contract",
    canonical: "/dashboard/tenant/tenancy",
  });
}

export default function TenantContractPage() {
  return <TenantContractContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { TenantContractContent } from "./content";
