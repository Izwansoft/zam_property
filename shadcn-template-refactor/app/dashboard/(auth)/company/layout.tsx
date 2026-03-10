"use client";

// =============================================================================
// Company Portal Layout — COMPANY_ADMIN only
// =============================================================================
// Guards all /dashboard/company/* routes.
//
// Partner context: DERIVED — from company admin's partner association.
// Company admins manage agents and company-level resources.
// =============================================================================

import React from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { Role } from "@/modules/auth";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { PartnerProvider } from "@/modules/partner";
import {
  SocketProvider,
  ConnectionStatusBanner,
  RealtimeSyncProvider,
} from "@/lib/websocket";

export default function CompanyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute allowedRoles={[Role.COMPANY_ADMIN]}>
      <CompanyLayoutInner>{children}</CompanyLayoutInner>
    </ProtectedRoute>
  );
}

/**
 * Inner component — must be inside ProtectedRoute so useAuth is guaranteed.
 */
function CompanyLayoutInner({ children }: { children: React.ReactNode }) {
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
        portal="company"
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
