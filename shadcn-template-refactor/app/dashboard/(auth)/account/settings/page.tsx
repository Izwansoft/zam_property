import { generateMeta } from "@/lib/utils";
import { SettingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Account Settings - Zam Property",
    description: "Manage your account settings",
    canonical: "/dashboard/account/settings",
  });
}

export default function SettingsPage() {
  return <SettingsContent />;
}
