"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth";
import { roleToDefaultPath, Role } from "@/modules/auth";

/**
 * Guest-only layout for auth pages (/login, /register, /forgot-password).
 * Redirects authenticated users to their role-appropriate portal.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(roleToDefaultPath(user.role as Role));
    }
  }, [status, user, router]);

  // Show nothing while checking auth or while redirecting authenticated users
  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  // If authenticated, show nothing (redirect is in progress)
  if (status === "authenticated") {
    return null;
  }

  return <main id="main-content">{children}</main>;
}
