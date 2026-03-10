/**
 * Listing Book Button Component
 *
 * "Book This Property" button that opens the TenancyBookingWizard.
 * Shows for rental listings based on priceType.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, LogIn } from "lucide-react";

import type { PublicListingDetail } from "@/lib/api/public-api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/modules/auth";
import {
  TenancyBookingWizard,
  type BookingPropertyInfo,
} from "@/modules/tenancy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingBookButtonProps {
  listing: PublicListingDetail;
}

// ---------------------------------------------------------------------------
// Helper to check if listing is for rent
// ---------------------------------------------------------------------------

function isRentalListing(listing: PublicListingDetail): boolean {
  // Check listing type attribute (common in Malaysian property listings)
  const listingType = listing.attributes?.listingType as string | undefined;
  if (listingType === "RENT" || listingType === "FOR_RENT") {
    return true;
  }

  // Check price per period indicators
  const priceType = listing.priceType?.toLowerCase();
  if (priceType?.includes("month") || priceType?.includes("rent")) {
    return true;
  }

  // Default: check if title contains "rent" related keywords
  const title = listing.title.toLowerCase();
  if (
    title.includes("for rent") ||
    title.includes("to let") ||
    title.includes("rental")
  ) {
    return true;
  }

  // Check for property type indicators
  const propertyType = listing.attributes?.propertyType as string | undefined;
  if (propertyType?.toLowerCase().includes("room")) {
    return true; // Rooms are typically for rent
  }

  // Allow booking for all listings by default for better UX
  return true;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingBookButton({ listing }: ListingBookButtonProps) {
  const { isAuthenticated } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);

  // Only show for rental-type listings
  if (!isRentalListing(listing)) {
    return null;
  }

  const loginRedirect = `/login?redirect=${encodeURIComponent(`/listings/${listing.slug || listing.id}`)}`;

  // Prepare property info for the wizard
  const propertyInfo: BookingPropertyInfo = {
    id: listing.id,
    title: listing.title,
    propertyId: listing.id, // In many cases listing ID = property ID
    vendorId: listing.vendorId,
    price: listing.price,
    currency: listing.currency,
    primaryImage: listing.primaryImage,
    location: listing.location,
    attributes: listing.attributes,
  };

  // Guest view - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <h3 className="mb-3 text-base font-semibold">Ready to Move In?</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Sign in to book this property and submit your tenancy application.
        </p>
        <Button className="w-full rounded-xl" asChild>
          <Link href={loginRedirect}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In to Book
          </Link>
        </Button>
      </div>
    );
  }

  // Authenticated view - show book button
  return (
    <>
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <h3 className="mb-3 text-base font-semibold">Ready to Move In?</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Submit your tenancy application and secure this property.
        </p>
        <Button className="w-full rounded-xl" onClick={() => setWizardOpen(true)}>
          <Home className="mr-2 h-4 w-4" />
          Book This Property
        </Button>
      </div>

      <TenancyBookingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        property={propertyInfo}
      />
    </>
  );
}
