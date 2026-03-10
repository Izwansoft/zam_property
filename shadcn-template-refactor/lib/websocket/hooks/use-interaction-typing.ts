// =============================================================================
// useInteractionTyping — Typing indicator for interaction chat
// =============================================================================
// Listens for `interaction:typing` events and maintains a list of currently
// typing user IDs. Automatically clears after a 3-second timeout.
// Also exposes a `sendTyping()` function (throttled) to emit typing events.
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSocketEvent } from "../use-socket-event";
import { useSocketRoom } from "../use-socket-room";
import { useSocket } from "../socket-provider";
import { INTERACTION_EVENTS, type InteractionTypingPayload } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How long (ms) before a typing indicator is cleared */
const TYPING_TIMEOUT = 3000;

/** Minimum interval (ms) between emitting typing events */
const TYPING_THROTTLE = 2000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Track typing indicators for an interaction conversation.
 *
 * Joins the interaction room, listens for `interaction:typing` events,
 * and provides a throttled `sendTyping` function to notify others.
 *
 * @param interactionId — The interaction to track. Pass `null` to disable.
 * @returns `{ typingUserIds, isAnyoneTyping, sendTyping, joined }`
 *
 * @example
 * ```tsx
 * function ChatInput({ interactionId }: { interactionId: string }) {
 *   const { typingUserIds, sendTyping } = useInteractionTyping(interactionId);
 *   return (
 *     <>
 *       {typingUserIds.length > 0 && <span>Someone is typing…</span>}
 *       <input onChange={() => sendTyping()} />
 *     </>
 *   );
 * }
 * ```
 */
export function useInteractionTyping(interactionId: string | null): {
  /** Array of user IDs currently typing */
  typingUserIds: string[];
  /** Whether anyone is currently typing */
  isAnyoneTyping: boolean;
  /** Call this when the current user is typing (throttled) */
  sendTyping: () => void;
  /** Whether the room has been joined */
  joined: boolean;
} {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const lastEmitRef = useRef(0);
  const { emit } = useSocket();

  // Join the interaction room
  const { joined } = useSocketRoom(
    interactionId ? `interaction:${interactionId}` : null,
  );

  // Listen for typing events
  useSocketEvent<InteractionTypingPayload>(
    INTERACTION_EVENTS.TYPING,
    useCallback(
      (data) => {
        if (data.interactionId !== interactionId) return;

        const userId = data.userId;

        // Add user to typing list
        setTypingUserIds((prev) =>
          prev.includes(userId) ? prev : [...prev, userId],
        );

        // Clear any existing timer for this user
        const existing = timersRef.current.get(userId);
        if (existing) clearTimeout(existing);

        // Set a new timer to remove the user after timeout
        const timer = setTimeout(() => {
          setTypingUserIds((prev) => prev.filter((id) => id !== userId));
          timersRef.current.delete(userId);
        }, TYPING_TIMEOUT);

        timersRef.current.set(userId, timer);
      },
      [interactionId],
    ),
    [interactionId],
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // Reset when interaction changes
  useEffect(() => {
    setTypingUserIds([]);
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, [interactionId]);

  // Throttled emit
  const sendTyping = useCallback(() => {
    if (!interactionId) return;

    const now = Date.now();
    if (now - lastEmitRef.current < TYPING_THROTTLE) return;

    lastEmitRef.current = now;
    emit(INTERACTION_EVENTS.TYPING, { interactionId });
  }, [interactionId, emit]);

  return {
    typingUserIds,
    isAnyoneTyping: typingUserIds.length > 0,
    sendTyping,
    joined,
  };
}
