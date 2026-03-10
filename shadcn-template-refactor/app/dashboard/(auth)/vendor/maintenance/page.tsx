// =============================================================================
// Vendor Maintenance Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { VendorMaintenanceContent } from "./content";

export const metadata: Metadata = {
  title: "Maintenance Management | Zam Property",
  description: "Manage maintenance tickets across all your properties",
};

export default function VendorMaintenancePage() {
  return <VendorMaintenanceContent />;
}
