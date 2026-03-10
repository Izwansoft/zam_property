// =============================================================================
// ViewAuditHistoryLink — Contextual link to audit logs for an entity
// =============================================================================
// Renders a small link/button that navigates to the audit logs page
// pre-filtered for a specific entity (target).
// Used on listing, vendor, partner, user detail pages.
// =============================================================================

"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ViewAuditHistoryLinkProps {
  /** The entity type (e.g. "listing", "vendor", "partner", "user") */
  targetType: string;
  /** The entity UUID */
  targetId: string;
  /** Which portal to link to (default: "platform") */
  portal?: "platform" | "partner";
  /** Optional extra className */
  className?: string;
  /** If true, render as an icon-only button */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ViewAuditHistoryLink({
  targetType,
  targetId,
  portal = "platform",
  className,
  compact = false,
}: ViewAuditHistoryLinkProps) {
  const href = `/dashboard/${portal}/audit?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={className} asChild>
              <Link href={href}>
                <History className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Audit History</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button variant="ghost" size="sm" className={className} asChild>
      <Link href={href}>
        <History className="mr-1 h-4 w-4" />
        View Audit History
      </Link>
    </Button>
  );
}
