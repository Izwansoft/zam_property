"use client";

// =============================================================================
// Vendor Portal Layout — VENDOR_ADMIN, VENDOR_STAFF only
// =============================================================================
// Guards all /dashboard/vendor/* routes.
//
// Partner context: DERIVED — from vendor's partner association.
// Vendors cannot switch partners (Part-4 §4.5).
// =============================================================================

import React from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { Role } from "@/modules/auth";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { PartnerProvider } from "@/modules/partner";
import { SocketProvider, ConnectionStatusBanner, RealtimeSyncProvider } from "@/lib/websocket";

export default function VendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[Role.VENDOR_ADMIN, Role.VENDOR_STAFF]}>
      <VendorLayoutInner>{children}</VendorLayoutInner>
    </ProtectedRoute>
  );
}

/**
 * Inner component — must be inside ProtectedRoute so useAuth is guaranteed.
 */
function VendorLayoutInner({ children }: { children: React.ReactNode }) {
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
        portal="vendor"
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
