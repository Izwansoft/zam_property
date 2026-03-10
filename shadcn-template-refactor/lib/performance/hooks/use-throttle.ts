/**
 * useThrottle Hook
 *
 * Throttles a callback function so it fires at most once per `interval` ms.
 * Uses leading-edge execution (fires immediately on first call).
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottle((e: Event) => {
 *   updateScrollPosition(e);
 * }, 100);
 *
 * useEffect(() => {
 *   window.addEventListener('scroll', throttledScroll);
 *   return () => window.removeEventListener('scroll', throttledScroll);
 * }, [throttledScroll]);
 * ```
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a throttled version of the provided callback.
 * The callback fires immediately on first call, then at most once per `interval`.
 *
 * @param callback - The function to throttle
 * @param interval - Minimum interval between calls in ms (default: 200)
 * @returns A throttled function + cancel helper
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  interval = 200
): T & { cancel: () => void } {
  const callbackRef = useRef(callback);
  const lastCallRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastCallRef.current;

      lastArgsRef.current = args;

      if (elapsed >= interval) {
        // Enough time has passed — fire immediately
        lastCallRef.current = now;
        callbackRef.current(...args);
        lastArgsRef.current = null;
      } else if (!timerRef.current) {
        // Schedule a trailing call
        timerRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          timerRef.current = null;
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
            lastArgsRef.current = null;
          }
        }, interval - elapsed);
      }
    },
    [interval]
  ) as T & { cancel: () => void };

  throttled.cancel = cancel;

  return throttled;
}
