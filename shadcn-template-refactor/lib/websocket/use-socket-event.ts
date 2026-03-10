// =============================================================================
// useSocketEvent — Type-safe WebSocket event subscription hook
// =============================================================================
// Subscribes to a Socket.IO event and calls the handler when received.
// Automatically cleans up on unmount or when dependencies change.
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useSocket } from "./socket-provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SocketTarget = "main" | "notification";

interface UseSocketEventOptions {
  /** Which socket to listen on (default: "main") */
  target?: SocketTarget;
  /** Only subscribe when this is true (default: true) */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Subscribe to a Socket.IO event with automatic cleanup.
 *
 * @param event     — Event name (e.g. "listing:updated")
 * @param handler   — Callback receiving the typed payload
 * @param deps      — Additional dependencies to re-subscribe on
 * @param options   — Target socket and enabled flag
 *
 * @example
 * ```tsx
 * useSocketEvent<ListingEventPayload>(
 *   'listing:updated',
 *   (data) => { console.log(data.listingId); },
 *   [listingId],
 * );
 * ```
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: unknown[] = [],
  options: UseSocketEventOptions = {},
): void {
  const { target = "main", enabled = true } = options;
  const { socket, notificationSocket } = useSocket();

  // Keep latest handler in a ref to avoid re-subscribing on handler identity change
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const targetSocket: Socket | null =
    target === "notification" ? notificationSocket : socket;

  useEffect(() => {
    if (!targetSocket || !enabled) return;

    const listener = (data: T) => {
      handlerRef.current(data);
    };

    targetSocket.on(event, listener);

    return () => {
      targetSocket.off(event, listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetSocket, event, enabled, ...deps]);
}
