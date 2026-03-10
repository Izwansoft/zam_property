// =============================================================================
// NotificationList â€” Scrollable notification dropdown content
// =============================================================================
// Displays a list of notifications with mark-all-as-read action.
// Handles empty state, loading skeleton, and pagination via "Load more".
// =============================================================================

"use client";

import React from "react";
import { CheckCheck, Inbox, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "./notification-item";
import type { Notification } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  hasMore: boolean;
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (notification: Notification) => void;
  onLoadMore: () => void;
  isMarkingAllRead?: boolean;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">
        No notifications
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        You&apos;re all caught up!
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationList({
  notifications,
  isLoading,
  hasMore,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
  onLoadMore,
  isMarkingAllRead = false,
}: NotificationListProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">Notifications</span>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAllRead}
          >
            {isMarkingAllRead ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="mr-1 h-3 w-3" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="h-95">
        {isLoading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onNavigate={onNavigate}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={onLoadMore}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}

