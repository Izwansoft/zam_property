import { generateMeta } from "@/lib/utils";
import { ChargeEventsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Charge Events - Platform Admin",
    description: "View and filter charge events across all partners and vendors",
    canonical: "/dashboard/platform/pricing/charge-events",
  });
}

export default function ChargeEventsPage() {
  return <ChargeEventsContent />;
}
