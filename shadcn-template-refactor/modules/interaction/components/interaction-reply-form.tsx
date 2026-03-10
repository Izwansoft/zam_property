// =============================================================================
// InteractionReplyForm — Send a message with character count
// =============================================================================
// Does NOT automatically change status — vendor must explicitly transition.
// =============================================================================

"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { useSendMessage } from "../hooks/use-interaction-mutations";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARACTERS = 2000;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InteractionReplyFormProps {
  interactionId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractionReplyForm({
  interactionId,
}: InteractionReplyFormProps) {
  const [content, setContent] = useState("");
  const sendMessage = useSendMessage();

  const characterCount = content.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEmpty || isOverLimit) return;

    sendMessage.mutate(
      { interactionId, content: content.trim() },
      {
        onSuccess: () => {
          showSuccess("Message sent successfully");
          setContent("");
        },
        onError: (error) => {
          showError(error.message || "Failed to send message. Please try again.");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder="Type your reply..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none pr-4"
          disabled={sendMessage.isPending}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Character count */}
        <p
          className={`text-xs ${
            isOverLimit
              ? "text-destructive font-medium"
              : characterCount > MAX_CHARACTERS * 0.9
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          }`}
        >
          {characterCount}/{MAX_CHARACTERS}
        </p>

        {/* Send button */}
        <Button
          type="submit"
          size="sm"
          disabled={isEmpty || isOverLimit || sendMessage.isPending}
        >
          {sendMessage.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-4 w-4" />
          )}
          Send Reply
        </Button>
      </div>
    </form>
  );
}
