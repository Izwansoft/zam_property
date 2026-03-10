/**
 * LiveRegion Component
 *
 * ARIA live region for dynamic content announcements.
 * Screen readers will announce changes to the region's content.
 *
 * @example
 * ```tsx
 * // Polite status updates (default)
 * <LiveRegion>{searchResults.length} results found</LiveRegion>
 *
 * // Assertive error alerts
 * <LiveRegion priority="assertive" role="alert">
 *   {errorMessage}
 * </LiveRegion>
 *
 * // Hidden live region (screen reader only)
 * <LiveRegion visuallyHidden>{statusMessage}</LiveRegion>
 * ```
 *
 * @see WCAG 4.1.3 — Status Messages
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface LiveRegionProps {
  children: React.ReactNode;
  /** Announcement priority. 'polite' waits for idle; 'assertive' interrupts. */
  priority?: 'polite' | 'assertive';
  /** ARIA role: 'status' (polite) or 'alert' (assertive/errors) */
  role?: 'status' | 'alert' | 'log' | 'timer';
  /** When true, the entire region is re-announced on any change */
  atomic?: boolean;
  /** When true, the region is visually hidden (screen reader only) */
  visuallyHidden?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function LiveRegion({
  children,
  priority = 'polite',
  role = priority === 'assertive' ? 'alert' : 'status',
  atomic = true,
  visuallyHidden = false,
  className,
}: LiveRegionProps) {
  return (
    <div
      role={role}
      aria-live={priority}
      aria-atomic={atomic}
      className={cn(
        visuallyHidden && 'sr-only',
        className,
      )}
    >
      {children}
    </div>
  );
}
