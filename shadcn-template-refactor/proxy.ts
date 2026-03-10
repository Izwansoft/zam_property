// =============================================================================
// proxy.ts — Next.js 16+ Edge Proxy for Route Protection
// =============================================================================
// Runs at the edge before pages render. Handles:
//   1. Redirect unauthenticated users to /login (for protected routes)
//   2. Redirect authenticated users away from /login, /register (guest-only)
//   3. Check role-based access for portal routes
//
// NOTE: Edge runtime cannot access React context. Auth state is read from
// the access token cookie/header. Full RBAC is enforced client-side in
// portal layout guards; this proxy provides the first layer of defense.
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Configuration (inline to avoid import issues in edge runtime)
// ---------------------------------------------------------------------------

const AUTH_TOKEN_KEY = "zam_access_token";
const AUTH_USER_ROLE_KEY = "zam_user_role";

/** Static paths that proxy should skip entirely */
const STATIC_PREFIXES = [
  "/_next",
  "/api",
  "/images",
  "/favicon",
  "/mockServiceWorker",
  "/sw.js",
];

/** Routes that require authentication */
const PROTECTED_PREFIXES = ["/dashboard"];

/** Routes that are guest-only (redirect authenticated users away) */
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

/** Public routes that should always be accessible (no auth required) */
const PUBLIC_PREFIXES = ["/search", "/listing", "/property", "/category", "/vendors", "/about", "/contact", "/terms", "/privacy", "/cookies"];

/** Portal → allowed roles mapping */
const PORTAL_ROLES: Record<string, string[]> = {
  "/dashboard/platform": ["SUPER_ADMIN"],
  "/dashboard/partner": ["SUPER_ADMIN", "PARTNER_ADMIN"],
  "/dashboard/vendor": ["VENDOR_ADMIN", "VENDOR_STAFF"],
  "/dashboard/company": ["COMPANY_ADMIN"],
  "/dashboard/agent": ["AGENT"],
  "/dashboard/tenant": ["TENANT"],
  "/dashboard/affiliate": [],
  "/dashboard/account": [], // any authenticated user
};

/** Platform routes intentionally excluded from super-admin scope. */
const PLATFORM_BLOCKED_PREFIXES = [
  "/dashboard/platform/tenancies",
  "/dashboard/platform/transactions",
  "/dashboard/platform/payouts",
];

/** Role → default portal path */
const ROLE_DEFAULT_PATH: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/platform",
  PARTNER_ADMIN: "/dashboard/partner",
  VENDOR_ADMIN: "/dashboard/vendor",
  VENDOR_STAFF: "/dashboard/vendor",
  CUSTOMER: "/dashboard/account",
  TENANT: "/dashboard/tenant",
  AGENT: "/dashboard/agent",
  COMPANY_ADMIN: "/dashboard/company",
  GUEST: "/dashboard/account",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isStaticPath(pathname: string): boolean {
  return STATIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Read auth state from cookies.
 * We check for the access token to determine if the user is authenticated.
 * The role is stored separately for edge-level portal gating.
 */
function getAuthState(request: NextRequest): {
  isAuthenticated: boolean;
  role: string | null;
} {
  // Check cookie first (set by client after login)
  const token =
    request.cookies.get(AUTH_TOKEN_KEY)?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  const role = request.cookies.get(AUTH_USER_ROLE_KEY)?.value ?? null;

  return {
    isAuthenticated: !!token && token.length > 0,
    role,
  };
}

/**
 * Find which portal a path belongs to and get its allowed roles.
 * Returns null if not a portal-specific path.
 */
function getPortalRoles(pathname: string): string[] | null {
  // Check most specific first (longest prefix)
  const sortedPrefixes = Object.keys(PORTAL_ROLES).sort(
    (a, b) => b.length - a.length
  );

  for (const prefix of sortedPrefixes) {
    if (pathname.startsWith(prefix)) {
      return PORTAL_ROLES[prefix];
    }
  }
  return null;
}

function getDefaultPath(role: string | null): string {
  if (!role) return "/dashboard/account";
  return ROLE_DEFAULT_PATH[role] ?? "/dashboard/account";
}

function isBlockedPlatformPath(pathname: string): boolean {
  if (PLATFORM_BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // Nested partner operational pages are blocked in super-admin scope.
  return /^\/dashboard\/platform\/partners\/[^/]+\/(transactions|payouts)(\/|$)/.test(pathname);
}

// ---------------------------------------------------------------------------
// proxy() — edge function
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Root path → show public landing page (let it pass through)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 3. Public routes — always accessible, no auth required
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const { isAuthenticated, role } = getAuthState(request);

  // 4. Guest-only routes: redirect authenticated users to their portal
  if (isGuestOnlyPath(pathname)) {
    // Dedicated vendor registration path:
    // guests can register, authenticated users continue onboarding directly.
    if (pathname === "/register/vendor") {
      if (isAuthenticated) {
        return NextResponse.redirect(
          new URL(
            "/dashboard/account/vendor-onboarding?intent=vendor&vertical=real_estate",
            request.url
          )
        );
      }
      return NextResponse.next();
    }

    // Vendor registration CTA from public real-estate pages must remain reachable
    // even when stale auth cookies exist.
    if (
      pathname === "/register" &&
      request.nextUrl.searchParams.get("intent") === "vendor"
    ) {
      return NextResponse.next();
    }

    if (isAuthenticated) {
      return NextResponse.redirect(
        new URL(getDefaultPath(role), request.url)
      );
    }
    return NextResponse.next();
  }

  // 5. Protected routes: redirect unauthenticated users to login
  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      const returnTo = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/login?returnTo=${returnTo}&reason=unauthorized`, request.url)
      );
    }

    // Architecture boundary: keep partner operations in partner scope portals.
    if (
      role === "SUPER_ADMIN" &&
      isBlockedPlatformPath(pathname)
    ) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }

    // 6. Role-based portal access check
    if (role) {
      const allowedRoles = getPortalRoles(pathname);
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/forbidden", request.url));
      }
    }

    // Bare /dashboard → redirect to role-appropriate portal
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.redirect(
        new URL(getDefaultPath(role), request.url)
      );
    }

    return NextResponse.next();
  }

  // 7. All other routes — allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
