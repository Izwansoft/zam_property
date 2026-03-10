// =============================================================================
// Pricing Config Detail — Client Content
// =============================================================================

"use client";

import { PricingConfigDetail } from "@/modules/pricing/components/pricing-config-detail";

interface PricingConfigDetailContentProps {
  configId: string;
}

export function PricingConfigDetailContent({
  configId,
}: PricingConfigDetailContentProps) {
  return <PricingConfigDetail configId={configId} />;
}
