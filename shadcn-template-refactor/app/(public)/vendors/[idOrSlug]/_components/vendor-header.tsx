/**
 * Vendor Header Component
 *
 * Displays vendor name, logo, type badge, and key stats.
 */

import Image from "next/image";
import { Star, ShieldCheck, Building2 } from "lucide-react";

import type { PublicVendorProfile } from "@/lib/api/public-api";
import { Badge } from "@/components/ui/badge";

interface VendorHeaderProps {
  vendor: PublicVendorProfile;
}

export function VendorHeader({ vendor }: VendorHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
      {/* Logo */}
      {vendor.logo ? (
        <Image
          src={vendor.logo}
          alt={vendor.name}
          width={96}
          height={96}
          className="h-24 w-24 rounded-xl border object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-primary/10">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
      )}

      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold md:text-3xl">{vendor.name}</h1>
          <Badge variant="outline" className="text-xs">
            <ShieldCheck className="mr-1 h-3 w-3" />
            {formatVendorType(vendor.type)}
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {/* Rating */}
          {vendor.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">
                {vendor.rating.toFixed(1)}
              </span>
              <span>
                ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Listing Count */}
          <span>
            {vendor.activeListingCount} active{" "}
            {vendor.activeListingCount === 1 ? "listing" : "listings"}
          </span>

          {/* Member Since */}
          <span>
            Member since{" "}
            {new Date(vendor.createdAt).toLocaleDateString("en-MY", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatVendorType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}
