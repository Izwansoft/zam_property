// =============================================================================
// Vendor Claim Detail Page — Server Component (Owner review view)
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claim Detail | Zam Property",
  description: "Review and manage claim details",
};

export default function VendorClaimDetailPage() {
  return <VendorClaimDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorClaimDetailContent } from "./content";
