/**
 * Public Vendor Profile Page
 *
 * Server Component with generateMetadata for SEO.
 * Displays vendor info, rating, active listings grid.
 * Fetches from public API (no auth required).
 *
 * @see docs/ai-prompt/part-26.md §26.6 - Public Vendor Profile
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  fetchPublicVendor,
  fetchVendorListings,
  RateLimitError,
} from "@/lib/api/public-api";
import type { PublicVendorProfile } from "@/lib/api/public-api";

import { VendorHeader } from "./_components/vendor-header";
import { VendorInfo } from "./_components/vendor-info";
import { VendorListingsGrid } from "./_components/vendor-listings-grid";
import { VendorBreadcrumbs } from "./_components/vendor-breadcrumbs";
import { VendorSchemaOrg } from "./_components/vendor-schema-org";
import { RateLimitFallback } from "@/components/common/rate-limit-fallback";

// =============================================================================
// TYPES
// =============================================================================

interface VendorPageProps {
  params: Promise<{ idOrSlug: string }>;
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({
  params,
}: VendorPageProps): Promise<Metadata> {
  const { idOrSlug } = await params;

  try {
    const vendor = await fetchPublicVendor(idOrSlug);

    if (!vendor) {
      return {
        title: "Vendor Not Found | Zam Property",
        description: "The vendor profile you are looking for could not be found.",
      };
    }

    const title = `${vendor.name} | Zam Property`;
    const description =
      vendor.description?.slice(0, 160) ||
      `${vendor.name} — ${vendor.activeListingCount} active listings on Zam Property`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        images: vendor.logo
          ? [{ url: vendor.logo, width: 400, height: 400, alt: vendor.name }]
          : undefined,
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: vendor.logo ? [vendor.logo] : undefined,
      },
    };
  } catch {
    return {
      title: "Vendor | Zam Property",
      description: "View vendor profile on Zam Property.",
    };
  }
}

// =============================================================================
// PAGE
// =============================================================================

export default async function PublicVendorPage({ params }: VendorPageProps) {
  const { idOrSlug } = await params;

  let vendor: PublicVendorProfile | null;

  try {
    vendor = await fetchPublicVendor(idOrSlug);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return <RateLimitFallback retryAfter={error.retryAfter} />;
    }
    throw error;
  }

  if (!vendor) {
    notFound();
  }

  return (
    <>
      {/* Schema.org Structured Data */}
      <VendorSchemaOrg vendor={vendor} />

      <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <VendorBreadcrumbs vendor={vendor} />

        {/* Vendor Header */}
        <VendorHeader vendor={vendor} />

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Vendor Details */}
          <div className="lg:col-span-1">
            <VendorInfo vendor={vendor} />
          </div>

          {/* Right Column - Active Listings */}
          <div className="lg:col-span-2">
            <Suspense fallback={<VendorListingsGridSkeleton />}>
              <VendorListingsSection vendor={vendor} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// VENDOR LISTINGS SECTION (async)
// =============================================================================

async function VendorListingsSection({
  vendor,
}: {
  vendor: PublicVendorProfile;
}) {
  try {
    const response = await fetchVendorListings(vendor.id);
    return (
      <VendorListingsGrid
        listings={response.data}
        totalCount={response.meta.pagination.totalItems}
        vendorSlug={vendor.slug || vendor.id}
      />
    );
  } catch {
    return (
      <VendorListingsGrid
        listings={[]}
        totalCount={0}
        vendorSlug={vendor.slug || vendor.id}
      />
    );
  }
}

// =============================================================================
// SKELETON
// =============================================================================

function VendorListingsGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <div className="aspect-4/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
