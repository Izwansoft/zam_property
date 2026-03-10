// =============================================================================
// NotificationBell â€” Bell icon with unread badge + dropdown
// =============================================================================
// Replaces the template's static notification dropdown with a live one.
// Shows unread count badge, dropdown with notification list.
// Clicking a notification marks it read and navigates to the relevant page.
// =============================================================================

"use client";

import React, { useCallback, useState } from "react";
import { BellIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useNotifications } from "../hooks/use-notifications";
import { useUnreadCount } from "../hooks/use-unread-count";
import {
  useMarkAsRead,
  useMarkAllAsRead,
} from "../hooks/use-notification-mutations";
import { NotificationList } from "./notification-list";
import type { Notification } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the navigation URL for a notification based on its data payload.
 * Falls back to the notifications list if no actionUrl is specified.
 */
function resolveNotificationUrl(
  notification: Notification,
  currentPath: string,
): string | null {
  if (notification.data?.actionUrl) {
    return notification.data.actionUrl as string;
  }

  // Derive portal prefix from current path
  const portalMatch = currentPath.match(
    /^\/dashboard\/(platform|partner|vendor|account)/,
  );
  const portalPrefix = portalMatch ? portalMatch[0] : "/dashboard/account";

  // Type-based fallback navigation
  const { entityType, entityId } = notification.data ?? {};
  if (entityType && entityId) {
    switch (entityType) {
      case "listing":
        return `${portalPrefix}/listings/${entityId}`;
      case "interaction":
        return `${portalPrefix}/inbox/${entityId}`;
      case "vendor":
        return `${portalPrefix}/vendors/${entityId}`;
      case "review":
        return `${portalPrefix}/reviews/${entityId}`;
      default:
        return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Data
  const { data: countData } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications({
    page,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Mutations
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = countData?.unreadCount ?? 0;
  const notifications = notificationsData?.items ?? [];
  const totalPages = notificationsData?.pagination?.totalPages ?? 1;
  const hasMore = page < totalPages;

  // Handlers
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsRead.mutate({ id });
    },
    [markAsRead],
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate({} as Record<string, never>);
  }, [markAllAsRead]);

  const handleNavigate = useCallback(
    (notification: Notification) => {
      const url = resolveNotificationUrl(notification, pathname);
      setOpen(false);
      if (url) {
        router.push(url);
      }
    },
    [pathname, router],
  );

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground",
                unreadCount > 99
                  ? "h-5 min-w-5 px-1 text-[10px]"
                  : unreadCount > 9
                    ? "h-4 min-w-4 px-0.5 text-[10px]"
                    : "h-4 w-4 text-[11px]",
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={isMobile ? "center" : "end"}
        className="w-95 p-0"
        sideOffset={8}
      >
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          hasMore={hasMore}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNavigate={handleNavigate}
          onLoadMore={handleLoadMore}
          isMarkingAllRead={markAllAsRead.isPending}
        />
      </PopoverContent>
    </Popover>
  );
}

