// =============================================================================
// InquiryList — Customer's sent inquiries list with filters
// =============================================================================

"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { CustomerInquiry, InquiryFilters, InquiryStatus } from "../types";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  NEW: { label: "New", variant: "default" },
  CONTACTED: { label: "Contacted", variant: "secondary" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  CLOSED: { label: "Closed", variant: "outline" },
  INVALID: { label: "Invalid", variant: "destructive" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface InquiryListProps {
  inquiries: CustomerInquiry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: InquiryFilters;
  onFiltersChange: (filters: InquiryFilters) => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function InquiryFiltersBar({
  filters,
  onFiltersChange,
}: {
  filters: InquiryFilters;
  onFiltersChange: (f: InquiryFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search inquiries..."
        value={filters.search ?? ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, search: e.target.value, page: 1 })
        }
        className="w-64"
      />
      <Select
        value={filters.status ?? ""}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            status: (v === "all" ? "" : v) as InquiryStatus | "",
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="NEW">New</SelectItem>
          <SelectItem value="CONTACTED">Contacted</SelectItem>
          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
          <SelectItem value="CLOSED">Closed</SelectItem>
          <SelectItem value="INVALID">Invalid</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inquiry card
// ---------------------------------------------------------------------------

function InquiryCard({ inquiry }: { inquiry: CustomerInquiry }) {
  const statusConfig = STATUS_CONFIG[inquiry.status];
  const date = new Date(inquiry.createdAt);
  const formattedDate = date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/account/inquiries/${inquiry.id}`}
                className="font-medium hover:underline truncate"
              >
                {inquiry.listingTitle}
              </Link>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{inquiry.vendorName}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {inquiry.message}
            </p>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {formattedDate}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function InquiryCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InquiryList({
  inquiries,
  pagination,
  filters,
  onFiltersChange,
  isLoading,
}: InquiryListProps) {
  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-4">
      <InquiryFiltersBar filters={filters} onFiltersChange={onFiltersChange} />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <InquiryCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && inquiries.length > 0 && (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}

      {!isLoading && inquiries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No inquiries found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {filters.search || filters.status
              ? "Try adjusting your filters or search terms."
              : "You haven't sent any inquiries yet. Browse listings to get started."}
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
