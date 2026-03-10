import { generateMeta } from "@/lib/utils";
import { NotificationPreferencesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Notification Preferences - Zam Property",
    description: "Manage your notification preferences",
    canonical: "/dashboard/vendor/settings/notifications",
  });
}

export default function NotificationPreferencesPage() {
  return <NotificationPreferencesContent />;
}
