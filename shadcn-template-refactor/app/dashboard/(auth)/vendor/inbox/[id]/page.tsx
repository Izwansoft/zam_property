import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Interaction Detail - Vendor Portal",
    description: "View interaction details and conversation thread",
    canonical: "/dashboard/vendor/inbox",
  });
}

export default function VendorInboxDetailPage() {
  return <VendorInboxDetailContent />;
}

import { VendorInboxDetailContent } from "./content";
