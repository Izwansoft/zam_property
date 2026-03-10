// =============================================================================
// Tenant New Maintenance Request Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { NewMaintenanceContent } from "./content";

export const metadata: Metadata = {
  title: "New Maintenance Request | Zam Property",
  description: "Submit a new maintenance request for your property",
};

export default function NewMaintenancePage() {
  return <NewMaintenanceContent />;
}
