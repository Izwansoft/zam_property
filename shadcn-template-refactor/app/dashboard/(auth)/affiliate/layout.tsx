// =============================================================================
// Affiliate Portal — Layout (any authenticated user)
// =============================================================================
// Affiliate is not a separate role — any authenticated user can register as
// an affiliate. The ProtectedRoute with empty allowedRoles ensures only logged-in
// users can access these pages.
// =============================================================================

"use client";

import React from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { PartnerProvider } from "@/modules/partner";
import {
  SocketProvider,
  ConnectionStatusBanner,
  RealtimeSyncProvider,
} from "@/lib/websocket";

export default function AffiliateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ProtectedRoute allowedRoles={[]}>
      <AffiliateLayoutInner>{children}</AffiliateLayoutInner>
    </ProtectedRoute>
  );
}

function AffiliateLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();

  return (
    <PartnerProvider
      mode="derived"
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
        portal="affiliate"
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
