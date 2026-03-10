/**
 * SkipLink Component
 *
 * Provides a "Skip to main content" link that is visually hidden
 * until focused via keyboard. First element in the tab order.
 *
 * @example
 * ```tsx
 * // In root layout.tsx
 * <body>
 *   <SkipLink />
 *   <header>...</header>
 *   <main id="main-content">...</main>
 * </body>
 * ```
 *
 * @see WCAG 2.4.1 — Bypass Blocks
 */

import React from 'react';

export interface SkipLinkProps {
  /** Target element ID to skip to (default: "main-content") */
  targetId?: string;
  /** Label text (default: "Skip to main content") */
  label?: string;
}

export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:shadow-lg focus:border focus:border-ring focus:ring-2 focus:ring-ring/50 focus:outline-none focus:text-sm focus:font-medium"
    >
      {label}
    </a>
  );
}
