"use client";

// =============================================================================
// Tenant Portal Layout — TENANT role only
// =============================================================================
// Guards all /dashboard/tenant/* routes.
//
// Partner context: DERIVED — from tenant's tenancy partner association.
// Tenants cannot switch partners.
// =============================================================================

import React from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { Role } from "@/modules/auth";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { PartnerProvider } from "@/modules/partner";
import { SocketProvider, ConnectionStatusBanner, RealtimeSyncProvider } from "@/lib/websocket";

export default function TenantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[Role.TENANT]}>
      <TenantLayoutInner>{children}</TenantLayoutInner>
    </ProtectedRoute>
  );
}

/**
 * Inner component — must be inside ProtectedRoute so useAuth is guaranteed.
 */
function TenantLayoutInner({ children }: { children: React.ReactNode }) {
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
                primaryVendorId: null,
              },
            ]
          : []
      }
    >
      <SocketProvider
        token={accessToken}
        portal="tenant"
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
