// =============================================================================
// Tenant Claim Detail Page — Server Component
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claim Detail | Zam Property",
  description: "View claim details and track status",
};

export default function TenantClaimDetailPage() {
  return <TenantClaimDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { TenantClaimDetailContent } from "./content";
