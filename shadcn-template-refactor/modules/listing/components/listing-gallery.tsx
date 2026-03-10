// =============================================================================
// ListingGallery â€” Image gallery with lightbox for listing detail
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import type { ListingMedia } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingGalleryProps {
  media: ListingMedia[];
  title: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingGallery({ media, title }: ListingGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = media.filter((m) => m.mediaType === "IMAGE");

  const goTo = useCallback(
    (index: number) => {
      if (index < 0) setSelectedIndex(images.length - 1);
      else if (index >= images.length) setSelectedIndex(0);
      else setSelectedIndex(index);
    },
    [images.length]
  );

  const goNext = useCallback(() => goTo(selectedIndex + 1), [goTo, selectedIndex]);
  const goPrev = useCallback(() => goTo(selectedIndex - 1), [goTo, selectedIndex]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted">
        <p className="text-sm text-muted-foreground">No images available</p>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="group relative aspect-video overflow-hidden rounded-lg border bg-muted">
          <Image
            src={currentImage.cdnUrl}
            alt={currentImage.altText || title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />

          {/* Zoom button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/10 group-hover:opacity-100"
            aria-label="Open image fullscreen"
          >
            <div className="rounded-full bg-black/50 p-2">
              <ZoomIn className="h-5 w-5 text-white" />
            </div>
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                onClick={goPrev}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                onClick={goNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                  idx === selectedIndex
                    ? "border-primary ring-1 ring-primary"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
                aria-label={`View image ${idx + 1}`}
              >
                <Image
                  src={img.thumbnailUrl || img.cdnUrl}
                  alt={img.altText || `${title} - Image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95 [&>button]:hidden">
          <div className="relative flex h-[90vh] items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Main image */}
            <div className="relative h-full w-full">
              <Image
                src={currentImage.cdnUrl}
                alt={currentImage.altText || title}
                fill
                className="object-contain"
                sizes="95vw"
              />
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                  onClick={goNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ListingGallerySkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-video animate-pulse rounded-lg bg-muted" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 w-20 shrink-0 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

