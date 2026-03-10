/**
 * PrefetchLink Component
 *
 * Enhanced Next.js Link with intelligent prefetching strategies:
 * - **hover**: Prefetch on mouse hover (desktop) — ~200ms delay
 * - **visible**: Prefetch when link enters viewport (IntersectionObserver)
 * - **none**: No prefetching (manual control)
 * - **eager**: Prefetch immediately on mount (Next.js default)
 *
 * @example
 * ```tsx
 * // Prefetch when user hovers (good for nav items)
 * <PrefetchLink href="/dashboard/vendor/listings" strategy="hover">
 *   Listings
 * </PrefetchLink>
 *
 * // Prefetch when visible (good for content links)
 * <PrefetchLink href="/listings/123" strategy="visible">
 *   View Listing
 * </PrefetchLink>
 * ```
 *
 * @see docs/ai-prompt/part-17.md §17.8 — Code-Splitting
 */
'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { useIntersectionObserver } from '../hooks/use-intersection-observer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrefetchStrategy = 'hover' | 'visible' | 'none' | 'eager';

export interface PrefetchLinkProps
  extends Omit<LinkProps, 'prefetch'>,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  /** Prefetch strategy. Default: 'hover' */
  strategy?: PrefetchStrategy;
  /** Delay before prefetching on hover (ms). Default: 200 */
  hoverDelay?: number;
  /** Children */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrefetchLink({
  href,
  strategy = 'hover',
  hoverDelay = 200,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter();
  const [hasPrefetched, setHasPrefetched] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visible strategy — prefetch when link scrolls into view
  const { ref: visibleRef, isIntersecting } = useIntersectionObserver<HTMLAnchorElement>({
    triggerOnce: true,
    rootMargin: '200px', // Start prefetching 200px before visible
    disabled: strategy !== 'visible',
  });

  // Trigger prefetch when visible
  if (strategy === 'visible' && isIntersecting && !hasPrefetched) {
    const hrefString = typeof href === 'string' ? href : href.pathname ?? '';
    router.prefetch(hrefString);
    setHasPrefetched(true);
  }

  // Hover strategy handlers
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (strategy === 'hover' && !hasPrefetched) {
        hoverTimerRef.current = setTimeout(() => {
          const hrefString = typeof href === 'string' ? href : href.pathname ?? '';
          router.prefetch(hrefString);
          setHasPrefetched(true);
        }, hoverDelay);
      }
      onMouseEnter?.(e);
    },
    [strategy, hasPrefetched, href, hoverDelay, router, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      onMouseLeave?.(e);
    },
    [onMouseLeave]
  );

  // Determine Next.js prefetch prop
  const nextPrefetch = strategy === 'eager' ? true : false;

  return (
    <Link
      ref={strategy === 'visible' ? visibleRef : undefined}
      href={href}
      prefetch={nextPrefetch}
      onMouseEnter={strategy === 'hover' ? handleMouseEnter : onMouseEnter}
      onMouseLeave={strategy === 'hover' ? handleMouseLeave : onMouseLeave}
      {...props}
    >
      {children}
    </Link>
  );
}
