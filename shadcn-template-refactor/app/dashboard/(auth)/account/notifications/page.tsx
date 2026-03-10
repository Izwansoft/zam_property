import { generateMeta } from "@/lib/utils";
import { NotificationsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Notification Preferences - Zam Property",
    description: "Manage your notification preferences",
    canonical: "/dashboard/account/notifications",
  });
}

export default function NotificationsPage() {
  return <NotificationsContent />;
}
