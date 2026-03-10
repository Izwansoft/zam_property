"use client";

import { Badge } from "@/components/ui/badge";
import type { PropertyRole } from "@/types/backend-contracts";
import { PROPERTY_ROLE_CONFIG } from "../types";

interface PropertyRoleBadgeProps {
  role: PropertyRole;
  className?: string;
}

/**
 * Badge component that displays a PropertyRole with appropriate styling.
 *
 * @example
 * ```tsx
 * <PropertyRoleBadge role="PROPERTY_MANAGER" />
 * ```
 */
export function PropertyRoleBadge({ role, className }: PropertyRoleBadgeProps) {
  const config = PROPERTY_ROLE_CONFIG[role];

  if (!config) {
    return <Badge variant="outline" className={className}>{role}</Badge>;
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
