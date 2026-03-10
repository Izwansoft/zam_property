/**
 * Vendor Listings Grid Component
 *
 * Displays a grid of the vendor's active listings.
 */

import Image from "next/image";
import Link from "next/link";
import { MapPin, Package } from "lucide-react";

import type { PublicSearchHit } from "@/lib/api/public-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VendorListingsGridProps {
  listings: PublicSearchHit[];
  totalCount: number;
  vendorSlug: string;
}

export function VendorListingsGrid({
  listings,
  totalCount,
  vendorSlug,
}: VendorListingsGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Active Listings{" "}
          <span className="text-muted-foreground font-normal">
            ({totalCount})
          </span>
        </h2>
        {totalCount > 12 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/search?vendorId=${vendorSlug}`}>View All</Link>
          </Button>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No active listings at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {listings.map((hit) => (
            <Link
              key={hit.id}
              href={`/listings/${hit.slug || hit.id}`}
              className="group"
            >
              <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-muted">
                  {hit.primaryImageUrl ? (
                    <Image
                      src={hit.primaryImageUrl}
                      alt={hit.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  {hit.isFeatured && (
                    <Badge className="absolute left-2 top-2" variant="default">
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <p className="font-semibold leading-tight line-clamp-2 group-hover:text-primary">
                    {hit.title}
                  </p>
                  <p className="mt-1.5 text-lg font-bold text-primary">
                    {formatPrice(hit.price, hit.currency)}
                  </p>
                  {hit.location?.city && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {hit.location.city}, {hit.location.state}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currency || "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
