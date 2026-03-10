// =============================================================================
// Tenant Maintenance Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { MaintenanceContent } from "./content";

export const metadata: Metadata = {
  title: "Maintenance | Zam Property",
  description: "Submit and track maintenance requests for your property",
};

export default function MaintenancePage() {
  return <MaintenanceContent />;
}
