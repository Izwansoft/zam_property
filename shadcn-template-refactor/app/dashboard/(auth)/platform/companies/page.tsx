import { generateMeta } from "@/lib/utils";

import { PlatformCompaniesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Companies - Platform Admin",
    description: "Global company index across all partners",
    canonical: "/dashboard/platform/companies",
  });
}

export default function PlatformCompaniesPage() {
  return <PlatformCompaniesContent />;
}
