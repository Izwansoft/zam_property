// =============================================================================
// VendorCard — Card component for vendor grid/list views
// =============================================================================

"use client";

import Link from "next/link";
import {
  Building2,
  MapPin,
  Star,
  FileText,
  Clock,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Vendor } from "../types";
import {
  VENDOR_STATUS_CONFIG,
  getVendorTypeLabel,
  formatVendorLocation,
  formatRating,
  formatRelativeDate,
} from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VendorCardProps {
  vendor: Vendor;
  /** Base path for detail link (e.g., "/dashboard/partner/vendors") */
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorCard({ vendor, basePath }: VendorCardProps) {
  const statusConfig = VENDOR_STATUS_CONFIG[vendor.status];

  return (
    <Link href={`${basePath}/${vendor.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          {/* Header: name + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar / Logo */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-sm group-hover:text-primary transition-colors">
                  {vendor.name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3" />
                  {getVendorTypeLabel(vendor.type)}
                </p>
              </div>
            </div>
            <Badge variant={statusConfig.variant} className="shrink-0 text-xs">
              {statusConfig.label}
            </Badge>
          </div>

          {/* Description */}
          {vendor.description && (
            <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
              {vendor.description}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            {/* Location */}
            {vendor.address && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {formatVendorLocation(vendor.address)}
              </span>
            )}

            {/* Rating */}
            {vendor.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                {formatRating(vendor.rating)}
                <span className="text-muted-foreground/70">
                  ({vendor.reviewCount})
                </span>
              </span>
            )}

            {/* Listings */}
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 shrink-0" />
              {vendor.activeListingCount}/{vendor.listingCount} listings
            </span>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            {vendor.registrationNumber && (
              <span className="truncate">{vendor.registrationNumber}</span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(vendor.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function VendorCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-3/4" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="mt-3 border-t pt-3 flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
