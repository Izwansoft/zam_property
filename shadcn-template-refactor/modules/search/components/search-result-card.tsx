// =============================================================================
// SearchResultCard â€” Card for displaying a search hit
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Sparkles, BedDouble, ShowerHead, Car } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { SearchHit } from "../types";
import { formatCurrency } from "../utils";
import { HighlightedText } from "./highlighted-text";
import { CompareButton } from "./compare-button";
import type { ComparisonItem } from "../store/comparison-store";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchResultCardProps {
  hit: SearchHit;
  /** View mode */
  view?: "grid" | "list";
}

// ---------------------------------------------------------------------------
// Helper: convert SearchHit â†’ ComparisonItem
// ---------------------------------------------------------------------------

function hitToComparisonItem(hit: SearchHit): ComparisonItem {
  return {
    id: hit.id,
    title: hit.title,
    slug: hit.slug,
    price: hit.price,
    currency: hit.currency,
    primaryImageUrl: hit.primaryImageUrl,
    verticalType: hit.verticalType,
    location: { city: hit.location.city, state: hit.location.state },
    attributes: hit.attributes,
    vendor: { name: hit.vendor.name },
  };
}

// ---------------------------------------------------------------------------
// Grid Card
// ---------------------------------------------------------------------------

function GridCard({ hit }: { hit: SearchHit }) {
  return (
    <Link href={`/listing/${hit.slug || hit.id}`} className="group block">
      <Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          {hit.primaryImageUrl ? (
            <Image
              src={hit.primaryImageUrl}
              alt={hit.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-muted-foreground">No image</span>
            </div>
          )}
          {/* Rent/Sale badge */}
          {hit.attributes?.listingType === "rent" ? (
            <Badge className="absolute left-3 top-3 bg-emerald-600 text-white hover:bg-emerald-700">
              For Rent
            </Badge>
          ) : (
            <Badge className="absolute left-3 top-3 bg-blue-600 text-white hover:bg-blue-700">
              For Sale
            </Badge>
          )}
          {/* Featured badge */}
          {hit.isFeatured && (
            <Badge className="absolute right-3 top-3 gap-1 bg-amber-500 text-white hover:bg-amber-600">
              <Sparkles className="h-3 w-3" />
              Featured
            </Badge>
          )}
          {/* Compare button */}
          <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <CompareButton item={hitToComparisonItem(hit)} />
          </div>
        </div>

        <CardContent className="p-4">
          {/* Vendor */}
          <p className="mb-1 truncate text-xs text-muted-foreground">
            {hit.vendor.name}
          </p>

          {/* Title (with highlights) */}
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">
            <HighlightedText
              text={hit.title}
              highlights={hit.highlights?.title}
              fallback={hit.title}
            />
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{hit.location.city}</span>
          </div>

          {/* Price */}
          <p className="mt-1 text-base font-bold text-primary">
            {formatCurrency(hit.price, hit.currency)}
            {hit.attributes?.listingType === "rent" && (
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            )}
          </p>

          {/* Attributes: bedrooms, bathrooms, parking */}
          {hit.attributes && (
            <div className="mt-2 flex items-center gap-3 border-t pt-2 text-xs text-muted-foreground">
              {hit.attributes.bedrooms != null && (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" />
                  {String(hit.attributes.bedrooms)}
                </span>
              )}
              {hit.attributes.bathrooms != null && (
                <span className="flex items-center gap-1">
                  <ShowerHead className="h-3.5 w-3.5" />
                  {String(hit.attributes.bathrooms)}
                </span>
              )}
              {hit.attributes.carParks != null && (
                <span className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" />
                  {String(hit.attributes.carParks)}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// List Card
// ---------------------------------------------------------------------------

function ListCard({ hit }: { hit: SearchHit }) {
  return (
    <Link href={`/listing/${hit.slug || hit.id}`} className="group block">
      <Card className="gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
        <div className="flex">
          {/* Image */}
          <div className="relative h-32 w-40 shrink-0 overflow-hidden bg-muted sm:h-36 sm:w-48">
            {hit.primaryImageUrl ? (
              <Image
                src={hit.primaryImageUrl}
                alt={hit.title}
                fill
                className="object-cover"
                sizes="192px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
            {hit.isFeatured && (
              <Badge className="absolute left-2 top-2 gap-1 bg-amber-500 text-white hover:bg-amber-600">
                <Sparkles className="h-3 w-3" />
              </Badge>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex min-w-0 flex-1 flex-col justify-between p-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                {hit.attributes?.listingType === "rent" ? (
                  <Badge className="text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                    For Rent
                  </Badge>
                ) : (
                  <Badge className="text-xs bg-blue-600 text-white hover:bg-blue-700">
                    For Sale
                  </Badge>
                )}
                <span className="truncate text-xs text-muted-foreground">
                  {hit.vendor.name}
                </span>
              </div>
              <h3 className="mb-1 line-clamp-1 font-semibold transition-colors group-hover:text-primary">
                <HighlightedText
                  text={hit.title}
                  highlights={hit.highlights?.title}
                  fallback={hit.title}
                />
              </h3>
              {hit.highlights?.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  <HighlightedText
                    text=""
                    highlights={hit.highlights.description}
                    fallback=""
                  />
                </p>
              )}
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {hit.location.city}, {hit.location.state}
                </span>
              </div>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(hit.price, hit.currency)}
                {hit.attributes?.listingType === "rent" && (
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                )}
              </p>
              {/* Attributes: bedrooms, bathrooms, parking */}
              {hit.attributes && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {hit.attributes.bedrooms != null && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      {String(hit.attributes.bedrooms)}
                    </span>
                  )}
                  {hit.attributes.bathrooms != null && (
                    <span className="flex items-center gap-1">
                      <ShowerHead className="h-3.5 w-3.5" />
                      {String(hit.attributes.bathrooms)}
                    </span>
                  )}
                  {hit.attributes.carParks != null && (
                    <span className="flex items-center gap-1">
                      <Car className="h-3.5 w-3.5" />
                      {String(hit.attributes.carParks)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-end">
              <CompareButton item={hitToComparisonItem(hit)} />
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Exported Component
// ---------------------------------------------------------------------------

export function SearchResultCard({
  hit,
  view = "grid",
}: SearchResultCardProps) {
  if (view === "list") {
    return <ListCard hit={hit} />;
  }
  return <GridCard hit={hit} />;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function SearchResultCardSkeleton({
  view = "grid",
}: {
  view?: "grid" | "list";
}) {
  if (view === "list") {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          <Skeleton className="h-36 w-48 shrink-0" />
          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-16/10 w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between border-t pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </Card>
  );
}

