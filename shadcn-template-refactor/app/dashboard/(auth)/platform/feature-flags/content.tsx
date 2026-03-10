// =============================================================================
// Platform Feature Flags — Client Content
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { FeatureFlagList } from "@/modules/feature-flags/components/feature-flag-list";

export function PlatformFeatureFlagsContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Flags"
        description="Manage feature flags, kill switches, and rollout configurations across the platform."
      />
      <FeatureFlagList />
    </div>
  );
}
