// =============================================================================
// ReviewList — Review list with filters, cards, and pagination
// =============================================================================

"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import type { Review, ReviewFilters } from "../types";
import { ReviewCardSkeleton } from "./review-card";
import { ReviewFiltersBar } from "./review-filters";
import { ReviewPagination } from "./review-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, getRatingLabel } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewListProps {
  reviews: Review[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  isLoading: boolean;
  /** Base path for detail links */
  basePath: string;
  /** Whether to show vendor name on cards (partner/platform view) */
  showVendor?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewList({
  reviews,
  pagination,
  filters,
  onFiltersChange,
  isLoading,
  basePath,
  showVendor = false,
}: ReviewListProps) {
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ReviewFiltersBar filters={filters} onFiltersChange={onFiltersChange} />

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Review table */}
      {!isLoading && reviews.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review</TableHead>
                {showVendor && <TableHead>Vendor</TableHead>}
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => {
                const rating = Number(review?.rating ?? 0);

                return (
                  <TableRow key={review.id}>
                    <TableCell>
                      <Link
                        href={`${basePath}/${review.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {review.title || review.listingTitle || "Untitled review"}
                      </Link>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {review.content}
                      </div>
                    </TableCell>
                    {showVendor && <TableCell>{review.vendorName || "-"}</TableCell>}
                    <TableCell>{rating.toFixed(1)} ({getRatingLabel(Math.round(rating))})</TableCell>
                    <TableCell>
                      <Badge variant="outline">{review.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(review.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No reviews found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {filters.search || filters.status || filters.rating
              ? "Try adjusting your filters or search terms."
              : "No reviews yet. Reviews will appear here when customers leave feedback."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <ReviewPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
