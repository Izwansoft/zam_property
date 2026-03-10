"use client";

// =============================================================================
// ProtectedRoute — Client-side role guard component
// =============================================================================
// Wraps content that requires specific roles. If the user doesn't have the
// required role, redirects to /forbidden. Shows loading state during auth
// hydration to prevent content flicker.
//
// Usage:
//   <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
//     <PlatformContent />
//   </ProtectedRoute>
//
//   <ProtectedRoute> {/* Any authenticated user */}
//     <DashboardContent />
//   </ProtectedRoute>
// =============================================================================

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useLoginRedirect } from "@/modules/auth";
import type { Role } from "@/modules/auth";

export interface ProtectedRouteProps {
  /** Content to render when access is granted */
  children: React.ReactNode;
  /** Roles that can access this content. Empty/undefined = any authenticated user */
  allowedRoles?: Role[];
  /** Custom loading fallback (default: spinner) */
  loadingFallback?: React.ReactNode;
  /** Custom forbidden fallback (default: redirect to /forbidden) */
  forbiddenFallback?: React.ReactNode;
}

const DefaultLoading = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
  </div>
);

export function ProtectedRoute({
  children,
  allowedRoles,
  loadingFallback,
  forbiddenFallback,
}: ProtectedRouteProps) {
  const { user, status, isAuthenticated } = useAuth();
  const { redirectToLogin } = useLoginRedirect();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      redirectToLogin("unauthorized");
    }
  }, [status, redirectToLogin]);

  // Redirect unauthorized users to forbidden page
  useEffect(() => {
    if (
      status === "authenticated" &&
      user &&
      allowedRoles &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user.role as Role)
    ) {
      if (!forbiddenFallback) {
        router.replace("/forbidden");
      }
    }
  }, [status, user, allowedRoles, router, forbiddenFallback]);

  // Show loading during auth hydration
  if (status === "idle" || status === "loading") {
    return <>{loadingFallback ?? <DefaultLoading />}</>;
  }

  // Not authenticated — show nothing (redirect in progress)
  if (status === "unauthenticated") {
    return null;
  }

  // Authenticated but wrong role
  if (
    user &&
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role as Role)
  ) {
    if (forbiddenFallback) {
      return <>{forbiddenFallback}</>;
    }
    // Redirect is happening via useEffect above
    return null;
  }

  // All checks passed — render children
  return <>{children}</>;
}
