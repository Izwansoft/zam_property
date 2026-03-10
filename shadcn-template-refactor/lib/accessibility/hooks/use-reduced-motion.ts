/**
 * useReducedMotion Hook
 *
 * Detects user's prefers-reduced-motion setting.
 * Use to disable animations/transitions for users who prefer reduced motion.
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * const transition = reducedMotion ? 'none' : 'transform 0.3s ease';
 * ```
 *
 * @see WCAG 2.3.3 — Animation from Interactions
 */
'use client';

import { useState, useEffect } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns true if the user has requested reduced motion in their OS settings.
 * Updates reactively when the preference changes.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    setReducedMotion(query.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
