import type { NextConfig } from "next";
import { config } from "dotenv";

config();

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

const isProd = process.env.NODE_ENV === "production";
const isRealProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

/**
 * Resolve the backend origin for CSP connect-src.
 * Falls back to localhost for local dev.
 */
const apiOrigin = (() => {
  try {
    const url = new URL(
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1",
    );
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
})();

const wsOrigin = (() => {
  try {
    const raw =
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";
    const url = new URL(raw);
    // WebSocket needs ws: / wss: scheme for CSP
    const wsScheme = url.protocol === "https:" ? "wss:" : "ws:";
    return `${wsScheme}//${url.host}`;
  } catch {
    return "ws://localhost:3000";
  }
})();

// ---------------------------------------------------------------------------
// Content Security Policy
// ---------------------------------------------------------------------------

const cspDirectives = [
  // Only load resources from own origin by default
  "default-src 'self'",
  // Scripts: self + inline (Next.js hydration) + eval in dev (HMR)
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://maps.googleapis.com`,
  // Styles: self + inline (CSS-in-JS, Tailwind) + Google Fonts (loaded by Maps SDK)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Images: self + data URIs + blob + configured remote patterns + Google Maps
  "img-src 'self' data: blob: https://images.unsplash.com https://i.pravatar.cc https://hebbkx1anhila5yf.public.blob.vercel-storage.com https://maps.gstatic.com https://maps.googleapis.com",
  // Fonts: self + data URIs + Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // Media: self + Google storage (sample videos)
  "media-src 'self' blob: https://storage.googleapis.com",
  // API + WebSocket connections + Google Maps APIs
  `connect-src 'self' ${apiOrigin} ${wsOrigin} https://maps.googleapis.com`,
  // Frames: none (prevent embedding)
  "frame-ancestors 'none'",
  // Form actions: self only
  "form-action 'self'",
  // Base URI: self only
  "base-uri 'self'",
  // Upgrade insecure requests in production
  ...(isRealProd ? ["upgrade-insecure-requests"] : []),
];

const contentSecurityPolicy = cspDirectives.join("; ");

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------

const securityHeaders = [
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // XSS protection (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Referrer policy — send origin only on cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions policy — disable unused browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HSTS — enforce HTTPS for 1 year (includeSubDomains + preload)
  ...(isRealProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
  // Prevent cross-origin information leakage (HTTPS only — ignored on plain HTTP)
  ...(isRealProd
    ? [
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ]
    : []),
];

// ---------------------------------------------------------------------------
// Next.js Configuration
// ---------------------------------------------------------------------------

const nextConfig: NextConfig = {
  // -------------------------------------------------------------------------
  // Image Optimization
  // -------------------------------------------------------------------------
  images: {
    // Prefer AVIF → WebP → fallback
    formats: ["image/avif", "image/webp"],
    // Device width breakpoints for srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image widths for the `sizes` attribute
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      // External image sources used in reference examples
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Compiler Optimizations
  // -------------------------------------------------------------------------
  // Remove console.log in production builds (keep warn/error)
  compiler: {
    removeConsole: isProd ? { exclude: ["warn", "error"] } : false,
  },

  // -------------------------------------------------------------------------
  // Production Optimizations
  // -------------------------------------------------------------------------

  // Output standalone build for Docker / containerised deployments.
  // Copies only required node_modules into .next/standalone.
  // NOTE: Requires symlink permissions on Windows (run as admin or enable Developer Mode).
  // Uncomment for CI/Docker builds:
  // ...(isProd ? { output: "standalone" } : {}),

  // Enable gzip compression for responses
  compress: true,

  // Strict-mode React for catching bugs early
  reactStrictMode: true,

  // Generate source maps in production for error tracking (Sentry etc.)
  productionBrowserSourceMaps: false,

  // -------------------------------------------------------------------------
  // Experimental features
  // -------------------------------------------------------------------------
  experimental: {
    // Enable server actions (stable in Next 14+, kept explicit)
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Optimise CSS (if supported by the Next version)
    optimizeCss: false,
  },

  // -------------------------------------------------------------------------
  // Powered-by header — disable to reduce fingerprinting
  // -------------------------------------------------------------------------
  poweredByHeader: false,

  // -------------------------------------------------------------------------
  // HTTP Headers (Security + Caching)
  // -------------------------------------------------------------------------
  async headers() {
    return [
      // Security headers on all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // In dev mode: disable caching to avoid stale assets
      ...(!isProd
        ? [
            {
              source: "/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "no-store, no-cache, must-revalidate, proxy-revalidate",
                },
                { key: "Pragma", value: "no-cache" },
                { key: "Expires", value: "0" },
              ],
            },
          ]
        : []),
      // Static assets — immutable, long-term cache (production only)
      ...(isProd
        ? [
            {
              source: "/_next/static/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
            // Optimized images — cache for 1 day, revalidate
            {
              source: "/_next/image(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value:
                    "public, max-age=86400, stale-while-revalidate=604800",
                },
              ],
            },
            // Public assets (fonts, icons, etc.)
            {
              source: "/images/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value:
                    "public, max-age=604800, stale-while-revalidate=86400",
                },
              ],
            },
            // Font files — immutable, long-term cache
            {
              source: "/fonts/(.*)",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
    ];
  },

  // -------------------------------------------------------------------------
  // Redirects (optional — add permanent redirects here)
  // -------------------------------------------------------------------------
  async redirects() {
    return [
      // Public home page is at / via (public)/page.tsx — no redirect needed
    ];
  },
};

export default nextConfig;