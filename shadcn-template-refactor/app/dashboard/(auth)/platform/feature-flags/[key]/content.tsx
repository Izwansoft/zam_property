// =============================================================================
// Platform Feature Flag Detail — Client Content
// =============================================================================

"use client";

import { FeatureFlagDetailView } from "@/modules/feature-flags/components/feature-flag-detail-view";

interface Props {
  flagKey: string;
}

export function PlatformFeatureFlagDetailContent({ flagKey }: Props) {
  return <FeatureFlagDetailView flagKey={flagKey} />;
}
