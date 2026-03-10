"use client";

// =============================================================================
// GuestRoute — Client-side guest-only guard component
// =============================================================================
// Wraps content that should only be visible to unauthenticated users.
// Redirects authenticated users to their role-appropriate portal.
//
// Usage:
//   <GuestRoute>
//     <LoginForm />
//   </GuestRoute>
//
// Note: The app/(auth)/layout.tsx already provides guest gating for the
// /login, /register, /forgot-password routes. This component can be used
// in other contexts where guest-only access is needed.
// =============================================================================

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth";
import { roleToDefaultPath, Role } from "@/modules/auth";

export interface GuestRouteProps {
  /** Content to render when user is not authenticated */
  children: React.ReactNode;
  /** Where to redirect authenticated users (default: role-based portal) */
  redirectTo?: string;
  /** Custom loading fallback (default: spinner) */
  loadingFallback?: React.ReactNode;
}

const DefaultLoading = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
  </div>
);

export function GuestRoute({
  children,
  redirectTo,
  loadingFallback,
}: GuestRouteProps) {
  const { user, status } = useAuth();
  const router = useRouter();

  // Redirect authenticated users
  useEffect(() => {
    if (status === "authenticated" && user) {
      const target = redirectTo ?? roleToDefaultPath(user.role as Role);
      router.replace(target);
    }
  }, [status, user, router, redirectTo]);

  // Show loading during auth hydration
  if (status === "idle" || status === "loading") {
    return <>{loadingFallback ?? <DefaultLoading />}</>;
  }

  // Authenticated — show nothing (redirect in progress)
  if (status === "authenticated") {
    return null;
  }

  // Unauthenticated — render children
  return <>{children}</>;
}
