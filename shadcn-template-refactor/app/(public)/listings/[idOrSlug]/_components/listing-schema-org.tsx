/**
 * Listing Schema.org Structured Data Component
 *
 * Outputs JSON-LD structured data for SEO (Product/RealEstateListing).
 * Injected as a <script type="application/ld+json"> tag.
 *
 * @see https://schema.org/Product
 * @see https://schema.org/RealEstateListing
 */

import type { PublicListingDetail } from "@/lib/api/public-api";

interface ListingSchemaOrgProps {
  listing: PublicListingDetail;
}

export function ListingSchemaOrg({ listing }: ListingSchemaOrgProps) {
  const isRealEstate = listing.verticalType === "REAL_ESTATE";

  const structuredData = isRealEstate
    ? buildRealEstateSchema(listing)
    : buildProductSchema(listing);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// =============================================================================
// SCHEMA BUILDERS
// =============================================================================

function buildRealEstateSchema(listing: PublicListingDetail) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description || listing.title,
    url: `${getBaseUrl()}/listings/${listing.slug || listing.id}`,
    datePosted: listing.publishedAt || listing.createdAt,
  };

  // Price
  if (listing.priceType !== "UPON_REQUEST") {
    schema.offers = {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency || "MYR",
      availability: "https://schema.org/InStock",
    };
  }

  // Images
  const images = getImageUrls(listing);
  if (images.length > 0) {
    schema.image = images;
  }

  // Location
  if (listing.location) {
    const contentLocation: Record<string, unknown> = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: listing.location.address,
        addressLocality: listing.location.city,
        addressRegion: listing.location.state,
        addressCountry: listing.location.country || "MY",
        postalCode: listing.location.postalCode,
      },
    };

    if (listing.location.latitude && listing.location.longitude) {
      contentLocation.geo = {
        "@type": "GeoCoordinates",
        latitude: listing.location.latitude,
        longitude: listing.location.longitude,
      };
    }

    schema.contentLocation = contentLocation;
  }

  // Property attributes
  if (listing.attributes) {
    const attrs = listing.attributes;
    if (attrs.bedrooms) schema.numberOfBedrooms = attrs.bedrooms;
    if (attrs.bathrooms) schema.numberOfBathroomsTotal = attrs.bathrooms;
    if (attrs.builtUpArea) {
      schema.floorSize = {
        "@type": "QuantitativeValue",
        value: attrs.builtUpArea,
        unitText: "SQFT",
      };
    }
  }

  // Seller / Vendor
  if (listing.vendor) {
    schema.seller = {
      "@type": "Organization",
      name: listing.vendor.name,
      url: `${getBaseUrl()}/vendors/${listing.vendor.slug || listing.vendor.id}`,
    };
  }

  return schema;
}

function buildProductSchema(listing: PublicListingDetail) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description || listing.title,
    url: `${getBaseUrl()}/listings/${listing.slug || listing.id}`,
    category: listing.verticalType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  };

  // Price
  if (listing.priceType !== "UPON_REQUEST") {
    schema.offers = {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency || "MYR",
      availability: "https://schema.org/InStock",
    };
  }

  // Images
  const images = getImageUrls(listing);
  if (images.length > 0) {
    schema.image = images;
  }

  // Vendor / Brand
  if (listing.vendor) {
    schema.brand = {
      "@type": "Organization",
      name: listing.vendor.name,
    };
  }

  return schema;
}

// =============================================================================
// HELPERS
// =============================================================================

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://zamproperty.com";
}

function getImageUrls(listing: PublicListingDetail): string[] {
  const urls: string[] = [];

  if (listing.media) {
    for (const m of listing.media) {
      if (m.mediaType === "IMAGE") {
        urls.push(m.url);
      }
    }
  } else if (listing.primaryImage) {
    urls.push(listing.primaryImage);
  }

  return urls;
}
