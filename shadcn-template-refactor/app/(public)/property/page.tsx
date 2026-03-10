/**
 * Property Landing Page
 *
 * Dedicated real estate search landing page with property-specific
 * filters, featured listings, and quick-search cards.
 * Users land here when clicking "Real Estate" category.
 *
 * @see docs/ai-prompt/part-16.md - Search UI
 * @see docs/ai-prompt/part-25.md - Global Search & Discovery
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import PropertyContent from "./content";

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: "Property Search | Zam Property",
  description:
    "Find your dream property in Malaysia. Search condos, houses, apartments and more with advanced filters for bedrooms, price, location and property type.",
};

// =============================================================================
// LOADING FALLBACK
// =============================================================================

function PropertyFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Loading property search...
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function PropertyPage() {
  return (
    <Suspense fallback={<PropertyFallback />}>
      <PropertyContent />
    </Suspense>
  );
}
