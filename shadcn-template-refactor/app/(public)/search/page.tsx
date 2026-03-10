/**
 * Search Page — Server Component Wrapper
 *
 * Public search/browse page powered by OpenSearch via the backend.
 * Renders the client SearchContent component within a Suspense boundary
 * so that useSearchParams() works without breaking SSR.
 *
 * @see docs/ai-prompt/part-25.md - Global Search & Discovery
 * @see docs/ai-prompt/part-16.md - Search UI Deep Dive
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import SearchContent from "./content";

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: "Search Listings | Zam Property",
  description:
    "Search properties, vehicles, and more across Malaysia. Filter by location, price, and attributes.",
};

// =============================================================================
// LOADING FALLBACK
// =============================================================================

function SearchFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading search...</p>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function SearchPage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================ */}
      {/* Compact Dark Hero Header */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden bg-slate-950 py-12 md:py-16">
        <div className="absolute inset-0">
          <div className="absolute left-[10%] top-[10%] h-64 w-64 rounded-full bg-blue-600/15 blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] h-56 w-56 rounded-full bg-cyan-600/10 blur-[80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 text-center md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <Badge
              variant="secondary"
              className="mb-4 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white backdrop-blur-sm"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Discover
            </Badge>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Find your{" "}
              <span className="bg-linear-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                perfect match
              </span>
            </h1>
            <p className="text-sm text-white/50 md:text-base">
              Search across thousands of listings. Filter by location, price,
              category, and more.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Search Content */}
      {/* ================================================================ */}
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
    </div>
  );
}

