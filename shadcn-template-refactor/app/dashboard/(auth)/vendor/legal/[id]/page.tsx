// =============================================================================
// Vendor Legal Case Detail Page — Server Component
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Case Detail | Zam Property",
  description: "View legal case details, timeline, and documents",
};

export default function VendorLegalDetailPage() {
  return <VendorLegalDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorLegalDetailContent } from "./content";
