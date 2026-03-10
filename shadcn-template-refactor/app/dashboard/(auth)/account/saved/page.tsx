import { generateMeta } from "@/lib/utils";
import { SavedListingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Saved Listings - Zam Property",
    description: "View your saved and favorited listings",
    canonical: "/dashboard/account/saved",
  });
}

export default function SavedListingsPage() {
  return <SavedListingsContent />;
}
