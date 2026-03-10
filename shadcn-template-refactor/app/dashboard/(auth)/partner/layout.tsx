"use client";

// =============================================================================
// Partner Portal Layout — PARTNER_ADMIN (and SUPER_ADMIN) only
// =============================================================================
// Guards all /dashboard/partner/* routes.
// SUPER_ADMIN can access to perform support operations.
//
// Partner context: REQUIRED — must resolve partner or block rendering.
// =============================================================================

import React from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { Role } from "@/modules/auth";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { PartnerProvider } from "@/modules/partner";
import { SocketProvider, ConnectionStatusBanner, RealtimeSyncProvider } from "@/lib/websocket";

export default function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.PARTNER_ADMIN]}>
      <PartnerLayoutInner>{children}</PartnerLayoutInner>
    </ProtectedRoute>
  );
}

/**
 * Inner component — must be inside ProtectedRoute so useAuth is guaranteed.
 */
function PartnerLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();

  return (
    <PartnerProvider
      mode="required"
      userpartnerId={user?.partnerId ?? null}
      memberships={
        user?.partnerId
          ? [
              {
                partnerId: user.partnerId,
                partnerName: "",
                partnerSlug: "",
                role: user.role,
                primaryVendorId: user.primaryVendorId ?? null,
              },
            ]
          : []
      }
    >
      <SocketProvider
        token={accessToken}
        portal="partner"
        partnerId={user?.partnerId}
      >
        <RealtimeSyncProvider>
          <ConnectionStatusBanner />
          {children}
        </RealtimeSyncProvider>
      </SocketProvider>
    </PartnerProvider>
  );
}
