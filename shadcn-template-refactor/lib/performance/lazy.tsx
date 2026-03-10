/**
 * Lazy Component Factory
 *
 * Type-safe code-splitting factory using React.lazy + dynamic import.
 * Creates a lazily-loaded component with automatic Suspense boundary.
 *
 * Features:
 * - Named export support via `resolveComponent`
 * - Configurable fallback (skeleton, spinner, or custom ReactNode)
 * - Preload helper for prefetch-on-hover patterns
 * - SSR-safe: wraps React.lazy (renders on client only)
 *
 * @example
 * ```tsx
 * // Default export
 * const LazyChart = lazyComponent(
 *   () => import('@/modules/analytics/components/chart'),
 *   { fallback: <Skeleton className="h-64" /> }
 * );
 *
 * // Named export
 * const LazyDataTable = lazyComponent(
 *   () => import('@/modules/listings/components/data-table'),
 *   { resolveComponent: (mod) => mod.DataTable }
 * );
 *
 * // Preload on hover
 * <button onMouseEnter={LazyChart.preload}>Show Chart</button>
 * ```
 *
 * @see docs/ai-prompt/part-17.md §17.8 — Code-Splitting
 */
'use client';

import React, { Suspense, type ComponentType, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LazyComponentOptions<
  TModule extends Record<string, unknown>,
  TProps extends Record<string, unknown>,
> {
  /**
   * Resolve a named export from the module.
   * If omitted, defaults to `mod.default`.
   */
  resolveComponent?: (mod: TModule) => ComponentType<TProps>;
  /** Fallback shown while the component loads. */
  fallback?: ReactNode;
}

export interface LazyComponentReturn<TProps extends Record<string, unknown>> {
  /** The lazy-loaded component wrapped in Suspense. */
  Component: ComponentType<TProps>;
  /** Trigger a preload (warm the cache) without rendering. */
  preload: () => void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a lazily-loaded component with built-in Suspense and preload.
 *
 * @param factory  Dynamic import function — `() => import('./MyComponent')`
 * @param options  Optional: resolveComponent, fallback
 */
export function lazyComponent<
  TModule extends Record<string, unknown>,
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(
  factory: () => Promise<TModule>,
  options: LazyComponentOptions<TModule, TProps> = {}
): LazyComponentReturn<TProps> {
  const { resolveComponent, fallback = null } = options;

  // Cache the import promise so repeated preload calls don't re-fetch
  let importPromise: Promise<TModule> | null = null;

  const ensureImported = () => {
    if (!importPromise) {
      importPromise = factory();
    }
    return importPromise;
  };

  // React.lazy expects { default: ComponentType }
  const LazyInner = React.lazy(async () => {
    const mod = await ensureImported();
    const Comp = resolveComponent
      ? resolveComponent(mod)
      : (mod as unknown as { default: ComponentType<TProps> }).default;

    return { default: Comp };
  });

  // Wrapper that provides the Suspense boundary
  function WrappedComponent(props: TProps) {
    return (
      <Suspense fallback={fallback}>
        <LazyInner {...props} />
      </Suspense>
    );
  }

  WrappedComponent.displayName = 'LazyComponent';

  return {
    Component: WrappedComponent,
    preload: () => {
      ensureImported();
    },
  };
}
