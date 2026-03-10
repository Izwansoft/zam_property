// =============================================================================
// Vendor Payout Detail — Server Component (Route Page)
// =============================================================================

import type { Metadata } from "next";
import { VendorPayoutDetailContent } from "./content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Payout Detail - Vendor Portal",
    description: "View payout breakdown, line items, and statement",
  };
}

export default function VendorPayoutDetailPage() {
  return <VendorPayoutDetailContent />;
}
