/**
 * Listing Gallery Component
 *
 * Displays listing images in a responsive grid with main + thumbnails.
 * Server Component — no client interactivity needed.
 */

import Image from "next/image";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { Badge } from "@/components/ui/badge";

interface ListingGalleryProps {
  listing: PublicListingDetail;
}

export function ListingGallery({ listing }: ListingGalleryProps) {
  const images =
    listing.media
      ?.filter((m) => m.mediaType === "IMAGE" && !!m.url)
      .sort((a, b) => a.sortOrder - b.sortOrder) ?? [];

  // Fallback to primaryImage if no media
  const primaryUrl =
    images[0]?.url ??
    listing.primaryImage ??
    "/images/placeholder-listing.svg";

  const additionalImages = images.length > 1 ? images.slice(1, 5) : [];

  return (
    <div className="relative">
      {/* Featured Badge */}
      {listing.isFeatured && (
        <Badge className="absolute left-4 top-4 z-10 rounded-full border-0 bg-linear-to-r from-orange-500 to-amber-400 px-4 py-1.5 text-white shadow-lg" variant="default">
          Featured
        </Badge>
      )}

      {/* Single Image Layout */}
      {additionalImages.length === 0 && (
        <div className="group relative aspect-video w-full overflow-hidden rounded-3xl bg-muted shadow-2xl ring-1 ring-white/10">
          <Image
            src={primaryUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Grid Layout for Multiple Images */}
      {additionalImages.length > 0 && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:grid-rows-2">
          {/* Main Image */}
          <div className="group relative aspect-4/3 overflow-hidden rounded-3xl bg-muted shadow-2xl ring-1 ring-white/10 md:col-span-2 md:row-span-2 md:aspect-auto md:h-full">
            <Image
              src={primaryUrl}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 600px"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
          </div>

          {/* Additional Images */}
          {additionalImages.map((img, index) => (
            <div
              key={img.id}
              className="group relative hidden aspect-4/3 overflow-hidden rounded-2xl bg-muted ring-1 ring-white/10 md:block">
              <Image
                src={img.url}
                alt={img.altText || `${listing.title} - Image ${index + 2}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="300px"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              {/* Show remaining count on last thumbnail */}
              {index === additionalImages.length - 1 &&
                images.length > 5 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-lg font-semibold text-white">
                      +{images.length - 5} more
                    </span>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
