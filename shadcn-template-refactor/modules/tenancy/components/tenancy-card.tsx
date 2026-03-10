// =============================================================================
// TenancyCard — Card component for tenancy list views
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Home, Wallet, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Tenancy, TenancyStatusVariant } from "../types";
import { TENANCY_STATUS_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "MYR"): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAddress(property: Tenancy["property"]): string {
  const parts = [property.address, property.city, property.state].filter(
    Boolean
  );
  return parts.join(", ") || "No address";
}

// ---------------------------------------------------------------------------
// Badge variant mapping (shadcn Badge expects specific variants)
// ---------------------------------------------------------------------------

function getBadgeVariant(
  variant: TenancyStatusVariant
): "default" | "secondary" | "destructive" | "outline" {
  switch (variant) {
    case "success":
      return "default"; // Will use green styling via className
    case "warning":
      return "secondary"; // Will use amber styling via className
    case "destructive":
      return "destructive";
    case "outline":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusBadgeClassName(variant: TenancyStatusVariant): string {
  switch (variant) {
    case "success":
      return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "warning":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    case "destructive":
      return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TenancyCardProps {
  tenancy: Tenancy;
  /** Base path for detail link (e.g., "/dashboard/tenant/tenancy") */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenancyCard({
  tenancy,
  basePath = "/dashboard/tenant/tenancy",
}: TenancyCardProps) {
  const statusConfig = TENANCY_STATUS_CONFIG[tenancy.status];
  const badgeVariant = getBadgeVariant(statusConfig.variant);
  const badgeClassName = getStatusBadgeClassName(statusConfig.variant);

  return (
    <Link href={`${basePath}/${tenancy.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row">
          {/* Property Thumbnail */}
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted sm:aspect-square sm:w-40">
            {tenancy.property.thumbnailUrl ? (
              <Image
                src={tenancy.property.thumbnailUrl}
                alt={tenancy.property.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 160px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Home className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            {/* Status badge (mobile: top corner) */}
            <Badge
              variant={badgeVariant}
              className={`absolute left-2 top-2 text-xs sm:hidden ${badgeClassName}`}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Content */}
          <CardContent className="flex flex-1 flex-col justify-between p-4">
            <div>
              {/* Header with title and status */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-semibold leading-tight group-hover:text-primary">
                  {tenancy.property.title}
                </h3>
                {/* Status badge (desktop: inline) */}
                <Badge
                  variant={badgeVariant}
                  className={`hidden shrink-0 text-xs sm:inline-flex ${badgeClassName}`}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Unit info */}
              {tenancy.unit && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Unit {tenancy.unit.unitNumber}
                  {tenancy.unit.floor && `, Floor ${tenancy.unit.floor}`}
                  {tenancy.unit.block && `, Block ${tenancy.unit.block}`}
                </p>
              )}

              {/* Address */}
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">
                  {formatAddress(tenancy.property)}
                </span>
              </p>

              {/* Property details */}
              {(tenancy.property.bedrooms || tenancy.property.bathrooms) && (
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {tenancy.property.bedrooms && (
                    <span>{tenancy.property.bedrooms} Beds</span>
                  )}
                  {tenancy.property.bathrooms && (
                    <span>{tenancy.property.bathrooms} Baths</span>
                  )}
                  {tenancy.property.propertyType && (
                    <Badge variant="outline" className="text-xs">
                      {tenancy.property.propertyType}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Footer: dates and rent */}
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t pt-3">
              <div className="flex flex-col gap-1">
                {/* Tenancy dates */}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(tenancy.startDate)} – {formatDate(tenancy.endDate)}
                  </span>
                </p>

                {/* Owner name */}
                {tenancy.owner && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Owner: {tenancy.owner.name}</span>
                  </p>
                )}
              </div>

              {/* Monthly rent */}
              <p className="flex items-center gap-1 text-lg font-bold text-primary">
                <Wallet className="h-4 w-4" />
                {formatCurrency(tenancy.monthlyRent, tenancy.currency)}
                <span className="text-xs font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function TenancyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="aspect-[4/3] w-full shrink-0 rounded-none sm:aspect-square sm:w-40" />
        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="hidden h-5 w-20 sm:block" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
