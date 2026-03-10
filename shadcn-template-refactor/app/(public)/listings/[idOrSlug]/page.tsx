/**
 * Public Listing Detail Page
 *
 * Server Component with generateMetadata for SEO.
 * Fetches listing data from public API (no auth required).
 * Includes image gallery, details, vendor card, Schema.org, and related listings.
 *
 * @see docs/ai-prompt/part-26.md §26.6 - Public Listing Detail
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  fetchPublicListing,
  fetchRelatedListings,
  RateLimitError,
} from "@/lib/api/public-api";
import type { PublicListingDetail } from "@/lib/api/public-api";

import { ListingGallery } from "./_components/listing-gallery";
import { ListingInfo } from "./_components/listing-info";
import { ListingAttributes } from "./_components/listing-attributes";
import { ListingVendorCard } from "./_components/listing-vendor-card";
import { ListingInquiryCta } from "./_components/listing-inquiry-cta";
import { ListingBookButton } from "./_components/listing-book-button";
import { MortgageCalculator } from "./_components/mortgage-calculator";
import { ListingBreadcrumbs } from "./_components/listing-breadcrumbs";
import { ListingActionBar } from "./_components/listing-action-bar";
import { ListingLocationMap } from "./_components/listing-location-map";
import { ListingVideoPlayer } from "./_components/listing-video-player";
import { ListingFloorPlans } from "./_components/listing-floor-plans";
import { ListingChatButton } from "./_components/listing-chat-button";
import { ListingViewingScheduler } from "./_components/listing-viewing-scheduler";
import { ListingSchemaOrg } from "./_components/listing-schema-org";
import { RelatedListings } from "./_components/related-listings";
import { ListingMaintenanceCheck } from "./_components/listing-maintenance-check";
import { RateLimitFallback } from "@/components/common/rate-limit-fallback";

// =============================================================================
// TYPES
// =============================================================================

interface ListingPageProps {
  params: Promise<{ idOrSlug: string }>;
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { idOrSlug } = await params;

  try {
    const listing = await fetchPublicListing(idOrSlug);

    if (!listing) {
      return {
        title: "Listing Not Found | Zam Property",
        description: "The listing you are looking for could not be found.",
      };
    }

    const title = `${listing.title} | Zam Property`;
    const description =
      listing.description?.slice(0, 160) ||
      `${listing.title} - ${formatPrice(listing.price, listing.currency)} in ${listing.location?.city || "Malaysia"}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: listing.primaryImage
          ? [{ url: listing.primaryImage, width: 1200, height: 630, alt: listing.title }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: listing.primaryImage ? [listing.primaryImage] : undefined,
      },
    };
  } catch {
    return {
      title: "Listing | Zam Property",
      description: "View listing details on Zam Property.",
    };
  }
}

// =============================================================================
// PAGE
// =============================================================================

export default async function PublicListingPage({ params }: ListingPageProps) {
  const { idOrSlug } = await params;

  let listing: PublicListingDetail | null;

  try {
    listing = await fetchPublicListing(idOrSlug);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return <RateLimitFallback retryAfter={error.retryAfter} />;
    }
    throw error;
  }

  if (!listing) {
    notFound();
  }

  return (
    <ListingMaintenanceCheck verticalType={listing.verticalType}>
      {/* Schema.org Structured Data */}
      <ListingSchemaOrg listing={listing} />

      {/* Immersive Gallery Header */}
      <section className="relative bg-slate-950">
        <div className="absolute inset-0">
          <div className="absolute left-[10%] top-[20%] h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-cyan-600/10 blur-[100px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-6 md:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="mb-4 [&_nav]:text-white/60 [&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white">
            <ListingBreadcrumbs listing={listing} />
          </div>

          {/* Action Bar */}
          <div className="mb-5 flex items-center justify-end print:hidden">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-transparent px-4 py-2 [&_button]:bg-transparent [&_button]:text-white/80 [&_button]:border-white/20 [&_button:hover]:text-white [&_button:hover]:bg-white/10">
              <ListingActionBar
                listingTitle={listing.title}
                comparisonItem={{
                  id: listing.id,
                  title: listing.title,
                  slug: listing.slug,
                  price: listing.price,
                  currency: listing.currency,
                  primaryImageUrl: listing.primaryImage ?? undefined,
                  verticalType: listing.verticalType,
                  location: {
                    city: listing.location?.city,
                    state: listing.location?.state,
                  },
                  attributes: listing.attributes,
                  vendor: listing.vendor
                    ? { name: listing.vendor.name }
                    : undefined,
                }}
              />
            </div>
          </div>

          {/* Gallery */}
          <ListingGallery listing={listing} />
        </div>
      </section>

      <div className="bg-[#F5F5F7] dark:bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="space-y-8 lg:col-span-2">
            <ListingInfo listing={listing} />
            <ListingAttributes listing={listing} />
            <ListingVideoPlayer listing={listing} />
            <ListingFloorPlans listing={listing} />
            <ListingLocationMap listing={listing} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <ListingVendorCard listing={listing} />
            <ListingChatButton listing={listing} />
            <ListingInquiryCta listing={listing} />
            <ListingBookButton listing={listing} />
            {listing.price > 0 &&
              listing.priceType !== "UPON_REQUEST" &&
              listing.attributes?.listingType !== "rent" && (
              <MortgageCalculator
                price={listing.price}
                currency={listing.currency}
              />
            )}
            <ListingViewingScheduler listing={listing} />
          </div>
        </div>

        {/* Related Listings */}
        <Suspense fallback={null}>
          <RelatedListingsSection listing={listing} />
        </Suspense>
      </div>
      </div>
    </ListingMaintenanceCheck>
  );
}

// =============================================================================
// RELATED LISTINGS SECTION (async server component)
// =============================================================================

async function RelatedListingsSection({
  listing,
}: {
  listing: PublicListingDetail;
}) {
  const related = await fetchRelatedListings(listing, 4);

  if (related.length === 0) return null;

  return (
    <div className="mt-12">
      <RelatedListings listings={related} />
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currency || "MYR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
