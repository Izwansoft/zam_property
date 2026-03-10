import { generateMeta } from "@/lib/utils";
import { PlatformFeatureFlagDetailContent } from "./content";

interface PageProps {
  params: Promise<{ key: string }>;
}

export function generateMetadata() {
  return generateMeta({
    title: "Feature Flag Detail - Platform Admin",
    description: "View and manage feature flag overrides and user targets",
    canonical: "/dashboard/platform/feature-flags",
  });
}

export default async function PlatformFeatureFlagDetailPage({
  params,
}: PageProps) {
  const { key } = await params;
  return <PlatformFeatureFlagDetailContent flagKey={key} />;
}
