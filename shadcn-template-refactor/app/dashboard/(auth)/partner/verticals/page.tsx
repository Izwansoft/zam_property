import { generateMeta } from "@/lib/utils";
import { PartnerVerticalsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Verticals - Partner Admin",
    description: "Manage enabled verticals for your partner",
    canonical: "/dashboard/partner/verticals",
  });
}

export default function PartnerVerticalsPage() {
  return <PartnerVerticalsContent />;
}
