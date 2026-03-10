// =============================================================================
// Vendor Claims Page — Server Component (Owner view)
// =============================================================================

import type { Metadata } from "next";
import { VendorClaimsContent } from "./content";

export const metadata: Metadata = {
  title: "Claims | Zam Property",
  description: "Review and manage property claims",
};

export default function VendorClaimsPage() {
  return <VendorClaimsContent />;
}
