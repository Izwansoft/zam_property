// =============================================================================
// PayoutStatusBadge — Status badge for payout records
// =============================================================================

"use client";

import { Badge } from "@/components/ui/badge";
import { PayoutStatus, PAYOUT_STATUS_CONFIG } from "../types";

interface PayoutStatusBadgeProps {
  status: PayoutStatus;
  className?: string;
}

export function PayoutStatusBadge({ status, className }: PayoutStatusBadgeProps) {
  const config = PAYOUT_STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
