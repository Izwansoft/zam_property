// =============================================================================
// Chat Message Components — Bubble, typing indicator, message list
// =============================================================================

"use client";

import { useRef, useEffect } from "react";
import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import type { ChatMessage } from "../types";

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Today → show time only
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("en-MY", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return `Yesterday ${date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}`;
  }

  // Same year → show date + time
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Different year
  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// ChatBubble
// ---------------------------------------------------------------------------

interface ChatBubbleProps {
  message: ChatMessage;
  /** Whether this message is from the current user */
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  // System messages
  if (message.senderRole === "SYSTEM") {
    return (
      <div className="flex justify-center py-1.5">
        <p className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full max-w-[80%] text-center">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 group",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar (only for non-own) */}
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarImage src={undefined} alt={message.senderName} />
          <AvatarFallback className="text-[10px] bg-muted">
            {message.senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[75%] space-y-0.5", isOwn && "items-end")}>
        {/* Sender name (only for non-own) */}
        {!isOwn && (
          <p className="text-[10px] text-muted-foreground font-medium px-1">
            {message.senderName}
          </p>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachment indicator */}
          {message.attachment && (
            <a
              href={message.attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-1 flex items-center gap-1 text-xs underline",
                isOwn
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              📎 {message.attachment.filename}
            </a>
          )}
        </div>

        {/* Timestamp */}
        <p
          className={cn(
            "text-[10px] text-muted-foreground/60 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isOwn && "text-right",
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------

export function TypingIndicator({ names }: { names?: string[] }) {
  if (!names || names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.slice(0, 2).join(", ")} ${names.length > 2 ? `+${names.length - 2}` : ""} are typing`;

  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatMessageList — scrollable list with auto-scroll
// ---------------------------------------------------------------------------

interface ChatMessageListProps {
  messages: ChatMessage[];
  /** Current user role to determine "own" messages */
  currentUserRole?: "CUSTOMER" | "VENDOR";
  typingNames?: string[];
  isLoading?: boolean;
}

export function ChatMessageList({
  messages,
  currentUserRole = "CUSTOMER",
  typingNames,
  isLoading,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingNames?.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/60 py-8">
        <User className="h-8 w-8" />
        <p className="text-sm">No messages yet</p>
        <p className="text-xs">Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderRole === currentUserRole}
        />
      ))}
      <TypingIndicator names={typingNames} />
      <div ref={bottomRef} />
    </div>
  );
}
