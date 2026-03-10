"use client";

// =============================================================================
// Tenant Status Badge — Display tenant verification status
// =============================================================================

import React from "react";
import { Badge } from "@/components/ui/badge";
import { TenantStatus } from "../types";

interface TenantStatusBadgeProps {
  status: TenantStatus;
  className?: string;
}

const statusConfig: Record<TenantStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [TenantStatus.PENDING]: {
    label: "Pending",
    variant: "outline",
  },
  [TenantStatus.SCREENING]: {
    label: "Screening",
    variant: "outline",
  },
  [TenantStatus.APPROVED]: {
    label: "Approved",
    variant: "default",
  },
  [TenantStatus.REJECTED]: {
    label: "Rejected",
    variant: "destructive",
  },
  [TenantStatus.ACTIVE]: {
    label: "Active",
    variant: "default",
  },
  [TenantStatus.NOTICE_GIVEN]: {
    label: "Notice Given",
    variant: "secondary",
  },
  [TenantStatus.VACATED]: {
    label: "Vacated",
    variant: "secondary",
  },
};

export function TenantStatusBadge({ status, className }: TenantStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
