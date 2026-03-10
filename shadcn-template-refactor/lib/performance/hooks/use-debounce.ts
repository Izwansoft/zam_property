/**
 * useDebounce Hook
 *
 * Debounces a callback function. Unlike useDebouncedValue (which debounces
 * a reactive value), this debounces an imperative callback.
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebounce((query: string) => {
 *   fetchResults(query);
 * }, 300);
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 *
 * @see hooks/use-debounced-value.ts — for reactive value debouncing
 */
'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a debounced version of the provided callback.
 * The callback is invoked after `delay` ms of inactivity.
 * Automatically cleaned up on unmount.
 *
 * @param callback - The function to debounce
 * @param delay    - Debounce delay in milliseconds (default: 300)
 * @returns A debounced function + cancel/flush helpers
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 300
): T & { cancel: () => void; flush: () => void } {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  // Keep callback ref current without re-creating the debounced function
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

  const flush = useCallback(() => {
    if (timerRef.current && lastArgsRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
        lastArgsRef.current = null;
      }, delay);
    },
    [delay]
  ) as T & { cancel: () => void; flush: () => void };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}
