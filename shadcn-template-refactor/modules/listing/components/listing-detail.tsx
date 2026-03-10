// =============================================================================
// ListingDetail — Composite component for listing detail page
// =============================================================================
// Assembles gallery, info, stats, and actions into a cohesive detail view.
// =============================================================================

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { ListingDetail as ListingDetailType } from "../types";
import { ListingGallery, ListingGallerySkeleton } from "./listing-gallery";
import { ListingInfo, ListingInfoSkeleton } from "./listing-info";
import { ListingStats, ListingStatsSkeleton } from "./listing-stats";
import { ListingActions } from "./listing-actions";
import { ListingRichSections } from "./listing-rich-sections";
import { ViewAuditHistoryLink } from "@/modules/audit";
import { ListingApprovalTimeline } from "./listing-approval-timeline";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingDetailProps {
  listing: ListingDetailType;
  /** Portal type affects which actions/info are shown */
  portal: "vendor" | "partner" | "agent" | "company";
  /** Base path for navigation (e.g., "/dashboard/vendor/listings") */
  basePath: string;
  /** Show vendor info (for partner/platform portals) */
  showVendor?: boolean;
  /** Base path for related entities (vendors/agents/companies). Example: /dashboard/platform */
  entityBasePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingDetailView({
  listing,
  portal,
  basePath,
  showVendor,
  entityBasePath,
}: ListingDetailProps) {
  return (
    <div className="space-y-6">
      {/* Back navigation + actions bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {portal === "partner" && (
            <ViewAuditHistoryLink
              targetType="listing"
              targetId={listing.id}
              portal="partner"
              compact
            />
          )}
          {(portal === "vendor" || portal === "partner") && (
            <ListingActions
              listing={listing}
              portal={portal}
              basePath={basePath}
            />
          )}
        </div>
      </div>

      {/* Stats row */}
      <ListingStats listing={listing} />

      <Separator />

      {/* Content: gallery + info side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Gallery — takes 3/5 on desktop */}
        <div className="lg:col-span-3">
          <ListingGallery
            media={listing.media ?? []}
            title={listing.title}
          />

          {/* Rich content sections (video, floor plans, map) */}
          <div className="mt-6">
            <ListingRichSections listing={listing} />
          </div>
        </div>

        {/* Info — takes 2/5 on desktop */}
        <div className="lg:col-span-2">
          <ListingInfo
            listing={listing}
            showVendor={showVendor}
            entityBasePath={entityBasePath}
          />

          {(portal === "agent" || portal === "company") && (
            <div className="mt-6">
              <ListingApprovalTimeline listing={listing} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ListingDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back nav + actions */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Stats */}
      <ListingStatsSkeleton />

      <Separator />

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ListingGallerySkeleton />
        </div>
        <div className="lg:col-span-2">
          <ListingInfoSkeleton />
        </div>
      </div>
    </div>
  );
}
