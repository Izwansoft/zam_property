import { generateMeta } from "@/lib/utils";
import { PlatformFeatureFlagsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Feature Flags - Platform Admin",
    description:
      "Manage feature flags, kill switches, and rollout configurations",
    canonical: "/dashboard/platform/feature-flags",
  });
}

export default function PlatformFeatureFlagsPage() {
  return <PlatformFeatureFlagsContent />;
}
