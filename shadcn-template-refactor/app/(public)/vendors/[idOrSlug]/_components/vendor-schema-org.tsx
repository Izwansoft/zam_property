/**
 * Vendor Schema.org Structured Data
 *
 * Outputs JSON-LD for Organization schema.
 */

import type { PublicVendorProfile } from "@/lib/api/public-api";

interface VendorSchemaOrgProps {
  vendor: PublicVendorProfile;
}

export function VendorSchemaOrg({ vendor }: VendorSchemaOrgProps) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://zamproperty.com";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: vendor.name,
    url: `${baseUrl}/vendors/${vendor.slug || vendor.id}`,
    description: vendor.description || `${vendor.name} on Zam Property`,
  };

  // Logo
  if (vendor.logo) {
    schema.logo = vendor.logo;
    schema.image = vendor.logo;
  }

  // Address
  if (vendor.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: [vendor.address.line1, vendor.address.line2]
        .filter(Boolean)
        .join(", "),
      addressLocality: vendor.address.city,
      addressRegion: vendor.address.state,
      postalCode: vendor.address.postalCode,
      addressCountry: vendor.address.country || "MY",
    };
  }

  // Contact
  if (vendor.email) {
    schema.email = vendor.email;
  }
  if (vendor.phone) {
    schema.telephone = vendor.phone;
  }

  // Rating
  if (vendor.rating > 0 && vendor.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: vendor.rating,
      reviewCount: vendor.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
