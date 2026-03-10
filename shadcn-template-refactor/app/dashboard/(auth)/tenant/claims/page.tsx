// =============================================================================
// Tenant Claims Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { TenantClaimsContent } from "./content";

export const metadata: Metadata = {
  title: "Claims | Zam Property",
  description: "Submit and track property claims",
};

export default function ClaimsPage() {
  return <TenantClaimsContent />;
}
