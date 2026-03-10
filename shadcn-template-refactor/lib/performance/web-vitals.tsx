/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals (LCP, CLS, INP) and additional metrics (FCP, TTFB)
 * using the web-vitals library. Reports to console in development and
 * optionally to an analytics endpoint in production.
 *
 * Targets (WCAG/Google thresholds):
 * - LCP  < 2.5s  (Largest Contentful Paint)
 * - CLS  < 0.1   (Cumulative Layout Shift)
 * - INP  < 200ms (Interaction to Next Paint)
 * - FCP  < 1.8s  (First Contentful Paint)
 * - TTFB < 800ms (Time to First Byte)
 *
 * @example
 * ```tsx
 * // In app/layout.tsx or providers.tsx
 * import { WebVitalsReporter } from '@/lib/performance';
 * // <WebVitalsReporter /> — renders nothing, reports metrics
 * ```
 *
 * @see https://web.dev/vitals/
 * @see docs/ai-prompt/part-17.md
 */
'use client';

import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebVitalMetric {
  /** Metric name */
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  /** Metric value */
  value: number;
  /** Rating: good | needs-improvement | poor */
  rating: 'good' | 'needs-improvement' | 'poor';
  /** Metric ID (unique per page load) */
  id: string;
  /** Navigation type */
  navigationType: string;
  /** Delta since last report */
  delta: number;
}

export type WebVitalReportHandler = (metric: WebVitalMetric) => void;

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

export const WEB_VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

// ---------------------------------------------------------------------------
// Default Handlers
// ---------------------------------------------------------------------------

/**
 * Console reporter — logs metrics with color-coded ratings.
 * Used in development mode.
 */
function consoleReporter(metric: WebVitalMetric): void {
  const colorMap = {
    good: '\x1b[32m',       // green
    'needs-improvement': '\x1b[33m', // yellow
    poor: '\x1b[31m',       // red
  };
  const color = colorMap[metric.rating];
  const reset = '\x1b[0m';

  // eslint-disable-next-line no-console
  console.log(
    `[Web Vitals] ${color}${metric.name}: ${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)} (${metric.rating})${reset}`
  );
}

/**
 * Analytics reporter — sends metric to a beacon endpoint.
 * Uses `navigator.sendBeacon` for reliable delivery on page unload.
 */
function analyticsReporter(
  metric: WebVitalMetric,
  endpoint: string
): void {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    delta: metric.delta,
    url: window.location.href,
    timestamp: Date.now(),
  });

  // Prefer sendBeacon for reliability on page unload
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
  } else {
    fetch(endpoint, {
      body,
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Silent fail — metrics are best-effort
    });
  }
}

// ---------------------------------------------------------------------------
// Core: reportWebVitals
// ---------------------------------------------------------------------------

/**
 * Initialize Web Vitals reporting.
 * Dynamically imports `web-vitals` to avoid adding it to the main bundle.
 *
 * @param onReport - Custom report handler (defaults to console in dev)
 * @param analyticsEndpoint - Optional endpoint for production reporting
 */
export async function reportWebVitals(
  onReport?: WebVitalReportHandler,
  analyticsEndpoint?: string
): Promise<void> {
  const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');

  const handler: WebVitalReportHandler = (metric) => {
    // Custom handler
    if (onReport) {
      onReport(metric);
    }

    // Console in development
    if (process.env.NODE_ENV === 'development') {
      consoleReporter(metric);
    }

    // Analytics endpoint in production
    if (analyticsEndpoint && process.env.NODE_ENV === 'production') {
      analyticsReporter(metric, analyticsEndpoint);
    }
  };

  onCLS(handler);
  onFCP(handler);
  onINP(handler);
  onLCP(handler);
  onTTFB(handler);
}

// ---------------------------------------------------------------------------
// React Component: WebVitalsReporter
// ---------------------------------------------------------------------------

interface WebVitalsReporterProps {
  /** Custom report handler */
  onReport?: WebVitalReportHandler;
  /** Analytics endpoint URL for production reporting */
  analyticsEndpoint?: string;
  /** Enable reporting (defaults to true in dev, configurable in prod) */
  enabled?: boolean;
}

/**
 * React component that initializes Web Vitals reporting.
 * Renders nothing — purely a side-effect component.
 *
 * Place once in your root layout or providers.
 */
export function WebVitalsReporter({
  onReport,
  analyticsEndpoint,
  enabled = true,
}: WebVitalsReporterProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;

    reportWebVitals(onReport, analyticsEndpoint).catch(() => {
      // Silent — web-vitals may not be available in all environments
    });
  }, [enabled, onReport, analyticsEndpoint]);

  return null;
}
