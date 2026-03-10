import { generateMeta } from "@/lib/utils";
import { PlatformExperimentDetailContent } from "./content";

interface PageProps {
  params: Promise<{ key: string }>;
}

export function generateMetadata() {
  return generateMeta({
    title: "Experiment Detail - Platform Admin",
    description: "View experiment variants, opt-in management, and results",
    canonical: "/dashboard/platform/experiments",
  });
}

export default async function PlatformExperimentDetailPage({
  params,
}: PageProps) {
  const { key } = await params;
  return <PlatformExperimentDetailContent experimentKey={key} />;
}
