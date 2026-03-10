// =============================================================================
// Agent Portal — Layout (AGENT role guard)
// =============================================================================

"use client";

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

export default function AgentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ProtectedRoute allowedRoles={[Role.AGENT]}>
      <AgentLayoutInner>{children}</AgentLayoutInner>
    </ProtectedRoute>
  );
}

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
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
        portal="agent"
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
