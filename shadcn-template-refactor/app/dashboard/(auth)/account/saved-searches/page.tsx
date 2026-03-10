import { generateMeta } from "@/lib/utils";
import { SavedSearchesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Saved Searches - Account Portal",
    description: "Manage your saved property searches and alerts",
    canonical: "/dashboard/account/saved-searches",
  });
}

export default function SavedSearchesPage() {
  return <SavedSearchesContent />;
}
