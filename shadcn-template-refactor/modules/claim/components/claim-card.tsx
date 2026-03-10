// =============================================================================
// ClaimCard — Card component for claim list views
// =============================================================================

"use client";

import Link from "next/link";
import { ChevronRight, Calendar, DollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { Claim } from "../types";
import { CLAIM_TYPE_CONFIG, formatClaimAmount } from "../types";
import { ClaimStatusBadge } from "./claim-status-badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${
      Math.floor(diffDays / 7) !== 1 ? "s" : ""
    } ago`;
  return formatDate(dateString);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClaimCardProps {
  claim: Claim;
  /** Base path for detail links */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClaimCard({
  claim,
  basePath = "/dashboard/tenant/claims",
}: ClaimCardProps) {
  const typeConfig = CLAIM_TYPE_CONFIG[claim.type];
  const TypeIcon = typeConfig?.icon;

  return (
    <Card className="group overflow-hidden transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Icon + Content */}
          <div className="flex flex-1 items-start gap-3">
            {/* Type Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {TypeIcon && (
                <TypeIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Title + Status */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium truncate">{claim.title}</h3>
                <ClaimStatusBadge status={claim.status} size="sm" />
              </div>

              {/* Claim number + Type */}
              <p className="text-sm text-muted-foreground">
                {claim.claimNumber} &middot; {typeConfig?.label ?? claim.type}
              </p>

              {/* Property info */}
              {claim.tenancy?.listing && (
                <p className="text-xs text-muted-foreground truncate">
                  {claim.tenancy.listing.title}
                </p>
              )}

              {/* Meta: Amount, Date */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <DollarSign className="h-3 w-3" />
                  {formatClaimAmount(claim.claimedAmount)}
                </span>
                {claim.approvedAmount !== undefined &&
                  claim.approvedAmount !== null && (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      Approved: {formatClaimAmount(claim.approvedAmount)}
                    </span>
                  )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeDate(claim.submittedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              asChild
            >
              <Link href={`${basePath}/${claim.id}`}>
                View
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ClaimCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
