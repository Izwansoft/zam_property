import { generateMeta } from "@/lib/utils";
import { PlatformExperimentsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Experiments - Platform Admin",
    description: "Manage A/B tests and feature experiments",
    canonical: "/dashboard/platform/experiments",
  });
}

export default function PlatformExperimentsPage() {
  return <PlatformExperimentsContent />;
}
