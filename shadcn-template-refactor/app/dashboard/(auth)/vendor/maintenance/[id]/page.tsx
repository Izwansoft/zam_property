// =============================================================================
// Vendor Maintenance Detail Page — Server Component
// =============================================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance Detail | Zam Property",
  description: "View and manage maintenance ticket details",
};

export default function VendorMaintenanceDetailPage() {
  return <VendorMaintenanceDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { VendorMaintenanceDetailContent } from "./content";
