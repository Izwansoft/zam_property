// =============================================================================
// Tenant Inspections Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { InspectionContent } from "./content";

export const metadata: Metadata = {
  title: "Inspections | Zam Property",
  description: "Schedule and track property inspections",
};

export default function InspectionsPage() {
  return <InspectionContent />;
}
