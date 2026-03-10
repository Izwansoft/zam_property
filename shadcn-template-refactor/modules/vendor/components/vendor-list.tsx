// =============================================================================
// VendorList — Grid/list view with filters and pagination
// =============================================================================

"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";

import type { Vendor, VendorFilters } from "../types";
import { VendorCardSkeleton } from "./vendor-card";
import { VendorFiltersBar } from "./vendor-filters";
import { VendorPagination } from "./vendor-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, getVendorTypeLabel } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VendorListProps {
  vendors: Vendor[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: VendorFilters;
  onFiltersChange: (filters: VendorFilters) => void;
  isLoading?: boolean;
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorList({
  vendors,
  pagination,
  filters,
  onFiltersChange,
  isLoading,
  basePath,
}: VendorListProps) {
  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  const safeVendors = vendors.filter((vendor): vendor is Vendor => !!vendor && typeof vendor === "object");

  return (
    <div className="space-y-4">
      {/* Filters */}
      <VendorFiltersBar filters={filters} onFiltersChange={onFiltersChange} />

      {/* Results info */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing {safeVendors.length} of {pagination.total} vendor
          {pagination.total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <VendorCardSkeleton key={i} />)}
        </div>
      ) : safeVendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No vendors found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filters.search || filters.status || filters.type
              ? "Try adjusting your filters or search terms."
              : "No vendors have been registered yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Listings</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeVendors.map((vendor) => {
                // Backend payloads can occasionally omit aggregate fields.
                // Keep table rendering resilient with safe numeric fallbacks.
                const listingCount = Number(vendor?.listingCount ?? 0);
                const rating = Number(vendor?.rating ?? 0);

                return (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <Link
                        href={`${basePath}/${vendor.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {vendor.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{vendor.email ?? "-"}</div>
                    </TableCell>
                    <TableCell>{getVendorTypeLabel(vendor.type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{vendor.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{listingCount}</TableCell>
                    <TableCell className="text-right">{rating.toFixed(1)}</TableCell>
                    <TableCell>{formatDate(vendor.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <VendorPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
