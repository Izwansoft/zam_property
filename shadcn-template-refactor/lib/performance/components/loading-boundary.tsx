/**
 * LoadingBoundary Component
 *
 * Wraps React Suspense with variant-based fallback skeletons.
 * Use this as the go-to loading boundary throughout the application.
 *
 * Variants:
 * - **spinner**  — centered spinner icon
 * - **skeleton** — pulsing block placeholder
 * - **card**     — card-shaped skeleton grid (1–6 cards)
 * - **table**    — table row skeleton (header + rows)
 * - **list**     — stacked list-item skeletons
 * - **page**     — full page skeleton (sidebar + content area)
 * - **custom**   — pass your own fallback ReactNode
 *
 * @example
 * ```tsx
 * <LoadingBoundary variant="card" count={3}>
 *   <ListingsGrid />
 * </LoadingBoundary>
 *
 * <LoadingBoundary variant="table" count={5}>
 *   <InvoiceTable />
 * </LoadingBoundary>
 *
 * <LoadingBoundary variant="custom" fallback={<MyCustomSkeleton />}>
 *   <Dashboard />
 * </LoadingBoundary>
 * ```
 *
 * @see docs/ai-prompt/part-17.md §17.10 — Error Boundaries
 */
'use client';

import React, { Suspense, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoadingVariant =
  | 'spinner'
  | 'skeleton'
  | 'card'
  | 'table'
  | 'list'
  | 'page'
  | 'custom';

export interface LoadingBoundaryProps {
  /** Children to render once loaded. */
  children: ReactNode;
  /** Which fallback variant to show. Default: 'spinner'. */
  variant?: LoadingVariant;
  /** Number of skeleton items to render (for card, table, list). Default: 3. */
  count?: number;
  /** Custom fallback (only used when variant is 'custom'). */
  fallback?: ReactNode;
  /** Extra class name on the wrapper. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Skeleton Primitives
// ---------------------------------------------------------------------------

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Fallback Variants
// ---------------------------------------------------------------------------

function SpinnerFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center py-12', className)}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="h-8 w-8 animate-spin text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function SkeletonFallback({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-4', className)} role="status" aria-label="Loading">
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <SkeletonBlock className="h-4 w-2/3" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function CardFallback({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border bg-card p-4 space-y-3"
          aria-hidden="true"
        >
          <SkeletonBlock className="h-32 w-full rounded-md" />
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <SkeletonBlock className="h-8 w-20 rounded-md" />
            <SkeletonBlock className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function TableFallback({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-2 p-4', className)} role="status" aria-label="Loading">
      {/* Header row */}
      <div className="flex gap-4 border-b pb-2" aria-hidden="true">
        <SkeletonBlock className="h-4 w-1/6" />
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-4 w-1/6" />
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-4 w-1/6" />
      </div>
      {/* Data rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2" aria-hidden="true">
          <SkeletonBlock className="h-4 w-1/6" />
          <SkeletonBlock className="h-4 w-1/4" />
          <SkeletonBlock className="h-4 w-1/6" />
          <SkeletonBlock className="h-4 w-1/4" />
          <SkeletonBlock className="h-4 w-1/6" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function ListFallback({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3 p-4', className)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3" aria-hidden="true">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-3 w-3/4" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

function PageFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex h-full gap-6 p-6', className)}
      role="status"
      aria-label="Loading"
    >
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 space-y-4 md:block" aria-hidden="true">
        <SkeletonBlock className="h-8 w-full" />
        <SkeletonBlock className="h-6 w-3/4" />
        <SkeletonBlock className="h-6 w-5/6" />
        <SkeletonBlock className="h-6 w-2/3" />
        <SkeletonBlock className="h-6 w-3/4" />
        <SkeletonBlock className="h-6 w-1/2" />
      </div>
      {/* Content area skeleton */}
      <div className="flex-1 space-y-4" aria-hidden="true">
        <SkeletonBlock className="h-8 w-1/3" />
        <SkeletonBlock className="h-4 w-2/3" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <SkeletonBlock className="h-64 w-full rounded-lg" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function getFallback(
  variant: LoadingVariant,
  count: number,
  fallback: ReactNode | undefined,
  className: string | undefined
): ReactNode {
  switch (variant) {
    case 'spinner':
      return <SpinnerFallback className={className} />;
    case 'skeleton':
      return <SkeletonFallback className={className} />;
    case 'card':
      return <CardFallback count={count} className={className} />;
    case 'table':
      return <TableFallback count={count} className={className} />;
    case 'list':
      return <ListFallback count={count} className={className} />;
    case 'page':
      return <PageFallback className={className} />;
    case 'custom':
      return fallback ?? <SpinnerFallback className={className} />;
    default:
      return <SpinnerFallback className={className} />;
  }
}

export function LoadingBoundary({
  children,
  variant = 'spinner',
  count = 3,
  fallback,
  className,
}: LoadingBoundaryProps) {
  return (
    <Suspense fallback={getFallback(variant, count, fallback, className)}>
      {children}
    </Suspense>
  );
}
