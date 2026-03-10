/**
 * Performance Utilities — Barrel Export
 *
 * Central re-export for all performance-related hooks, components, and utilities.
 *
 * @example
 * ```tsx
 * import {
 *   useDebounce,
 *   useThrottle,
 *   useIntersectionObserver,
 *   OptimizedImage,
 *   PrefetchLink,
 *   LoadingBoundary,
 *   lazyComponent,
 *   WebVitalsReporter,
 *   WEB_VITAL_THRESHOLDS,
 * } from '@/lib/performance';
 * ```
 *
 * @see docs/ai-prompt/part-17.md
 */

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export { useDebounce } from './hooks/use-debounce';
export { useThrottle } from './hooks/use-throttle';
export {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
  type UseIntersectionObserverReturn,
} from './hooks/use-intersection-observer';

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export { OptimizedImage, IMAGE_SIZES } from './components/optimized-image';
export { PrefetchLink, type PrefetchStrategy, type PrefetchLinkProps } from './components/prefetch-link';
export {
  LoadingBoundary,
  type LoadingVariant,
  type LoadingBoundaryProps,
} from './components/loading-boundary';

// ---------------------------------------------------------------------------
// Lazy Loading
// ---------------------------------------------------------------------------

export {
  lazyComponent,
  type LazyComponentOptions,
  type LazyComponentReturn,
} from './lazy';

// ---------------------------------------------------------------------------
// Web Vitals
// ---------------------------------------------------------------------------

export {
  WebVitalsReporter,
  reportWebVitals,
  WEB_VITAL_THRESHOLDS,
  type WebVitalMetric,
} from './web-vitals';
