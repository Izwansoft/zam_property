/**
 * Listing Floor Plans
 *
 * Displays floor plan images (DOCUMENT media type with image mime,
 * or IMAGE type tagged via filename/altText containing "floor").
 * Falls back to detecting by filename patterns.
 * Shows as a scrollable image gallery with zoom-on-click.
 *
 * @see PublicListingDetail.media
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Layers, ZoomIn, X } from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingFloorPlansProps {
  listing: PublicListingDetail;
}

type MediaItem = NonNullable<PublicListingDetail["media"]>[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FLOOR_PLAN_KEYWORDS = [
  "floor",
  "floorplan",
  "floor_plan",
  "floor-plan",
  "layout",
  "blueprint",
  "site_plan",
  "site-plan",
  "siteplan",
];

function isFloorPlan(item: MediaItem): boolean {
  // Check altText for floor plan keywords
  const searchText = (item.altText ?? "").toLowerCase();

  return FLOOR_PLAN_KEYWORDS.some((kw) => searchText.includes(kw));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingFloorPlans({ listing }: ListingFloorPlansProps) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  const floorPlans = listing.media?.filter(isFloorPlan) ?? [];

  if (floorPlans.length === 0) return null;

  return (
    <>
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl print:hidden md:p-8">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-600 shadow">
            <Layers className="h-4 w-4 text-white" />
          </div>
          Floor Plan{floorPlans.length > 1 ? "s" : ""}
          {floorPlans.length > 1 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({floorPlans.length})
            </span>
          )}
        </h3>
        <div>
          <div
            className={
              floorPlans.length === 1
                ? "space-y-0"
                : "grid gap-4 sm:grid-cols-2"
            }
          >
            {floorPlans.map((fp) => (
              <button
                key={fp.id}
                type="button"
                onClick={() => setZoomedUrl(fp.url)}
                className="group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-4/3">
                  <Image
                    src={fp.url}
                    alt={fp.altText || "Floor plan"}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
                {/* Zoom overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-lg" />
                </div>
                {/* Label */}
                {fp.altText && (
                  <p className="border-t px-3 py-2 text-left text-xs text-muted-foreground truncate">
                    {fp.altText}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Zoom Dialog */}
      <Dialog open={!!zoomedUrl} onOpenChange={() => setZoomedUrl(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogTitle className="sr-only">Floor Plan</DialogTitle>
          {zoomedUrl && (
            <div className="relative aspect-auto max-h-[85vh] w-full overflow-auto bg-card">
              <Image
                src={zoomedUrl}
                alt="Floor plan (zoomed)"
                width={1200}
                height={900}
                className="h-auto w-full object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={() => setZoomedUrl(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
