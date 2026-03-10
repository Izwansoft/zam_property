// =============================================================================
// Vendor Inspection Detail Page — Server Component
// =============================================================================
// Owner view of an inspection with video review capability.
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inspection Detail | Zam Property",
  description: "Review and manage property inspection",
};

export default function VendorInspectionDetailPage() {
  return <VendorInspectionDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorInspectionDetailContent } from "./content";
