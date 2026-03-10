/**
 * Listing Info Component
 *
 * Displays listing title, price, location, description, and key stats
 * with modern rounded card design.
 */

import { MapPin, Eye, Calendar, Tag } from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { Badge } from "@/components/ui/badge";

interface ListingInfoProps {
  listing: PublicListingDetail;
}

export function ListingInfo({ listing }: ListingInfoProps) {
  const formattedPrice = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: listing.currency || "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(listing.price);

  const priceLabel = getPriceLabel(listing.priceType);

  const locationParts = [
    listing.location?.city,
    listing.location?.state,
    listing.location?.country,
  ].filter(Boolean);

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Header */}
      <div className="p-6 pb-5 md:p-8 md:pb-6">
        {/* Title & Price */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {listing.title}
            </h1>
            {locationParts.length > 0 && (
              <div className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{locationParts.join(", ")}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold md:text-3xl">
              {listing.priceType === "UPON_REQUEST" ? (
                <span className="text-muted-foreground">Price Upon Request</span>
              ) : (
                <span className="bg-linear-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-emerald-400">
                  {formattedPrice}
                  {listing.priceType === "monthly" && (
                    <span className="text-lg font-medium text-muted-foreground">/mo</span>
                  )}
                </span>
              )}
            </p>
            {priceLabel && listing.priceType !== "UPON_REQUEST" && listing.priceType !== "monthly" && (
              <p className="text-muted-foreground text-sm">{priceLabel}</p>
            )}
          </div>
        </div>

        {/* Meta Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {listing.attributes?.listingType === "rent" ? (
            <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
              For Rent
            </Badge>
          ) : (
            <Badge className="rounded-full bg-blue-600 text-white hover:bg-blue-700">
              For Sale
            </Badge>
          )}
          <Badge variant="outline" className="rounded-full">
            <Tag className="mr-1 h-3 w-3" />
            {formatVerticalType(listing.verticalType)}
          </Badge>
          {listing.viewCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              <Eye className="mr-1 h-3 w-3" />
              {listing.viewCount.toLocaleString()} views
            </Badge>
          )}
          {listing.publishedAt && (
            <Badge variant="secondary" className="rounded-full">
              <Calendar className="mr-1 h-3 w-3" />
              {formatDate(listing.publishedAt)}
            </Badge>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Description */}
      <div className="p-6 md:p-8">
        <h3 className="mb-3 text-lg font-semibold">Description</h3>
        <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
          {listing.description || "No description provided."}
        </div>

        {/* Address */}
        {listing.location?.address && (
          <div className="mt-6">
            <h3 className="mb-2 text-lg font-semibold">Address</h3>
            <p className="text-muted-foreground">
              {[
                listing.location.address,
                listing.location.postalCode,
                listing.location.city,
                listing.location.state,
                listing.location.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getPriceLabel(
  priceType?: string,
): string | null {
  switch (priceType) {
    case "monthly":
      return "per month";
    case "NEGOTIABLE":
      return "Negotiable";
    case "STARTING_FROM":
      return "Starting from";
    case "FIXED":
      return "Fixed price";
    default:
      return null;
  }
}

function formatVerticalType(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
