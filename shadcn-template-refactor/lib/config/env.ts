// =============================================================================
// Environment Configuration — Zod-validated, fail-fast
// =============================================================================
// Validates all environment variables at startup / build time.
// Import `env` (client) or `serverEnv` (server) from this module.
//
// Rules (Part-19):
//   • Secrets must NEVER use the NEXT_PUBLIC_ prefix.
//   • Fail fast on missing / invalid config in dev, build, and prod startup.
//   • Build-time config = baked into the JS bundle (NEXT_PUBLIC_*).
//   • Runtime (server) config = only available in Node.js (Server Components,
//     Route Handlers, Server Actions).
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

const AppEnv = z.enum(["local", "staging", "production"]);
export type AppEnv = z.infer<typeof AppEnv>;

// ---------------------------------------------------------------------------
// Client (public) schema — NEXT_PUBLIC_* vars baked into the bundle
// ---------------------------------------------------------------------------

const clientSchema = z.object({
  /** Application environment */
  NEXT_PUBLIC_APP_ENV: AppEnv.default("local"),

  /** Backend API base URL (browser-facing, e.g. http://localhost:3000/api/v1) */
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_API_BASE_URL must be a valid URL")
    .default("http://localhost:3000/api/v1"),

  /** WebSocket server URL (root, no /api/v1 suffix) */
  NEXT_PUBLIC_WS_URL: z
    .string()
    .url("NEXT_PUBLIC_WS_URL must be a valid URL")
    .default("http://localhost:3000"),

  /** Portal display name (optional branding) */
  NEXT_PUBLIC_PORTAL_NAME: z.string().default("Zam-Property"),

  /** Enable MSW mocking — only use in development */
  NEXT_PUBLIC_API_MOCKING: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  /** Enable Ops Portal UI (optional admin tooling) */
  NEXT_PUBLIC_ENABLE_OPS_UI: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  /** Sentry DSN for client-side error tracking */
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(""),

  /** Google Analytics GA4 Measurement ID */
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional().default(""),
});

// ---------------------------------------------------------------------------
// Server-only schema — available in Node.js runtime only
// ---------------------------------------------------------------------------

const serverSchema = z.object({
  /** Internal API URL for SSR / server actions (can be an internal DNS name) */
  API_INTERNAL_BASE_URL: z
    .string()
    .url("API_INTERNAL_BASE_URL must be a valid URL")
    .default("http://localhost:3000/api/v1"),

  /** OpenAPI spec URL for client generation (CI / prebuild) */
  OPENAPI_SPEC_URL: z
    .string()
    .url("OPENAPI_SPEC_URL must be a valid URL")
    .optional()
    .default("http://localhost:3000/api/docs-json"),

  /** Sentry auth token — used in CI for source-map upload */
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Combined schema (used during server-side validation)
// ---------------------------------------------------------------------------

const fullSchema = clientSchema.merge(serverSchema);

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function formatErrors(errors: z.ZodError): string {
  return errors.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `  ✗ ${path}: ${issue.message}`;
    })
    .join("\n");
}

/**
 * Validate client-side environment variables.
 * Safe to call in both browser and server contexts.
 */
function validateClientEnv() {
  const raw: Record<string, string | undefined> = {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_PORTAL_NAME: process.env.NEXT_PUBLIC_PORTAL_NAME,
    NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
    NEXT_PUBLIC_ENABLE_OPS_UI: process.env.NEXT_PUBLIC_ENABLE_OPS_UI,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  };

  const result = clientSchema.safeParse(raw);

  if (!result.success) {
    const msg = formatErrors(result.error);
    throw new Error(
      `\n❌ Invalid client environment variables:\n${msg}\n\nCheck your .env.local file.\n`,
    );
  }

  return result.data;
}

/**
 * Validate server-side environment variables.
 * Must only be called in Node.js (Server Components, Route Handlers, etc.).
 */
function validateServerEnv() {
  // Guard: never run on the client
  if (typeof window !== "undefined") {
    throw new Error(
      "serverEnv must not be accessed in client components. Use `env` instead.",
    );
  }

  const raw: Record<string, string | undefined> = {
    // Client vars (also available server-side)
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_PORTAL_NAME: process.env.NEXT_PUBLIC_PORTAL_NAME,
    NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
    NEXT_PUBLIC_ENABLE_OPS_UI: process.env.NEXT_PUBLIC_ENABLE_OPS_UI,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    // Server-only vars
    API_INTERNAL_BASE_URL: process.env.API_INTERNAL_BASE_URL,
    OPENAPI_SPEC_URL: process.env.OPENAPI_SPEC_URL,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  };

  const result = fullSchema.safeParse(raw);

  if (!result.success) {
    const msg = formatErrors(result.error);
    throw new Error(
      `\n❌ Invalid server environment variables:\n${msg}\n\nCheck your .env.local file.\n`,
    );
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Exported singletons (lazy-initialised)
// ---------------------------------------------------------------------------

/** Client-safe environment config. Use in any component / module. */
export const env = validateClientEnv();

/**
 * Server-only environment config. Includes all client vars + server secrets.
 * Throws if accessed in the browser.
 *
 * Usage:
 * ```ts
 * import { serverEnv } from '@lib/config/env';
 * const internalUrl = serverEnv.API_INTERNAL_BASE_URL;
 * ```
 */
export const serverEnv =
  typeof window === "undefined" ? validateServerEnv() : (null as never);

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

/** Whether the app is running in production */
export const isProduction = env.NEXT_PUBLIC_APP_ENV === "production";

/** Whether the app is running in staging */
export const isStaging = env.NEXT_PUBLIC_APP_ENV === "staging";

/** Whether the app is running locally */
export const isLocal = env.NEXT_PUBLIC_APP_ENV === "local";

/** Whether API mocking (MSW) is enabled */
export const isMockingEnabled = env.NEXT_PUBLIC_API_MOCKING;

/** Whether the ops UI toggle is on */
export const isOpsUiEnabled = env.NEXT_PUBLIC_ENABLE_OPS_UI;

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof fullSchema>;
