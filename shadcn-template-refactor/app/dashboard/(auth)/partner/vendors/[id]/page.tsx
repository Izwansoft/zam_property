import { generateMeta } from "@/lib/utils";
import { PartnerVendorDetailContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Vendor Detail - Partner Portal",
    description: "View and moderate vendor details",
    canonical: "/dashboard/partner/vendors",
  });
}

export default function PartnerVendorDetailPage() {
  return <PartnerVendorDetailContent />;
}
