// =============================================================================
// Platform Experiment Detail — Client Content
// =============================================================================

"use client";

import { ExperimentDetailView } from "@/modules/feature-flags/components/experiment-detail-view";

interface Props {
  experimentKey: string;
}

export function PlatformExperimentDetailContent({
  experimentKey,
}: Props) {
  return <ExperimentDetailView experimentKey={experimentKey} />;
}
