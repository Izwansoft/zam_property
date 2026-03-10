// =============================================================================
// ListingCard â€” Card component for listing grid/list views
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, MessageSquare, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Listing } from "../types";
import {
  LISTING_STATUS_CONFIG,
  formatPrice,
  formatLocation,
  formatRelativeDate,
  getVerticalLabel,
} from "../utils";
import { ListingAttributeSummary } from "./listing-attribute-summary";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingCardProps {
  listing: Listing;
  /** Base path for detail link (e.g., "/dashboard/vendor/listings") */
  basePath: string;
  /** Show vendor name (for partner/platform portals) */
  showVendor?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingCard({ listing, basePath, showVendor }: ListingCardProps) {
  const statusConfig = LISTING_STATUS_CONFIG[listing.status];

  return (
    <Link href={`${basePath}/${listing.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          {listing.primaryImage ? (
            <Image
              src={listing.primaryImage}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          {/* Status badge */}
          <Badge
            variant={statusConfig.variant}
            className="absolute left-2 top-2 text-xs"
          >
            {statusConfig.label}
          </Badge>

          {/* Featured badge */}
          {listing.isFeatured && (
            <Badge
              variant="default"
              className="absolute right-2 top-2 bg-amber-500 text-xs hover:bg-amber-600"
            >
              <Star className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          {/* Price */}
          <p className="text-lg font-bold text-primary">
            {formatPrice(listing.price, listing.currency)}
            {listing.attributes?.listingType === "rent" && (
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            )}
          </p>

          {/* Title */}
          <h3 className="mt-1 truncate text-sm font-semibold leading-tight group-hover:text-primary">
            {listing.title}
          </h3>

          {/* Location */}
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatLocation(listing.location)}</span>
          </p>

          {/* Attributes row â€” driven by generic attribute summary */}
          {listing.attributes && (
            <ListingAttributeSummary
              attributes={listing.attributes}
              variant="card"
              maxItems={3}
            />
          )}

          {/* Footer: stats + meta */}
          <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {listing.viewCount}
              </span>
              {listing.inquiryCount != null && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {listing.inquiryCount}
                </span>
              )}
            </div>
            <span>{formatRelativeDate(listing.updatedAt)}</span>
          </div>

          {/* Vertical badge + vendor (optional) */}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getVerticalLabel(listing.verticalType)}
            </Badge>
            {showVendor && listing.vendorId && (
              <span className="truncate text-xs text-muted-foreground">
                Vendor: {listing.vendorId}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="flex justify-between border-t pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

