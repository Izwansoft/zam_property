"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth";
import { Role, roleToDefaultPath } from "@/modules/auth";

/**
 * Admin-only guest layout.
 * If user is already authenticated as SUPER_ADMIN → redirect to platform dashboard.
 * If authenticated but NOT super admin → redirect to their default portal.
 */
export default function AdminAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      if (user.role === Role.SUPER_ADMIN) {
        router.replace("/dashboard/platform");
      } else {
        router.replace(roleToDefaultPath(user.role as Role));
      }
    }
  }, [status, user, router]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return <main id="main-content">{children}</main>;
}
