"use client";

// =============================================================================
// Platform Portal Layout — SUPER_ADMIN only
// =============================================================================
// Guards all /dashboard/platform/* routes. Only SUPER_ADMIN can access.
//
// Partner context: OPTIONAL — platform admin can select/switch partners
// for support operations, but it's not required.
// =============================================================================

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/common/protected-route";
import { Role, useAuth } from "@/modules/auth";
import { PartnerProvider } from "@/modules/partner";
import { SocketProvider, ConnectionStatusBanner, RealtimeSyncProvider } from "@/lib/websocket";

const BLOCKED_PLATFORM_PREFIXES = [
  "/dashboard/platform/tenancies",
  "/dashboard/platform/transactions",
  "/dashboard/platform/payouts",
];

function isBlockedPlatformPath(pathname: string): boolean {
  if (BLOCKED_PLATFORM_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /^\/dashboard\/platform\/partners\/[^/]+\/(transactions|payouts)(\/|$)/.test(pathname);
}

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
      <PlatformLayoutInner>{children}</PlatformLayoutInner>
    </ProtectedRoute>
  );
}

/**
 * Inner component — must be inside ProtectedRoute so useAuth is guaranteed.
 */
function PlatformLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (isBlockedPlatformPath(pathname)) {
      router.replace("/forbidden");
    }
  }, [pathname, router]);

  if (isBlockedPlatformPath(pathname)) {
    return null;
  }

  return (
    <PartnerProvider
      mode="optional"
      userpartnerId={user?.partnerId ?? null}
    >
      <PlatformSocketWrapper>{children}</PlatformSocketWrapper>
    </PartnerProvider>
  );
}

function PlatformSocketWrapper({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();

  return (
    <SocketProvider token={accessToken} portal="platform">
      <RealtimeSyncProvider>
        <ConnectionStatusBanner />
        {children}
      </RealtimeSyncProvider>
    </SocketProvider>
  );
}
