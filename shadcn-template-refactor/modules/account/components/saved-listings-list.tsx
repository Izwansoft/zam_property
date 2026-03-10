// =============================================================================
// SavedListingsList — Customer's saved / favorited listings
// =============================================================================

"use client";

import { Bookmark, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { SavedListing, SavedListingFilters } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SavedListingsListProps {
  listings: SavedListing[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: SavedListingFilters;
  onFiltersChange: (filters: SavedListingFilters) => void;
  onUnsave?: (listingId: string) => void;
  isLoading: boolean;
  isRemoving?: boolean;
}

// ---------------------------------------------------------------------------
// Saved listing card
// ---------------------------------------------------------------------------

function SavedListingCard({
  listing,
  onUnsave,
  isRemoving,
}: {
  listing: SavedListing;
  onUnsave?: (listingId: string) => void;
  isRemoving?: boolean;
}) {
  const formattedPrice = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: listing.currency,
    minimumFractionDigits: 0,
  }).format(listing.price);

  const savedDate = new Date(listing.savedAt).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="h-20 w-28 shrink-0 rounded-md bg-muted overflow-hidden">
            {listing.primaryImage ? (
              <img
                src={listing.primaryImage}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/account/saved/${listing.listingId}`}
                className="font-medium hover:underline truncate"
              >
                {listing.title}
              </Link>
              <Badge variant="secondary">{listing.status}</Badge>
            </div>
            <p className="text-sm font-semibold text-primary">{formattedPrice}</p>
            <p className="text-sm text-muted-foreground">{listing.location}</p>
            <p className="text-xs text-muted-foreground">Saved on {savedDate}</p>
          </div>

          {/* Unsave action */}
          {onUnsave && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={isRemoving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove from saved?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove &quot;{listing.title}&quot; from your saved
                    listings. You can always save it again later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUnsave(listing.listingId)}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SavedListingCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-28 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavedListingsList({
  listings,
  pagination,
  filters,
  onFiltersChange,
  onUnsave,
  isLoading,
  isRemoving,
}: SavedListingsListProps) {
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search saved listings..."
          value={filters.search ?? ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value, page: 1 })
          }
          className="w-64"
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SavedListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((listing) => (
            <SavedListingCard
              key={listing.id}
              listing={listing}
              onUnsave={onUnsave}
              isRemoving={isRemoving}
            />
          ))}
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bookmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No saved listings</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {filters.search
              ? "Try adjusting your search terms."
              : "You haven't saved any listings yet. Browse listings and click the bookmark icon to save them."}
          </p>
        </div>
      )}

      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
