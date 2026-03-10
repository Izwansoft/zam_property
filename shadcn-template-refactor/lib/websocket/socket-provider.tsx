// =============================================================================
// SocketProvider — React Context for Socket.IO connections
// =============================================================================
// Manages dual Socket.IO connections:
//   1. Portal namespace (/platform, /partner, /vendor, or /)
//   2. Notification namespace (/notifications) — always connected
//
// JWT authentication in handshake. Auto-reconnection with exponential backoff.
// =============================================================================

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import {
  getNamespaceForPortal,
  RECONNECT_CONFIG,
  SOCKET_NAMESPACES,
  type ConnectionStatus,
  type SocketContextValue,
} from "./types";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SocketContext = createContext<SocketContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook to consume the context
// ---------------------------------------------------------------------------

/**
 * Access the Socket.IO context.
 * Must be used within a `<SocketProvider>`.
 */
export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within a <SocketProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Helper — get backend URL
// ---------------------------------------------------------------------------

function getBackendUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) {
    // Strip trailing /api/v1 if present (Socket.IO connects to the root)
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  }
  return "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Provider Props
// ---------------------------------------------------------------------------

interface SocketProviderProps {
  children: React.ReactNode;
  /** JWT access token — required for authentication */
  token: string | null;
  /** Portal name → determines namespace */
  portal: string;
  /** Partner ID for multi-partner scoping (optional) */
  partnerId?: string | null;
  /** Disable auto-connect (default: false) */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

export function SocketProvider({
  children,
  token,
  portal,
  partnerId,
  disabled = false,
}: SocketProviderProps) {
  // ---- State ----
  const [mainSocket, setMainSocket] = useState<Socket | null>(null);
  const [notifSocket, setNotifSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isNotifConnected, setIsNotifConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Refs to avoid stale closures
  const mainSocketRef = useRef<Socket | null>(null);
  const notifSocketRef = useRef<Socket | null>(null);
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // ---- Derived values ----
  const namespace = useMemo(() => getNamespaceForPortal(portal), [portal]);
  const backendUrl = useMemo(() => getBackendUrl(), []);

  // ---- Socket factory ----
  const createSocket = useCallback(
    (ns: string): Socket => {
      const url = `${backendUrl}${ns}`;
      return io(url, {
        auth: { token },
        query: partnerId ? { partnerId } : undefined,
        transports: ["websocket", "polling"],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: RECONNECT_CONFIG.MAX_ATTEMPTS,
        reconnectionDelay: RECONNECT_CONFIG.INITIAL_DELAY,
        reconnectionDelayMax: RECONNECT_CONFIG.MAX_DELAY,
        timeout: 10000,
      });
    },
    [backendUrl, token, partnerId],
  );

  // ---- Connect / Disconnect logic ----
  useEffect(() => {
    // Don't connect without a token or when disabled
    if (!token || disabled) {
      return;
    }

    setConnectionStatus("connecting");
    setConnectionError(null);
    setReconnectAttempts(0);

    // ------- Main namespace socket -------
    const main = createSocket(namespace);
    mainSocketRef.current = main;
    setMainSocket(main);

    main.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      setConnectionError(null);
      setReconnectAttempts(0);

      // Rejoin any rooms after reconnection
      joinedRoomsRef.current.forEach((room) => {
        main.emit("room:join", { room });
      });
    });

    main.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Server forcibly disconnected — don't auto-reconnect
        setConnectionStatus("disconnected");
      } else {
        setConnectionStatus("reconnecting");
      }
    });

    main.on("connect_error", (err) => {
      setConnectionError(err.message);
      setConnectionStatus("error");

      // Handle expired token
      if (err.message === "TOKEN_EXPIRED" || err.message === "UNAUTHORIZED") {
        main.disconnect();
      }
    });

    main.io.on("reconnect_attempt", (attempt: number) => {
      setReconnectAttempts(attempt);
      setConnectionStatus("reconnecting");
    });

    main.io.on("reconnect_failed", () => {
      setConnectionStatus("error");
      setConnectionError("Failed to reconnect after maximum attempts");
    });

    main.io.on("reconnect", () => {
      setConnectionStatus("connected");
      setReconnectAttempts(0);
    });

    main.connect();

    // ------- Notification namespace socket -------
    const notif = createSocket(SOCKET_NAMESPACES.NOTIFICATIONS);
    notifSocketRef.current = notif;
    setNotifSocket(notif);

    notif.on("connect", () => {
      setIsNotifConnected(true);
    });

    notif.on("disconnect", () => {
      setIsNotifConnected(false);
    });

    notif.on("connect_error", (err) => {
      // Handle expired token on notification socket
      if (err.message === "TOKEN_EXPIRED" || err.message === "UNAUTHORIZED") {
        notif.disconnect();
      }
    });

    notif.connect();

    // ------- Cleanup -------
    return () => {
      main.removeAllListeners();
      main.disconnect();
      mainSocketRef.current = null;
      setMainSocket(null);
      setIsConnected(false);

      notif.removeAllListeners();
      notif.disconnect();
      notifSocketRef.current = null;
      setNotifSocket(null);
      setIsNotifConnected(false);

      joinedRoomsRef.current.clear();
      setConnectionStatus("disconnected");
      setConnectionError(null);
      setReconnectAttempts(0);
    };
  }, [token, namespace, disabled, createSocket]);

  // ---- Actions ----

  const emit = useCallback(
    (event: string, data?: unknown) => {
      mainSocketRef.current?.emit(event, data);
    },
    [],
  );

  const joinRoom = useCallback((room: string) => {
    joinedRoomsRef.current.add(room);
    mainSocketRef.current?.emit("room:join", { room });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    joinedRoomsRef.current.delete(room);
    mainSocketRef.current?.emit("room:leave", { room });
  }, []);

  const disconnect = useCallback(() => {
    mainSocketRef.current?.disconnect();
    notifSocketRef.current?.disconnect();
    joinedRoomsRef.current.clear();
    setConnectionStatus("disconnected");
    setIsConnected(false);
    setIsNotifConnected(false);
  }, []);

  // ---- Context value ----

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: mainSocket,
      notificationSocket: notifSocket,
      isConnected,
      isNotificationConnected: isNotifConnected,
      connectionStatus,
      connectionError,
      reconnectAttempts,
      emit,
      joinRoom,
      leaveRoom,
      disconnect,
    }),
    [
      mainSocket,
      notifSocket,
      isConnected,
      isNotifConnected,
      connectionStatus,
      connectionError,
      reconnectAttempts,
      emit,
      joinRoom,
      leaveRoom,
      disconnect,
    ],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
