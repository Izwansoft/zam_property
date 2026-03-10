// =============================================================================
// NotificationItem — Single notification row with type icon
// =============================================================================
// Renders a notification with icon, title, message, timestamp, and unread dot.
// Clicking marks as read and navigates to the relevant entity.
// =============================================================================

"use client";

import React, { useCallback } from "react";
import {
  Plus,
  Pencil,
  Globe,
  EyeOff,
  Clock,
  MessageSquare,
  Mail,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Ban,
  Star,
  Reply,
  CreditCard,
  AlertTriangle,
  AlertOctagon,
  Bell,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/modules/notification/utils";
import type { Notification, NotificationType } from "../types";
import { NOTIFICATION_TYPE_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Icon mapping — type name → Lucide component
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  Pencil,
  Globe,
  EyeOff,
  Clock,
  MessageSquare,
  Mail,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Ban,
  Star,
  Reply,
  CreditCard,
  AlertTriangle,
  AlertOctagon,
  Bell,
  Wrench,
};

function getIcon(type: NotificationType): LucideIcon {
  const config = NOTIFICATION_TYPE_CONFIG[type];
  return ICON_MAP[config?.icon] ?? Bell;
}

function getIconColor(type: NotificationType): string {
  return NOTIFICATION_TYPE_CONFIG[type]?.color ?? "text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onNavigate?: (notification: Notification) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onNavigate,
}: NotificationItemProps) {
  const Icon = getIcon(notification.type);
  const iconColor = getIconColor(notification.type);

  const handleClick = useCallback(() => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNavigate) {
      onNavigate(notification);
    }
  }, [notification, onMarkAsRead, onNavigate]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50",
        !notification.isRead && "bg-accent/20",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted",
        )}
      >
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "truncate text-sm",
            !notification.isRead ? "font-semibold" : "font-medium",
          )}
        >
          {notification.title}
        </p>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/70">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <span className="mt-2 block h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}
