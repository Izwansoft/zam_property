// =============================================================================
// Platform Experiments — Client Content
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { ExperimentsList } from "@/modules/feature-flags/components/experiments-list";

export function PlatformExperimentsContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        description="Manage A/B tests and feature experiments across the platform."
      />
      <ExperimentsList />
    </div>
  );
}
