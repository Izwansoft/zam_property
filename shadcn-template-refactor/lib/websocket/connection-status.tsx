// =============================================================================
// ConnectionStatus Components — Banner + Indicator
// =============================================================================
// Show connection state to users. Banner appears after 2s of disconnection.
// Indicator is a small dot for inline status display.
// =============================================================================

"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useSocket } from "./socket-provider";
import type { ConnectionStatus } from "./types";

// ---------------------------------------------------------------------------
// ConnectionStatusBanner — fixed bottom banner on disconnection
// ---------------------------------------------------------------------------

/**
 * Shows a fixed banner at the bottom of the viewport when the WebSocket
 * connection is lost. Appears after a 2-second delay to avoid flashing
 * on brief network hiccups. Hides automatically on reconnection.
 */
export function ConnectionStatusBanner() {
  const { isConnected, connectionError, connectionStatus, reconnectAttempts } =
    useSocket();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!isConnected && connectionStatus !== "connecting") {
      // Delay showing the banner so brief disconnects don't flash
      timeout = setTimeout(() => setShowBanner(true), 2000);
    } else {
      setShowBanner(false);
    }

    return () => clearTimeout(timeout);
  }, [isConnected, connectionStatus]);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <Alert className="flex items-center gap-2 border-amber-500/50 bg-amber-50 text-amber-900 shadow-lg dark:bg-amber-950 dark:text-amber-100">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-sm font-medium">
          {connectionError
            ? `Connection lost. Reconnecting${reconnectAttempts > 0 ? ` (attempt ${reconnectAttempts})` : ""}...`
            : "Connecting to real-time updates..."}
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectionStatusIndicator — small inline dot
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<ConnectionStatus, string> = {
  connected: "bg-green-500",
  connecting: "bg-yellow-500 animate-pulse",
  reconnecting: "bg-yellow-500 animate-pulse",
  disconnected: "bg-gray-400",
  error: "bg-red-500",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  disconnected: "Disconnected",
  error: "Connection error",
};

interface ConnectionStatusIndicatorProps {
  /** Show label text next to the dot (default: false) */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Small colored dot indicating WebSocket connection status.
 * Useful in headers, sidebars, or status bars.
 */
export function ConnectionStatusIndicator({
  showLabel = false,
  className,
}: ConnectionStatusIndicatorProps) {
  const { connectionStatus } = useSocket();

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      title={STATUS_LABELS[connectionStatus]}
    >
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          STATUS_STYLES[connectionStatus],
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {STATUS_LABELS[connectionStatus]}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectionStatusIcon — icon variant for toolbars
// ---------------------------------------------------------------------------

interface ConnectionStatusIconProps {
  className?: string;
}

/**
 * Icon-based connection indicator — Wifi/WifiOff icons with status color.
 */
export function ConnectionStatusIcon({
  className,
}: ConnectionStatusIconProps) {
  const { isConnected, connectionStatus } = useSocket();

  const Icon = isConnected ? Wifi : WifiOff;
  const iconColor = isConnected
    ? "text-green-500"
    : connectionStatus === "error"
      ? "text-red-500"
      : "text-muted-foreground";

  return (
    <Icon
      className={cn("h-4 w-4", iconColor, className)}
      aria-label={STATUS_LABELS[connectionStatus]}
    />
  );
}
