import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Bill Detail - Tenant Portal",
    description: "View bill breakdown, line items, payment history, and make payments",
    canonical: "/dashboard/tenant/bills",
  });
}

export default function TenantBillDetailPage() {
  return <TenantBillDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { TenantBillDetailContent } from "./content";
