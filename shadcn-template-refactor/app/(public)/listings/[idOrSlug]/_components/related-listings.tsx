/**
 * Related Listings Component
 *
 * Displays a grid of related listings (same vertical / city).
 */

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import type { PublicSearchHit } from "@/lib/api/public-api";
import { Badge } from "@/components/ui/badge";

interface RelatedListingsProps {
  listings: PublicSearchHit[];
}

export function RelatedListings({ listings }: RelatedListingsProps) {
  if (listings.length === 0) return null;

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold">Similar Listings</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((hit) => (
          <Link
            key={hit.id}
            href={`/listings/${hit.slug || hit.id}`}
            className="group"
          >
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:-translate-y-1 hover:border-border hover:shadow-lg">
              {/* Image */}
              <div className="relative aspect-4/3 bg-muted">
                {hit.primaryImageUrl ? (
                  <Image
                    src={hit.primaryImageUrl}
                    alt={hit.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                {hit.isFeatured && (
                  <Badge className="absolute left-2 top-2 rounded-full" variant="default">
                    Featured
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="font-semibold leading-tight line-clamp-2 group-hover:text-primary">
                  {hit.title}
                </p>
                <p className="mt-1 text-sm font-bold text-primary">
                  {formatPrice(hit.price, hit.currency)}
                </p>
                {hit.location?.city && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {hit.location.city}, {hit.location.state}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currency || "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
