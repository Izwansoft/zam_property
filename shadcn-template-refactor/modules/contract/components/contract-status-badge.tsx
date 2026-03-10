// =============================================================================
// ContractStatusBadge — Badge component for contract and signer status
// =============================================================================

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ContractStatus,
  CONTRACT_STATUS_CONFIG,
  SignerStatus,
  SIGNER_STATUS_CONFIG,
  type ContractStatusVariant,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBadgeVariant(
  variant: ContractStatusVariant
): "default" | "secondary" | "destructive" | "outline" {
  switch (variant) {
    case "success":
      return "default";
    case "warning":
      return "secondary";
    case "destructive":
      return "destructive";
    case "outline":
      return "outline";
    default:
      return "secondary";
  }
}

function getVariantClassName(variant: ContractStatusVariant): string {
  switch (variant) {
    case "success":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    case "destructive":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    case "outline":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// ContractStatusBadge Props
// ---------------------------------------------------------------------------

interface ContractStatusBadgeProps {
  status: ContractStatus;
  showDescription?: boolean;
  className?: string;
  size?: "sm" | "default";
}

/**
 * Badge component for displaying contract status.
 *
 * @example
 * ```tsx
 * <ContractStatusBadge status={ContractStatus.PENDING_SIGNATURES} />
 * <ContractStatusBadge status={ContractStatus.SIGNED} showDescription />
 * ```
 */
export function ContractStatusBadge({
  status,
  showDescription = false,
  className,
  size = "default",
}: ContractStatusBadgeProps) {
  const config = CONTRACT_STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <Badge
        variant={getBadgeVariant(config.variant)}
        className={cn(
          getVariantClassName(config.variant),
          size === "sm" && "text-xs px-1.5 py-0"
        )}
      >
        {config.label}
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground">{config.description}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SignerStatusBadge Props
// ---------------------------------------------------------------------------

interface SignerStatusBadgeProps {
  status: SignerStatus;
  className?: string;
  size?: "sm" | "default";
}

/**
 * Badge component for displaying signer status.
 *
 * @example
 * ```tsx
 * <SignerStatusBadge status={SignerStatus.SIGNED} />
 * <SignerStatusBadge status={SignerStatus.PENDING} size="sm" />
 * ```
 */
export function SignerStatusBadge({
  status,
  className,
  size = "default",
}: SignerStatusBadgeProps) {
  const config = SIGNER_STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      variant={getBadgeVariant(config.variant)}
      className={cn(
        getVariantClassName(config.variant),
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
