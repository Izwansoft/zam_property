// =============================================================================
// Route Config — Route → Role mapping for route protection
// =============================================================================
// Defines which roles can access which routes, used by both proxy.ts (edge)
// and client-side guards (ProtectedRoute, portal layouts).
// =============================================================================

import { Role } from "@/modules/auth/types";

// ---------------------------------------------------------------------------
// Route rule types
// ---------------------------------------------------------------------------

export interface RouteRule {
  /** Glob-like path pattern (checked via startsWith) */
  path: string;
  /** If true, route requires authentication */
  requireAuth: boolean;
  /** If true, route is ONLY accessible to unauthenticated users */
  guestOnly?: boolean;
  /** Roles that can access this route. Empty = any authenticated user. */
  allowedRoles?: Role[];
  /** Where to redirect on auth failure */
  redirectTo?: string;
}

// ---------------------------------------------------------------------------
// Route rules — ordered from most specific to least specific
// ---------------------------------------------------------------------------

export const ROUTE_RULES: RouteRule[] = [
  // --- Portal routes (most specific first) ---
  {
    path: "/dashboard/platform",
    requireAuth: true,
    allowedRoles: [Role.SUPER_ADMIN],
    redirectTo: "/forbidden",
  },
  {
    path: "/dashboard/partner",
    requireAuth: true,
    allowedRoles: [Role.SUPER_ADMIN, Role.PARTNER_ADMIN],
    redirectTo: "/forbidden",
  },
  {
    path: "/dashboard/vendor",
    requireAuth: true,
    allowedRoles: [Role.VENDOR_ADMIN, Role.VENDOR_STAFF],
    redirectTo: "/forbidden",
  },
  {
    path: "/dashboard/tenant",
    requireAuth: true,
    allowedRoles: [Role.TENANT],
    redirectTo: "/forbidden",
  },
  {
    path: "/dashboard/company",
    requireAuth: true,
    allowedRoles: [Role.COMPANY_ADMIN],
    redirectTo: "/forbidden",
  },
  {
    path: "/dashboard/agent",
    requireAuth: true,
    allowedRoles: [Role.AGENT],
    redirectTo: "/forbidden",
  },
  {
    path: "/dashboard/affiliate",
    requireAuth: true,
    // Any authenticated user can access affiliate portal
    allowedRoles: [],
  },
  {
    path: "/dashboard/account",
    requireAuth: true,
    // Any authenticated user can access account portal
    allowedRoles: [],
  },
  // --- Dashboard catch-all ---
  {
    path: "/dashboard",
    requireAuth: true,
    allowedRoles: [],
  },
  // --- Auth pages (guest only) ---
  {
    path: "/login",
    requireAuth: false,
    guestOnly: true,
  },
  {
    path: "/register",
    requireAuth: false,
    guestOnly: true,
  },
  {
    path: "/forgot-password",
    requireAuth: false,
    guestOnly: true,
  },
  // --- Public/info pages (no auth required) ---
  {
    path: "/session-expired",
    requireAuth: false,
  },
  {
    path: "/forbidden",
    requireAuth: false,
  },
];

// ---------------------------------------------------------------------------
// Route matching helpers
// ---------------------------------------------------------------------------

/**
 * Find the first matching rule for a given pathname.
 */
export function matchRoute(pathname: string): RouteRule | null {
  return ROUTE_RULES.find((rule) => pathname.startsWith(rule.path)) ?? null;
}

/**
 * Check if a role is allowed for a given route rule.
 * Empty allowedRoles means any authenticated user.
 */
export function isRoleAllowed(rule: RouteRule, role: Role): boolean {
  if (!rule.allowedRoles || rule.allowedRoles.length === 0) {
    return true; // any authenticated user
  }
  return rule.allowedRoles.includes(role);
}

// ---------------------------------------------------------------------------
// Portal-to-role mapping (for portal layout guards)
// ---------------------------------------------------------------------------

export const PORTAL_ROLE_MAP: Record<string, Role[]> = {
  platform: [Role.SUPER_ADMIN],
  partner: [Role.SUPER_ADMIN, Role.PARTNER_ADMIN],
  vendor: [Role.VENDOR_ADMIN, Role.VENDOR_STAFF],
  company: [Role.COMPANY_ADMIN],
  agent: [Role.AGENT],
  affiliate: [], // any authenticated user
  account: [], // any authenticated user
};

/**
 * Check if a user role can access a specific portal.
 */
export function canAccessPortal(
  portal: keyof typeof PORTAL_ROLE_MAP,
  role: Role
): boolean {
  const allowed = PORTAL_ROLE_MAP[portal];
  if (!allowed || allowed.length === 0) return true; // any auth user
  return allowed.includes(role);
}

// ---------------------------------------------------------------------------
// Static paths that should never be processed by proxy
// ---------------------------------------------------------------------------

export const STATIC_PREFIXES = [
  "/_next",
  "/api",
  "/images",
  "/favicon",
  "/mockServiceWorker",
] as const;

/**
 * Check if a path is a static asset that should be skipped by proxy.
 */
export function isStaticPath(pathname: string): boolean {
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
