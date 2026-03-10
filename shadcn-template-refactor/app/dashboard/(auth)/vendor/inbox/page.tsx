import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Inbox - Vendor Portal",
    description: "Manage leads, enquiries, and booking requests",
    canonical: "/dashboard/vendor/inbox",
  });
}

export default function VendorInboxPage() {
  return <VendorInboxContent />;
}

import { VendorInboxContent } from "./content";
