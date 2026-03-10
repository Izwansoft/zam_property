// =============================================================================
// Shared Auth Page Shell — used by both admin & partner auth pages
// =============================================================================
// Renders the split-screen layout (hero image left, form right) with
// portal-specific branding (logo, heading, hero image).
// =============================================================================

"use client";

import React from "react";
import Image from "next/image";
import type { PortalBrand } from "@/config/branding";

interface AuthShellProps {
  brand: PortalBrand;
  children: React.ReactNode;
}

/**
 * Split-screen authentication shell with branded hero image on the left
 * and form content on the right.
 */
export function AuthShell({ brand, children }: AuthShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel — decorative hero image */}
      <div className="hidden w-1/2 bg-gray-100 dark:bg-gray-900 lg:block">
        <Image
          width={1920}
          height={1280}
          src={brand.heroImage}
          alt={`${brand.name} — property`}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      {/* Right panel — form area */}
      <div className="flex w-full items-center justify-center overflow-y-auto lg:w-1/2">
        <div className="w-full max-w-md space-y-6 px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Branded logo block (light + dark variant) for auth pages.
 */
export function AuthLogo({ brand }: { brand: PortalBrand }) {
  return (
    <>
      <Image
        src={brand.logo.light}
        width={brand.logoDimensions.width}
        height={brand.logoDimensions.height}
        alt={brand.logoAlt}
        className="mx-auto dark:hidden"
        priority
      />
      <Image
        src={brand.logo.dark}
        width={brand.logoDimensions.width}
        height={brand.logoDimensions.height}
        alt={brand.logoAlt}
        className="mx-auto hidden dark:block"
        priority
      />
    </>
  );
}
