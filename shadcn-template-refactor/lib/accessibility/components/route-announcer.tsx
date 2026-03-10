/**
 * RouteAnnouncer Component
 *
 * Announces page navigation changes to screen readers.
 * Uses the document title or pathname to announce route changes.
 *
 * Should be rendered once in the root Providers component.
 *
 * @see WCAG 4.1.3 — Status Messages
 * @see WCAG 2.4.2 — Page Titled
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Announces page navigation to screen readers by rendering an
 * aria-live region that updates on pathname change.
 */
export function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't announce on initial page load — screen readers already handle it
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Small delay to allow the page title to update
    const timeout = setTimeout(() => {
      const pageTitle = document.title;
      if (pageTitle) {
        setAnnouncement(`Navigated to ${pageTitle}`);
      } else {
        // Fallback to pathname-based announcement
        const pageName = pathname
          .split('/')
          .filter(Boolean)
          .pop()
          ?.replace(/[-_]/g, ' ')
          ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'page';
        setAnnouncement(`Navigated to ${pageName}`);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
