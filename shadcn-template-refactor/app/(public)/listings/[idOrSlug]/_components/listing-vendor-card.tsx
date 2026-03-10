/**
 * Listing Vendor Card Component
 *
 * Displays seller/vendor info with inline contact options
 * (phone, WhatsApp, email) and link to public vendor profile.
 * Modern rounded card with gradient accents.
 */

import Link from "next/link";
import Image from "next/image";
import { Star, Shield, ExternalLink, Phone, Mail, MessageCircle } from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ListingVendorCardProps {
  listing: PublicListingDetail;
}

export function ListingVendorCard({ listing }: ListingVendorCardProps) {
  const vendor = listing.vendor;
  if (!vendor) return null;

  const phoneClean = vendor.phone?.replace(/[^+\d]/g, "") ?? "";

  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Gradient accent strip */}
      <div className="h-1.5 bg-linear-to-r from-blue-500 via-cyan-500 to-emerald-500" />
      <div className="p-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Listed by
        </p>

        {/* Vendor Info */}
        <div className="flex items-center gap-3">
          {vendor.logo ? (
            <Image
              src={vendor.logo}
              alt={vendor.name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-600">
              <span className="text-lg font-semibold text-white">
                {vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{vendor.name}</p>
            {vendor.type && (
              <Badge variant="outline" className="mt-0.5 rounded-full text-xs">
                <Shield className="mr-1 h-3 w-3" />
                {vendor.type.charAt(0) + vendor.type.slice(1).toLowerCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Rating */}
        {vendor.rating !== undefined && vendor.rating > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-medium">{vendor.rating.toFixed(1)}</span>
            </div>
            {vendor.reviewCount !== undefined && vendor.reviewCount > 0 && (
              <span className="text-muted-foreground">
                ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Contact */}
      <div className="space-y-2 p-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Contact Agent
        </p>

        {vendor.phone && (
          <Button variant="outline" className="w-full justify-start rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md" size="sm" asChild>
            <a href={`tel:${phoneClean}`}>
              <Phone className="mr-2 h-4 w-4" />
              {vendor.phone}
            </a>
          </Button>
        )}

        {vendor.phone && (
          <Button variant="outline" className="w-full justify-start rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md" size="sm" asChild>
            <a
              href={`https://wa.me/${phoneClean.replace("+", "")}?text=${encodeURIComponent(`Hi, I'm interested in: ${listing.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        )}

        {vendor.email && (
          <Button variant="outline" className="w-full justify-start rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md" size="sm" asChild>
            <a
              href={`mailto:${vendor.email}?subject=${encodeURIComponent(`Inquiry: ${listing.title}`)}`}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Agent
            </a>
          </Button>
        )}

        {/* View Profile */}
        <Button variant="default" className="mt-2 w-full rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl" asChild>
          <Link href={`/vendors/${vendor.slug || vendor.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Vendor Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}
