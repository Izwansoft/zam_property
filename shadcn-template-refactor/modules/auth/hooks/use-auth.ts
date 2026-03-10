"use client";

// =============================================================================
// Auth Hooks — useAuth, useAuthUser, usePermissions, useLoginRedirect
// =============================================================================
// Convenience hooks that consume AuthContext.
// Pages and components should use these instead of useContext(AuthContext).
// =============================================================================

import { useContext, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AuthContext, type AuthContextValue } from "../context/auth-context";
import { Role, roleToDefaultPath } from "../types";
import type { User } from "../types";

const PENDING_VENDOR_INTENT_KEY = "zam_pending_vendor_intent";
const PENDING_VENDOR_VERTICAL_KEY = "zam_pending_vendor_vertical";

// ---------------------------------------------------------------------------
// useAuth — full auth context
// ---------------------------------------------------------------------------

/**
 * Access the complete auth context.
 * @throws Error if used outside AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ---------------------------------------------------------------------------
// useAuthUser — non-null user (for authenticated pages)
// ---------------------------------------------------------------------------

/**
 * Get the authenticated user. Throws if not authenticated.
 * Should only be used inside route-guarded pages where auth is guaranteed.
 */
export function useAuthUser(): User {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    throw new Error(
      "useAuthUser must be used in an authenticated context. " +
        "Ensure the page is wrapped with a route guard."
    );
  }
  return user;
}

// ---------------------------------------------------------------------------
// usePermissions — role & permission checkers
// ---------------------------------------------------------------------------

export interface PermissionHelpers {
  /** Check if user has any of the specified roles */
  hasRole: (...roles: Role[]) => boolean;
  /** Check if user has a specific permission string */
  hasPermission: (permission: string) => boolean;
  /** Check if user can access a specific portal */
  canAccessPortal: (portal: "platform" | "partner" | "vendor" | "account" | "tenant" | "company" | "agent" | "affiliate") => boolean;
  /** Check if user is a platform admin */
  isPlatformAdmin: boolean;
  /** Check if user is a partner admin */
  isPartnerAdmin: boolean;
  /** Check if user is a vendor user (admin or staff) */
  isVendorUser: boolean;
  /** Check if user is a customer */
  isCustomer: boolean;
  /** Check if user is a company admin */
  isCompanyAdmin: boolean;
  /** Check if user is an agent */
  isAgent: boolean;
  /** Current user's role */
  role: Role | null;
}

export function usePermissions(): PermissionHelpers {
  const { user, hasRole, hasPermission } = useAuth();

  const canAccessPortal = useCallback(
    (portal: "platform" | "partner" | "vendor" | "account" | "tenant" | "company" | "agent" | "affiliate"): boolean => {
      switch (portal) {
        case "platform":
          return hasRole(Role.SUPER_ADMIN);
        case "partner":
          return hasRole(Role.SUPER_ADMIN, Role.PARTNER_ADMIN);
        case "vendor":
          return hasRole(Role.VENDOR_ADMIN, Role.VENDOR_STAFF);
        case "tenant":
          return hasRole(Role.TENANT);
        case "company":
          return hasRole(Role.COMPANY_ADMIN);
        case "agent":
          return hasRole(Role.AGENT);
        case "affiliate":
          // Any authenticated user can access affiliate portal
          return user !== null;
        case "account":
          // Any authenticated user can access account portal
          return user !== null;
        default:
          return false;
      }
    },
    [user, hasRole]
  );

  return useMemo(
    () => ({
      hasRole,
      hasPermission,
      canAccessPortal,
      isPlatformAdmin: hasRole(Role.SUPER_ADMIN),
      isPartnerAdmin: hasRole(Role.PARTNER_ADMIN),
      isVendorUser: hasRole(Role.VENDOR_ADMIN, Role.VENDOR_STAFF),
      isCustomer: hasRole(Role.CUSTOMER),
      isCompanyAdmin: hasRole(Role.COMPANY_ADMIN),
      isAgent: hasRole(Role.AGENT),
      role: user?.role as Role | null ?? null,
    }),
    [user, hasRole, hasPermission, canAccessPortal]
  );
}

// ---------------------------------------------------------------------------
// useLoginRedirect — return URL handling (Part-4 §4.13.8)
// ---------------------------------------------------------------------------

export interface LoginRedirectHelpers {
  /** Redirect to login page, preserving current URL as returnTo */
  redirectToLogin: (reason?: string) => void;
  /** After successful login, redirect to returnTo or default portal */
  handlePostLogin: (
    user: User,
    options?: { intent?: string | null; vertical?: string | null }
  ) => void;
}

export function useLoginRedirect(): LoginRedirectHelpers {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const redirectToLogin = useCallback(
    (reason?: string) => {
      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      const returnTo = encodeURIComponent(currentPath);

      // Platform admin pages redirect to admin login
      const isAdminContext = pathname.startsWith("/dashboard/platform") || pathname.startsWith("/admin");
      const loginBase = isAdminContext ? "/admin/login" : "/login";
      const loginUrl = `${loginBase}?returnTo=${returnTo}${reason ? `&reason=${reason}` : ""}`;
      router.replace(loginUrl);
    },
    [router, pathname, searchParams]
  );

  const handlePostLogin = useCallback(
    (
      user: User,
      options?: { intent?: string | null; vertical?: string | null }
    ) => {
      const returnTo = searchParams.get("returnTo");

      const storedIntent =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(PENDING_VENDOR_INTENT_KEY)
          : null;
      const storedVertical =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(PENDING_VENDOR_VERTICAL_KEY)
          : null;

      const effectiveIntent = options?.intent || storedIntent;
      const effectiveVertical = options?.vertical || storedVertical;

      if (returnTo && isValidReturnUrl(returnTo)) {
        router.replace(decodeURIComponent(returnTo));
      } else if (effectiveIntent === "vendor") {
        const params = new URLSearchParams();
        params.set("intent", "vendor");
        if (effectiveVertical) {
          params.set("vertical", effectiveVertical);
        }

        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(PENDING_VENDOR_INTENT_KEY);
          window.sessionStorage.removeItem(PENDING_VENDOR_VERTICAL_KEY);
        }

        router.replace(`/dashboard/account/vendor-onboarding?${params.toString()}`);
      } else {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(PENDING_VENDOR_INTENT_KEY);
          window.sessionStorage.removeItem(PENDING_VENDOR_VERTICAL_KEY);
        }

        // Redirect to role-appropriate default portal
        router.replace(roleToDefaultPath(user.role as Role));
      }
    },
    [router, searchParams]
  );

  return { redirectToLogin, handlePostLogin };
}

// ---------------------------------------------------------------------------
// Return URL Validation (prevent open redirects)
// ---------------------------------------------------------------------------

function isValidReturnUrl(url: string): boolean {
  try {
    // Must be a relative path starting with /
    if (!url.startsWith("/") || url.startsWith("//")) {
      return false;
    }
    // Validate it's truly a path within our app
    const parsed = new URL(url, "http://localhost");
    return (
      parsed.hostname === "localhost" &&
      parsed.pathname.startsWith("/")
    );
  } catch {
    return false;
  }
}
