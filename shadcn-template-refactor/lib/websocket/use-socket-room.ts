// =============================================================================
// useSocketRoom — Room subscription with auto-cleanup
// =============================================================================
// Joins a Socket.IO room on mount (when connected) and leaves on unmount.
// Automatically re-joins after reconnection via SocketProvider.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./socket-provider";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Join a Socket.IO room and leave on cleanup.
 *
 * @param room — Room name (e.g. "listing:abc-123"). Pass `null` to skip joining.
 * @returns `{ joined }` — whether the room has been joined on the current connection.
 *
 * @example
 * ```tsx
 * const { joined } = useSocketRoom(`listing:${listingId}`);
 * ```
 */
export function useSocketRoom(room: string | null): { joined: boolean } {
  const { joinRoom, leaveRoom, isConnected } = useSocket();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!room || !isConnected) {
      setJoined(false);
      return;
    }

    joinRoom(room);
    setJoined(true);

    return () => {
      leaveRoom(room);
      setJoined(false);
    };
  }, [room, isConnected, joinRoom, leaveRoom]);

  return { joined };
}
