// =============================================================================
// Tenant Tenancy List Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { TenancyListContent } from "./content";

export const metadata: Metadata = {
  title: "My Tenancy | Zam Property",
  description: "View and manage your tenancy agreements",
};

export default function TenancyListPage() {
  return <TenancyListContent />;
}
