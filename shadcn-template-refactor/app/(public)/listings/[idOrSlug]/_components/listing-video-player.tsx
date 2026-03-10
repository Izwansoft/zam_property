/**
 * Listing Video Player
 *
 * Renders video media items from a listing using the native HTML5 <video> element.
 * Only renders when the listing has VIDEO media.
 * Supports multiple videos via tab-like selector.
 *
 * @see PublicListingDetail.media — mediaType "VIDEO"
 */

"use client";

import { useState } from "react";
import { Play, Video } from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingVideoPlayerProps {
  listing: PublicListingDetail;
}

type VideoMedia = NonNullable<PublicListingDetail["media"]>[number] & {
  mediaType: "VIDEO";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingVideoPlayer({ listing }: ListingVideoPlayerProps) {
  const videos = (listing.media?.filter((m) => m.mediaType === "VIDEO") ??
    []) as VideoMedia[];

  const [activeIndex, setActiveIndex] = useState(0);

  if (videos.length === 0) return null;

  const active = videos[activeIndex];

  return (
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl print:hidden md:p-8">
      <h3 className="mb-5 flex items-center gap-2 text-base font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-600 shadow">
          <Video className="h-4 w-4 text-white" />
        </div>
        Video{videos.length > 1 ? "s" : ""}
        {videos.length > 1 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({videos.length})
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {/* Player */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            poster={active.thumbnailUrl ?? undefined}
            className="h-full w-full object-contain"
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Multi-video selector */}
        {videos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {videos.map((v, i) => (
              <Button
                key={v.id}
                variant={i === activeIndex ? "default" : "outline"}
                size="sm"
                className="shrink-0 gap-1.5 rounded-full"
                onClick={() => setActiveIndex(i)}
              >
                <Play className="h-3 w-3" />
                {v.altText || `Video ${i + 1}`}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
