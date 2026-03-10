// =============================================================================
// ListingInfo — Core info display for listing detail page
// =============================================================================

"use client";

import {
  MapPin,
  Calendar,
  Tag,
  Home,
  Store,
  User,
  Building2,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import type { ListingDetail } from "../types";
import {
  LISTING_STATUS_CONFIG,
  formatPrice,
  formatLocation,
  formatDate,
  getVerticalLabel,
} from "../utils";
import { ListingAttributeSummary } from "./listing-attribute-summary";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingInfoProps {
  listing: ListingDetail;
  /** Show vendor info (for partner/platform portals) */
  showVendor?: boolean;
  /** Base path for related entities (vendors/agents/companies). Example: /dashboard/platform */
  entityBasePath?: string;
}

// ---------------------------------------------------------------------------
// Attribute display helpers
// ---------------------------------------------------------------------------

function getListingTypeLabel(value: string): string {
  return value === "rent" ? "For Rent" : "For Sale";
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "NA";
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingInfo({
  listing,
  showVendor,
  entityBasePath = "/dashboard/platform",
}: ListingInfoProps) {
  const statusConfig = LISTING_STATUS_CONFIG[listing.status];
  const attrs = listing.attributes || {};
  const isPlatformEntityBase = entityBasePath.includes("/dashboard/platform");

  const getEntityHref = (
    entity: "vendors" | "agents" | "companies",
    id: string,
  ): string | undefined => {
    if (entity === "vendors") {
      return `${entityBasePath}/vendors/${id}`;
    }

    if (!isPlatformEntityBase) {
      return undefined;
    }

    return `${entityBasePath}/${entity}/${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {/* Status + vertical badges */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <Badge variant="outline">{getVerticalLabel(listing.verticalType)}</Badge>
          {listing.isFeatured && (
            <Badge className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
          )}
          {typeof attrs.listingType === "string" && (
            <Badge variant="secondary">
              {getListingTypeLabel(attrs.listingType)}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {listing.title}
        </h1>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          {listing.location?.address
            ? `${listing.location.address}, ${formatLocation(listing.location)}`
            : formatLocation(listing.location)}
        </p>

        {/* Price */}
        <p className="mt-3 text-3xl font-bold text-primary">
          {formatPrice(listing.price, listing.currency)}
          {attrs.listingType === "rent" && (
            <span className="text-lg font-normal text-muted-foreground">
              {" "}
              / month
            </span>
          )}
        </p>
        {listing.priceType && listing.priceType !== "FIXED" && (
          <p className="text-sm text-muted-foreground">
            Price type: {listing.priceType.replace("_", " ").toLowerCase()}
          </p>
        )}
      </div>

      <Separator />

      {/* Key attributes grid — driven by generic attribute summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ListingAttributeSummary
            attributes={listing.attributes}
            variant="detail"
          />
        </CardContent>
      </Card>

      {/* Description */}
      {listing.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Meta info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetaItem
              icon={Calendar}
              label="Created"
              value={formatDate(listing.createdAt)}
            />
            <MetaItem
              icon={Calendar}
              label="Last Updated"
              value={formatDate(listing.updatedAt)}
            />
            {listing.publishedAt && (
              <MetaItem
                icon={Calendar}
                label="Published"
                value={formatDate(listing.publishedAt)}
              />
            )}
            {listing.expiresAt && (
              <MetaItem
                icon={Calendar}
                label="Expires"
                value={formatDate(listing.expiresAt)}
              />
            )}
            <MetaItem
              icon={Tag}
              label="Listing ID"
              value={listing.id}
            />
            {showVendor && listing.vendor && (
              <MetaItem
                icon={Home}
                label="Vendor"
                value={listing.vendor.name}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listed By */}
      {showVendor &&
        (listing.vendor ||
          (listing.agentListings && listing.agentListings.length > 0)) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Listed By</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {listing.vendor && (
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {getInitials(listing.vendor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Vendor</p>
                    {getEntityHref("vendors", listing.vendor.id) ? (
                      <Link
                        href={getEntityHref("vendors", listing.vendor.id)!}
                        className="truncate font-medium text-primary hover:underline"
                      >
                        {listing.vendor.name}
                      </Link>
                    ) : (
                      <p className="truncate font-medium">{listing.vendor.name}</p>
                    )}
                  </div>
                  <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </div>
            )}
            {listing.agentListings && listing.agentListings.length > 0 && (
              <>
                {listing.agentListings.map((al) => (
                  <div key={al.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {getInitials(al.agent.user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Agent</p>
                        {getEntityHref("agents", al.agent.id) ? (
                          <Link
                            href={getEntityHref("agents", al.agent.id)!}
                            className="truncate font-medium text-primary hover:underline"
                          >
                            {al.agent.user.fullName}
                          </Link>
                        ) : (
                          <p className="truncate font-medium">{al.agent.user.fullName}</p>
                        )}
                      </div>
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    {al.agent.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">Company:</span>
                        {getEntityHref("companies", al.agent.company.id) ? (
                          <Link
                            href={getEntityHref("companies", al.agent.company.id)!}
                            className="truncate font-medium text-primary hover:underline"
                          >
                            {al.agent.company.name}
                          </Link>
                        ) : (
                          <span className="truncate font-medium">{al.agent.company.name}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ListingInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="mt-1 h-4 w-48" />
        <Skeleton className="mt-3 h-9 w-40" />
      </div>
      <Separator />
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
