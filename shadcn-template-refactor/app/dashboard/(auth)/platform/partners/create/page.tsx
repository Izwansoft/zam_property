import { generateMeta } from "@/lib/utils";
import { CreatePartnerContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Create Partner - Platform Admin",
    description: "Create a new partner with admin user and verticals",
    canonical: "/dashboard/platform/partners/create",
  });
}

export default function CreatePartnerPage() {
  return <CreatePartnerContent />;
}
