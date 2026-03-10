import { generateMeta } from "@/lib/utils";
import { PartnerSettingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Settings - Partner Admin",
    description: "Manage partner-level settings and communication preferences",
    canonical: "/dashboard/partner/settings",
  });
}

export default function PartnerSettingsPage() {
  return <PartnerSettingsContent />;
}
