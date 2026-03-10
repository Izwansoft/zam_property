// =============================================================================
// Tenant Inspection Detail Page — Server Component
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inspection Detail | Zam Property",
  description: "View inspection details and submit video inspections",
};

export default function TenantInspectionDetailPage() {
  return <TenantInspectionDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { TenantInspectionDetailContent } from "./content";
