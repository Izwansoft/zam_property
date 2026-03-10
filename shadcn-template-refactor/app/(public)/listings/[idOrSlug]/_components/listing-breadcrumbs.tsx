/**
 * Listing Breadcrumbs Component
 *
 * SEO-friendly breadcrumb navigation for listing detail pages.
 */

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";

interface ListingBreadcrumbsProps {
  listing: PublicListingDetail;
}

export function ListingBreadcrumbs({ listing }: ListingBreadcrumbsProps) {
  const verticalLabel = listing.verticalType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </li>
        <li>
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link
            href="/search"
            className="transition-colors hover:text-foreground"
          >
            Search
          </Link>
        </li>
        <li>
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link
            href={`/search?verticalType=${listing.verticalType}`}
            className="transition-colors hover:text-foreground"
          >
            {verticalLabel}
          </Link>
        </li>
        {listing.location?.city && (
          <>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href={`/search?city=${listing.location.city}`}
                className="transition-colors hover:text-foreground"
              >
                {listing.location.city}
              </Link>
            </li>
          </>
        )}
        <li>
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li className="truncate font-medium text-foreground" aria-current="page">
          {listing.title}
        </li>
      </ol>
    </nav>
  );
}
