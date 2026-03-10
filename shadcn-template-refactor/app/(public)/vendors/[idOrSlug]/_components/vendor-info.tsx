/**
 * Vendor Info Component
 *
 * Displays vendor description, contact details, and address.
 */

import { Mail, Phone, MapPin, Globe } from "lucide-react";

import type { PublicVendorProfile } from "@/lib/api/public-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface VendorInfoProps {
  vendor: PublicVendorProfile;
}

export function VendorInfo({ vendor }: VendorInfoProps) {
  const address = vendor.address;
  const addressParts = address
    ? [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(
        Boolean,
      )
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {vendor.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {vendor.description}
          </p>
        )}

        {!vendor.description && (
          <p className="text-sm text-muted-foreground italic">
            No description available.
          </p>
        )}

        <Separator />

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Contact</h4>

          {vendor.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <a
                href={`mailto:${vendor.email}`}
                className="truncate hover:text-foreground transition-colors"
              >
                {vendor.email}
              </a>
            </div>
          )}

          {vendor.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <a
                href={`tel:${vendor.phone}`}
                className="hover:text-foreground transition-colors"
              >
                {vendor.phone}
              </a>
            </div>
          )}

          {addressParts.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{addressParts.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <Separator />
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold text-primary">
              {vendor.activeListingCount}
            </p>
            <p className="text-xs text-muted-foreground">Active Listings</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-2xl font-bold text-primary">
              {vendor.listingCount}
            </p>
            <p className="text-xs text-muted-foreground">Total Listings</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
