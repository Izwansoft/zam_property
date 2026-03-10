import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Company Detail - Platform Admin",
    description: "View and manage company details",
    canonical: "/dashboard/platform/companies",
  });
}

export default function PlatformCompanyDetailPage() {
  return <PlatformCompanyDetailContent />;
}

import { PlatformCompanyDetailContent } from "./content";
