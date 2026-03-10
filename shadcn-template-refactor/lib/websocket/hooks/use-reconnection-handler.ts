// =============================================================================
// useReconnectionHandler — Refetch stale queries on WebSocket reconnection
// =============================================================================
// Detects reconnection events on both the main and notification sockets
// and invalidates all stale queries so the UI catches up with any changes
// that happened while the user was offline.
//
// The ConnectionStatusBanner (Session 3.1) already handles the visual
// indicator — this hook handles the data side.
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../socket-provider";
import { showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Refetch all stale queries when the WebSocket reconnects after a disconnection.
 *
 * Uses a simple state machine:
 * - Track the `isConnected` flag from SocketProvider
 * - When it transitions from `false → true` (reconnection), invalidate all queries
 * - Show a brief success toast so the user knows data is refreshed
 *
 * @example
 * ```tsx
 * function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
 *   useReconnectionHandler();
 *   return <>{children}</>;
 * }
 * ```
 */
export function useReconnectionHandler(): void {
  const queryClient = useQueryClient();
  const { isConnected, connectionStatus } = useSocket();

  // Track previous connection state to detect transitions
  const wasDisconnectedRef = useRef(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip the first mount — we don't want to refetch on initial connect
    if (isFirstMount.current) {
      isFirstMount.current = false;
      wasDisconnectedRef.current = !isConnected;
      return;
    }

    if (!isConnected) {
      // Mark that we've been disconnected
      wasDisconnectedRef.current = true;
      return;
    }

    // Connected AND was previously disconnected → reconnection
    if (isConnected && wasDisconnectedRef.current) {
      wasDisconnectedRef.current = false;

      // Invalidate all queries so stale ones refetch
      queryClient.invalidateQueries();

      showSuccess("Reconnected — data refreshed");
    }
  }, [isConnected, connectionStatus, queryClient]);
}
