// =============================================================================
// Listing Rich Sections — Video, Floor Plans, and Location
// =============================================================================

"use client";

import Image from "next/image";
import { Layers, MapPin, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LazyListingMap } from "@/components/common/lazy-map";

import type { ListingDetail } from "../types";

interface ListingRichSectionsProps {
  listing: ListingDetail;
}

function isFloorPlanMedia(media: NonNullable<ListingDetail["media"]>[number]): boolean {
  const text = `${media.altText ?? ""} ${media.filename ?? ""}`.toLowerCase();
  const hasKeyword = ["floor", "floorplan", "layout", "blueprint", "site plan", "site-plan"].some(
    (kw) => text.includes(kw),
  );
  if (!hasKeyword) return false;

  if (media.mediaType === "IMAGE") return true;
  if (media.mediaType === "DOCUMENT" && media.mimeType.startsWith("image/")) return true;
  return false;
}

export function ListingRichSections({ listing }: ListingRichSectionsProps) {
  const videos = (listing.media ?? []).filter((m) => m.mediaType === "VIDEO");
  const floorPlans = (listing.media ?? []).filter(isFloorPlanMedia);

  const lat = listing.location?.latitude;
  const lng = listing.location?.longitude;
  const hasMap = typeof lat === "number" && typeof lng === "number";

  if (videos.length === 0 && floorPlans.length === 0 && !hasMap) return null;

  return (
    <div className="space-y-6">
      {videos.length > 0 && (
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4" />
              Videos
              <Badge variant="secondary" className="ml-1">
                {videos.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="space-y-2">
                <div className="overflow-hidden rounded-xl border bg-black">
                  <video
                    src={video.cdnUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster={video.thumbnailUrl ?? undefined}
                    className="aspect-video w-full object-contain"
                  >
                    <track kind="captions" />
                  </video>
                </div>
                {video.altText && (
                  <p className="text-xs text-muted-foreground">{video.altText}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {floorPlans.length > 0 && (
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Floor Plans
              <Badge variant="secondary" className="ml-1">
                {floorPlans.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {floorPlans.map((plan) => (
                <a
                  key={plan.id}
                  href={plan.cdnUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-xl border bg-card transition hover:shadow-sm"
                >
                  <div className="relative aspect-4/3">
                    <Image
                      src={plan.thumbnailUrl || plan.cdnUrl}
                      alt={plan.altText || "Floor plan"}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                    {plan.altText || plan.filename || "Floor plan"}
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasMap && (
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-hidden rounded-xl border">
              <LazyListingMap
                lat={lat}
                lng={lng}
                title={listing.title}
                height="300px"
              />
            </div>
            {(listing.location?.address || listing.location?.city || listing.location?.state) && (
              <p className="text-sm text-muted-foreground">
                {[listing.location?.address, listing.location?.city, listing.location?.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
