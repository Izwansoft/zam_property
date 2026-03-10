// =============================================================================
// MaintenanceComments — Updates/comments thread for a maintenance ticket
// =============================================================================
// Displays the comment thread and provides an "Add Comment" form.
// Internal comments (isInternal=true) are hidden from tenants.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { MaintenanceUpdate } from "../types";
import { useAddMaintenanceComment } from "../hooks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCommentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Comment Item
// ---------------------------------------------------------------------------

interface CommentItemProps {
  update: MaintenanceUpdate;
  isCurrentUser?: boolean;
}

function CommentItem({ update, isCurrentUser }: CommentItemProps) {
  const displayName = update.createdBy || "Unknown";

  return (
    <div className={cn("flex gap-3", isCurrentUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex-1 rounded-lg p-3",
          isCurrentUser
            ? "bg-primary/10 text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">
            {displayName}
            {update.isInternal && (
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                (Internal)
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground shrink-0">
            {formatCommentDate(update.createdAt)}
          </p>
        </div>
        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
          {update.message}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Comment Form
// ---------------------------------------------------------------------------

interface AddCommentFormProps {
  ticketId: string;
  disabled?: boolean;
}

function AddCommentForm({ ticketId, disabled }: AddCommentFormProps) {
  const [message, setMessage] = useState("");
  const addComment = useAddMaintenanceComment(ticketId);

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      await addComment.mutateAsync({ message: trimmed });
      setMessage("");
      showSuccess("Comment added successfully");
    } catch {
      showError("Failed to add comment. Please try again.");
    }
  }, [message, addComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Add a comment or update..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        disabled={disabled || addComment.isPending}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Press Ctrl+Enter to send
        </p>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={
            !message.trim() || disabled || addComment.isPending
          }
        >
          {addComment.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-3.5 w-3.5" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenanceCommentsProps {
  ticketId: string;
  updates: MaintenanceUpdate[];
  /** Current user ID — used to align own comments to the right */
  currentUserId?: string;
  /** Whether the ticket is in a terminal state (no new comments) */
  isClosed?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Render the updates/comments thread for a maintenance ticket.
 * Includes an "Add Comment" form at the bottom.
 *
 * Internal comments (isInternal=true) are filtered out for tenants.
 */
export function MaintenanceComments({
  ticketId,
  updates,
  currentUserId,
  isClosed,
}: MaintenanceCommentsProps) {
  // Filter out internal comments (tenants shouldn't see them)
  const visibleUpdates = updates.filter((u) => !u.isInternal);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Updates & Comments
          {visibleUpdates.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({visibleUpdates.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment thread */}
        {visibleUpdates.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            No updates yet. Add the first comment below.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {visibleUpdates.map((update) => (
              <CommentItem
                key={update.id}
                update={update}
                isCurrentUser={
                  currentUserId ? update.createdBy === currentUserId : false
                }
              />
            ))}
          </div>
        )}

        {/* Add comment form */}
        {!isClosed ? (
          <>
            <Separator />
            <AddCommentForm ticketId={ticketId} />
          </>
        ) : (
          <div className="rounded-md bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            This ticket is closed. No further comments can be added.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function MaintenanceCommentsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              <div className="h-12 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        ))}
        <div className="h-20 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}
