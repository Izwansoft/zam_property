// =============================================================================
// Tenant Bills Page — Server Component
// =============================================================================

import type { Metadata } from "next";
import { BillsListContent } from "./content";

export const metadata: Metadata = {
  title: "My Bills | Zam Property",
  description: "View and manage your rental bills and payments",
};

export default function BillsListPage() {
  return <BillsListContent />;
}
