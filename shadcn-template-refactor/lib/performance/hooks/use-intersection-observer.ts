/**
 * useIntersectionObserver Hook
 *
 * Observes when an element enters/exits the viewport using IntersectionObserver.
 * Useful for lazy loading, infinite scroll triggers, and visibility tracking.
 *
 * @example
 * ```tsx
 * const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
 *   threshold: 0.5,
 *   triggerOnce: true,
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {isIntersecting ? <ExpensiveComponent /> : <Placeholder />}
 *   </div>
 * );
 * ```
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseIntersectionObserverOptions {
  /** Intersection threshold (0–1 or array). Default: 0 */
  threshold?: number | number[];
  /** Root margin (CSS margin syntax). Default: '0px' */
  rootMargin?: string;
  /** Root element (defaults to viewport) */
  root?: Element | null;
  /** Only trigger once (stop observing after first intersection). Default: false */
  triggerOnce?: boolean;
  /** Initially disabled. Default: false */
  disabled?: boolean;
}

export interface UseIntersectionObserverReturn<T extends Element = Element> {
  /** Ref callback to attach to the observed element */
  ref: (node: T | null) => void;
  /** Whether the element is currently intersecting */
  isIntersecting: boolean;
  /** The full IntersectionObserverEntry (null if not yet observed) */
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn<T> {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    triggerOnce = false,
    disabled = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const nodeRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);

  // Cleanup observer
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Observe/unobserve when node or options change
  useEffect(() => {
    if (disabled || !nodeRef.current) return;
    if (triggerOnce && hasTriggeredRef.current) return;

    // IntersectionObserver not available (SSR or old browser)
    if (typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    disconnect();

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry);
        setIsIntersecting(observerEntry.isIntersecting);

        if (observerEntry.isIntersecting && triggerOnce) {
          hasTriggeredRef.current = true;
          observer.disconnect();
        }
      },
      { threshold, rootMargin, root }
    );

    observer.observe(nodeRef.current);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, root, triggerOnce, disabled, disconnect]);

  // Ref callback — stores the node and triggers observation
  const ref = useCallback(
    (node: T | null) => {
      // If node changed, disconnect previous observer
      if (nodeRef.current !== node) {
        disconnect();
      }
      nodeRef.current = node;

      if (node && !disabled && !(triggerOnce && hasTriggeredRef.current)) {
        if (typeof IntersectionObserver === 'undefined') {
          setIsIntersecting(true);
          return;
        }

        const observer = new IntersectionObserver(
          ([observerEntry]) => {
            setEntry(observerEntry);
            setIsIntersecting(observerEntry.isIntersecting);

            if (observerEntry.isIntersecting && triggerOnce) {
              hasTriggeredRef.current = true;
              observer.disconnect();
            }
          },
          { threshold, rootMargin, root }
        );

        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [threshold, rootMargin, root, triggerOnce, disabled, disconnect]
  );

  return { ref, isIntersecting, entry };
}
