"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "@/modules/auth/context/auth-context";
import { RouteAnnouncer } from "@/lib/accessibility";
import {
  STALE_TIMES,
  smartQueryRetry,
  RETRY_CONFIG,
} from "@/lib/query/config";

/**
 * Global providers wrapper.
 *
 * Provides:
 * - TanStack Query (QueryClientProvider)
 * - React Query Devtools (development only)
 * - AuthProvider (Session 1.4) — identity hydration, login/logout, permission helpers
 * - SocketProvider (Session 3.1) — integrated in portal layouts (platform, partner, vendor, account)
 * - MSW conditional initialization (when NEXT_PUBLIC_API_MOCKING=true)
 */

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds by default
        staleTime: STALE_TIMES.DEFAULT,
        // Smart retry: 3 retries for server errors, 0 for client errors (4xx)
        retry: smartQueryRetry,
        // Refetch on window focus for stale data
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Mutations should NOT auto-retry — user should see error and retry manually
        retry: RETRY_CONFIG.NONE,
      },
    },
  });
}

// Singleton for browser — avoid recreating on every render.
// On server, always create a new client.
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient();
  }
  // Browser: reuse the same client
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

// ---------------------------------------------------------------------------
// MSW Integration — only in development when NEXT_PUBLIC_API_MOCKING=true
// ---------------------------------------------------------------------------

function shouldEnableMsw(): boolean {
  return (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_API_MOCKING === "true" &&
    process.env.NODE_ENV === "development"
  );
}

async function initMsw(): Promise<void> {
  const { worker } = await import("@/lib/mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: false,
  });

  // eslint-disable-next-line no-console
  console.log("[MSW] Mock Service Worker started");
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => getQueryClient());
  // Always start as false on both server & client to avoid hydration mismatch
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (shouldEnableMsw()) {
      initMsw()
        .then(() => setReady(true))
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[MSW] Failed to start:", err);
          setReady(true);
        });

      // Safety timeout
      const timeout = setTimeout(() => {
        setReady((prev) => {
          if (!prev) {
            // eslint-disable-next-line no-console
            console.warn("[MSW] Init timed out — proceeding without mocks");
          }
          return true;
        });
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      // No MSW — ready immediately
      setReady(true);
    }
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouteAnnouncer />
        {children}
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
