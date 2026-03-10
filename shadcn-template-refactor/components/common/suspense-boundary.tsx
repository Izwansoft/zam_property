"use client";

// =============================================================================
// SuspenseBoundary â€” Wraps React.Suspense with consistent loading fallbacks
// =============================================================================
// Provides standardized loading states for lazy-loaded components and
// data-fetching boundaries. Supports multiple visual variants.
// =============================================================================

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SuspenseVariant =
  | "spinner"
  | "skeleton-card"
  | "skeleton-table"
  | "skeleton-page"
  | "skeleton-form"
  | "inline"
  | "minimal";

export interface SuspenseBoundaryProps {
  children: React.ReactNode;
  /** Visual variant for the loading fallback */
  variant?: SuspenseVariant;
  /** Custom fallback component â€” overrides variant */
  fallback?: React.ReactNode;
  /** Optional label to display below spinner */
  label?: string;
}

// ---------------------------------------------------------------------------
// SuspenseBoundary component
// ---------------------------------------------------------------------------

export function SuspenseBoundary({
  children,
  variant = "spinner",
  fallback,
  label,
}: SuspenseBoundaryProps) {
  const loadingFallback = fallback ?? (
    <SuspenseFallback variant={variant} label={label} />
  );

  return <Suspense fallback={loadingFallback}>{children}</Suspense>;
}

// ---------------------------------------------------------------------------
// SuspenseFallback â€” the loading UI component
// ---------------------------------------------------------------------------

export function SuspenseFallback({
  variant = "spinner",
  label,
}: {
  variant?: SuspenseVariant;
  label?: string;
}) {
  switch (variant) {
    case "spinner":
      return <SpinnerFallback label={label} />;
    case "skeleton-card":
      return <CardSkeletonFallback />;
    case "skeleton-table":
      return <TableSkeletonFallback />;
    case "skeleton-page":
      return <PageSkeletonFallback />;
    case "skeleton-form":
      return <FormSkeletonFallback />;
    case "inline":
      return <InlineFallback label={label} />;
    case "minimal":
      return <MinimalFallback />;
    default:
      return <SpinnerFallback label={label} />;
  }
}

// ---------------------------------------------------------------------------
// Spinner â€” centered spinner with optional label
// ---------------------------------------------------------------------------

function SpinnerFallback({ label }: { label?: string }) {
  return (
    <div className="flex min-h-50 flex-col items-center justify-center gap-3" role="status" aria-busy="true" aria-label={label || 'Loading'}>
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" aria-hidden="true" />
      {label ? (
        <p className="text-muted-foreground text-sm">{label}</p>
      ) : (
        <span className="sr-only">Loading, please wait.</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline â€” small inline spinner for sections/widgets
// ---------------------------------------------------------------------------

function InlineFallback({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-4" role="status" aria-busy="true">
      <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="text-muted-foreground text-sm">
        {label ?? "Loading..."}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal â€” tiny spinner, no text
// ---------------------------------------------------------------------------

function MinimalFallback() {
  return (
    <div className="flex items-center justify-center p-4" role="status" aria-busy="true">
      <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading.</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card Skeleton â€” grid of card placeholders
// ---------------------------------------------------------------------------

function CardSkeletonFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true" aria-label="Loading cards">
      <span className="sr-only">Loading content, please wait.</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table Skeleton â€” table with header and row placeholders
// ---------------------------------------------------------------------------

function TableSkeletonFallback() {
  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 border-b last:border-0">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Skeleton â€” full page shell placeholder
// ---------------------------------------------------------------------------

function PageSkeletonFallback() {
  return (
    <div className="space-y-6 p-1">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Content area */}
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form Skeleton â€” form field placeholders
// ---------------------------------------------------------------------------

function FormSkeletonFallback() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Form header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {/* Two columns */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export default SuspenseBoundary;

