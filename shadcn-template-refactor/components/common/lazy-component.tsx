"use client";

// =============================================================================
// Lazy Component Factory — Code-splitting with Suspense fallbacks
// =============================================================================
// Provides a convenient wrapper around React.lazy + SuspenseBoundary.
// Automatically wraps lazy-loaded components with appropriate loading states.
//
// Usage:
//   const LazyChart = createLazyComponent(
//     () => import("@/components/charts/revenue-chart"),
//     { variant: "skeleton-card", label: "Loading chart..." }
//   );
//
//   // Use in JSX:
//   <LazyChart data={data} />
// =============================================================================

import React, { lazy, Suspense } from "react";
import { SuspenseFallback, type SuspenseVariant } from "./suspense-boundary";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LazyComponentOptions {
  /** Fallback variant (default: "spinner") */
  variant?: SuspenseVariant;
  /** Custom fallback component — overrides variant */
  fallback?: React.ReactNode;
  /** Label for spinner/inline variants */
  label?: string;
}

// ---------------------------------------------------------------------------
// createLazyComponent — Factory for lazy-loaded components with Suspense
// ---------------------------------------------------------------------------

/**
 * Creates a lazy-loaded component wrapped in Suspense with a configurable
 * loading fallback. Uses React.lazy under the hood for code splitting.
 *
 * @param importFn - Dynamic import function returning the module
 * @param options  - Fallback configuration
 * @returns A component that renders the lazy-loaded component with Suspense
 *
 * @example
 * ```tsx
 * const LazyRevenueChart = createLazyComponent(
 *   () => import("@/modules/analytics/components/revenue-chart"),
 *   { variant: "skeleton-card" }
 * );
 * ```
 */
export function createLazyComponent<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends React.ComponentType<any>,
>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {},
): React.FC<React.ComponentProps<T>> {
  const LazyComp = lazy(importFn);
  const { variant = "spinner", fallback, label } = options;

  const WrappedComponent = (props: React.ComponentProps<T>) => {
    const loadingFallback = fallback ?? (
      <SuspenseFallback variant={variant} label={label} />
    );

    return (
      <Suspense fallback={loadingFallback}>
        <LazyComp {...props} />
      </Suspense>
    );
  };

  // Set display name for DevTools
  WrappedComponent.displayName = `Lazy(${
    (importFn as unknown as { name?: string }).name ?? "Component"
  })`;

  return WrappedComponent;
}

// ---------------------------------------------------------------------------
// Prebuilt lazy loaders for common heavy components
// ---------------------------------------------------------------------------

/**
 * Creates a lazy-loaded chart component with card skeleton fallback.
 */
export function createLazyChart<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends React.ComponentType<any>,
>(importFn: () => Promise<{ default: T }>) {
  return createLazyComponent(importFn, {
    variant: "skeleton-card",
    label: "Loading chart...",
  });
}

/**
 * Creates a lazy-loaded form component with form skeleton fallback.
 */
export function createLazyForm<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends React.ComponentType<any>,
>(importFn: () => Promise<{ default: T }>) {
  return createLazyComponent(importFn, {
    variant: "skeleton-form",
    label: "Loading form...",
  });
}

/**
 * Creates a lazy-loaded table/list component with table skeleton fallback.
 */
export function createLazyTable<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends React.ComponentType<any>,
>(importFn: () => Promise<{ default: T }>) {
  return createLazyComponent(importFn, {
    variant: "skeleton-table",
    label: "Loading data...",
  });
}
