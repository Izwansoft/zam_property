/**
 * Lazy Map Components
 *
 * Dynamic imports for Google Maps components to avoid SSR issues.
 * Google Maps API requires `window` — these wrappers use next/dynamic with ssr: false.
 */

"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Re-export types
export type { MapPin } from "./map-components";

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------

function MapSkeleton({ height = "300px" }: { height?: string }) {
  return (
    <Skeleton
      className="w-full rounded-lg"
      style={{ height }}
    />
  );
}

// ---------------------------------------------------------------------------
// Lazy ListingMap
// ---------------------------------------------------------------------------

export const LazyListingMap = dynamic(
  () => import("./map-components").then((mod) => mod.ListingMap),
  {
    ssr: false,
    loading: () => <MapSkeleton height="300px" />,
  }
);

// ---------------------------------------------------------------------------
// Lazy SearchMap
// ---------------------------------------------------------------------------

export const LazySearchMap = dynamic(
  () => import("./map-components").then((mod) => mod.SearchMap),
  {
    ssr: false,
    loading: () => <MapSkeleton height="500px" />,
  }
);
