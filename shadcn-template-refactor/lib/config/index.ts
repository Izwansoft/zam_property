// =============================================================================
// Runtime Configuration — Build-time vs Runtime separation
// =============================================================================
// Build-time config: baked into the JS bundle (NEXT_PUBLIC_* via env.ts).
// Runtime config: resolved at request time; allows changes without rebuild.
//
// This module provides helpers that resolve the "effective" value,
// preferring runtime overrides when available.
// =============================================================================

import { env, type AppEnv } from "./env";

// ---------------------------------------------------------------------------
// Build-time config (static — bundled into client JS)
// ---------------------------------------------------------------------------

/**
 * Build-time configuration. These values are inlined at `next build` and
 * cannot change without a rebuild.
 */
export const buildConfig = {
  /** Application environment */
  appEnv: env.NEXT_PUBLIC_APP_ENV as AppEnv,

  /** Portal display name */
  portalName: env.NEXT_PUBLIC_PORTAL_NAME,

  /** Whether MSW API mocking is enabled */
  apiMocking: env.NEXT_PUBLIC_API_MOCKING,

  /** Whether Ops UI is enabled */
  opsUi: env.NEXT_PUBLIC_ENABLE_OPS_UI,

  /** Sentry DSN (client-side) */
  sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,

  /** Google Analytics measurement ID */
  gaMeasurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
} as const;

// ---------------------------------------------------------------------------
// Runtime config (dynamic — resolved per-request or at module init)
// ---------------------------------------------------------------------------

/**
 * Runtime configuration. These values are read from `process.env` at runtime
 * and can be changed via container env or platform env without rebuilding.
 *
 * For **client-side** code, `NEXT_PUBLIC_*` is still baked in at build time,
 * so "runtime" only truly applies to server-side code (SSR, Route Handlers,
 * Server Actions).
 *
 * For truly dynamic client config, use the `__NEXT_DATA__` or a
 * `/api/config` endpoint pattern (not implemented here unless needed).
 */
export const runtimeConfig = {
  /**
   * API base URL — browser-facing.
   * In the browser this equals the build-time value.
   * On the server it can be overridden by `API_INTERNAL_BASE_URL`.
   */
  get apiBaseUrl(): string {
    // Server: prefer internal URL for better perf (no external ingress)
    if (typeof window === "undefined" && process.env.API_INTERNAL_BASE_URL) {
      return process.env.API_INTERNAL_BASE_URL;
    }
    return env.NEXT_PUBLIC_API_BASE_URL;
  },

  /**
   * WebSocket URL. Always client-only; server components don't open sockets.
   */
  get wsUrl(): string {
    return env.NEXT_PUBLIC_WS_URL;
  },

  /**
   * Whether the app is running in production.
   * Checks Node `NODE_ENV` first (set by Next.js), then falls back to
   * `NEXT_PUBLIC_APP_ENV`.
   */
  get isProduction(): boolean {
    return (
      process.env.NODE_ENV === "production" ||
      env.NEXT_PUBLIC_APP_ENV === "production"
    );
  },

  /** Whether the app is running in staging/UAT */
  get isStaging(): boolean {
    return env.NEXT_PUBLIC_APP_ENV === "staging";
  },

  /** Whether the app is running locally */
  get isLocal(): boolean {
    return env.NEXT_PUBLIC_APP_ENV === "local";
  },
} as const;

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { env, type AppEnv } from "./env";
