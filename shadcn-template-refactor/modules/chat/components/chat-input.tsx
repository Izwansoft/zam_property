// =============================================================================
// Chat Input — Message text area with send button
// =============================================================================

"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_LENGTH = 2000;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatInputProps {
  /** Called when user sends a message */
  onSend: (content: string) => void;
  /** Called when user is typing (for typing indicator) */
  onTyping?: () => void;
  /** Whether send is in progress */
  isSending?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatInput({
  onSend,
  onTyping,
  isSending,
  disabled,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !isSending && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [canSend, trimmed, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping?.();

    // Auto-resize textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t bg-background px-3 py-2">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          className={cn(
            "min-h-[36px] max-h-[120px] resize-none border-0 bg-muted/50 rounded-xl px-3 py-2 text-sm",
            "focus-visible:ring-1 focus-visible:ring-ring",
          )}
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={handleSend}
          disabled={!canSend}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>

      {/* Character count (only when near limit) */}
      {value.length > MAX_LENGTH * 0.8 && (
        <p
          className={cn(
            "text-[10px] mt-1 px-1",
            value.length > MAX_LENGTH
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {value.length}/{MAX_LENGTH}
        </p>
      )}
    </div>
  );
}
