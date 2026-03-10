// =============================================================================
// Vendor Legal Cases Page — Server Component (Owner view)
// =============================================================================

import type { Metadata } from "next";
import { VendorLegalContent } from "./content";

export const metadata: Metadata = {
  title: "Legal Cases | Zam Property",
  description: "View and track legal cases escalated from overdue payments",
};

export default function VendorLegalPage() {
  return <VendorLegalContent />;
}
