// =============================================================================
// Chat Thread List — Sidebar showing all conversations
// =============================================================================

"use client";

import { Search, MessageCircle } from "lucide-react";
import { useState, useMemo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { ChatThread } from "../types";

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// Thread Item
// ---------------------------------------------------------------------------

interface ThreadItemProps {
  thread: ChatThread;
  isActive: boolean;
  onClick: () => void;
}

function ThreadItem({ thread, isActive, onClick }: ThreadItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg transition-colors",
        "hover:bg-accent/50",
        isActive && "bg-accent",
      )}
    >
      {/* Vendor avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={thread.vendorAvatar} alt={thread.vendorName} />
        <AvatarFallback className="text-xs">
          {thread.vendorName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{thread.vendorName}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatRelativeTime(thread.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {thread.listingTitle}
        </p>
        {thread.lastMessage && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
            {thread.lastMessage}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {thread.unreadCount > 0 && (
        <Badge
          variant="default"
          className="h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px] shrink-0"
        >
          {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
        </Badge>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Thread List
// ---------------------------------------------------------------------------

interface ChatThreadListProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
}

export function ChatThreadList({
  threads,
  activeThreadId,
  onSelectThread,
}: ChatThreadListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter(
      (t) =>
        t.vendorName.toLowerCase().includes(q) ||
        t.listingTitle.toLowerCase().includes(q) ||
        t.lastMessage?.toLowerCase().includes(q),
    );
  }, [threads, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Thread list */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground/60">
            <MessageCircle className="h-8 w-8" />
            <p className="text-sm">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {filtered.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeThreadId}
                onClick={() => onSelectThread(thread.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
