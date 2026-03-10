// =============================================================================
// useDebouncedValue — Generic debounce hook for reactive values
// =============================================================================

"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced version of the provided value.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns The debounced value (updates `delay` ms after last change)
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebouncedValue(query, 300);
 * // debouncedQuery updates 300ms after the last setQuery call
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
