"use client";

// =============================================================================
// Account Portal Layout — Any authenticated user (CUSTOMER default)
// =============================================================================
// Guards all /dashboard/account/* routes.
// Any authenticated user can access the account portal.
//
// Partner context: NONE — account portal does not need partner scope.
// =============================================================================

import React from "react";
import { ProtectedRoute } from "@/components/common/protected-route";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { PartnerProvider } from "@/modules/partner";
import { SocketProvider, ConnectionStatusBanner, RealtimeSyncProvider } from "@/lib/websocket";

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <PartnerProvider mode="none">
        <AccountSocketWrapper>{children}</AccountSocketWrapper>
      </PartnerProvider>
    </ProtectedRoute>
  );
}

function AccountSocketWrapper({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();

  return (
    <SocketProvider token={accessToken} portal="account">
      <RealtimeSyncProvider>
        <ConnectionStatusBanner />
        {children}
      </RealtimeSyncProvider>
    </SocketProvider>
  );
}
