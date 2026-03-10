// =============================================================================
// CustomerReviewList — Reviews written by the customer
// =============================================================================

"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { CustomerReview, CustomerReviewFilters } from "../types";

// ---------------------------------------------------------------------------
// Star rating display
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const REVIEW_STATUS_CONFIG: Record<
  CustomerReview["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Published", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CustomerReviewListProps {
  reviews: CustomerReview[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: CustomerReviewFilters;
  onFiltersChange: (filters: CustomerReviewFilters) => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------

function CustomerReviewCard({ review }: { review: CustomerReview }) {
  const statusConfig = REVIEW_STATUS_CONFIG[review.status];
  const date = new Date(review.createdAt).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating rating={review.rating} />
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            {review.title && (
              <p className="font-medium">{review.title}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {review.content}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{review.vendorName}</span>
              <span>·</span>
              <Link
                href={`/dashboard/account/reviews/${review.id}`}
                className="hover:underline"
              >
                {review.listingTitle}
              </Link>
            </div>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {date}
          </div>
        </div>

        {review.vendorReply && (
          <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Vendor Reply
            </p>
            <p className="text-sm line-clamp-2">{review.vendorReply}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CustomerReviewCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function ReviewFiltersBar({
  filters,
  onFiltersChange,
}: {
  filters: CustomerReviewFilters;
  onFiltersChange: (f: CustomerReviewFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search reviews..."
        value={filters.search ?? ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, search: e.target.value, page: 1 })
        }
        className="w-64"
      />
      <Select
        value={String(filters.rating ?? "")}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            rating: v === "all" ? "" : Number(v),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All ratings" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All ratings</SelectItem>
          <SelectItem value="5">5 Stars</SelectItem>
          <SelectItem value="4">4 Stars</SelectItem>
          <SelectItem value="3">3 Stars</SelectItem>
          <SelectItem value="2">2 Stars</SelectItem>
          <SelectItem value="1">1 Star</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerReviewList({
  reviews,
  pagination,
  filters,
  onFiltersChange,
  isLoading,
}: CustomerReviewListProps) {
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-4">
      <ReviewFiltersBar filters={filters} onFiltersChange={onFiltersChange} />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CustomerReviewCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <CustomerReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No reviews found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {filters.search || filters.rating
              ? "Try adjusting your filters."
              : "You haven't written any reviews yet. After interacting with a vendor, you can leave a review."}
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
