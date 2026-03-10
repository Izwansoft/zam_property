// =============================================================================
// ReviewReplyForm — Vendor reply form for reviews
// =============================================================================

"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useReplyToReview } from "../hooks/use-review-mutations";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARACTERS = 1000;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewReplyFormProps {
  reviewId: string;
  /** Whether vendor has already replied */
  hasExistingReply: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewReplyForm({
  reviewId,
  hasExistingReply,
}: ReviewReplyFormProps) {
  const [content, setContent] = useState("");
  const replyMutation = useReplyToReview();

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARACTERS;
  const isNearLimit = charCount > MAX_CHARACTERS * 0.9;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !replyMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    replyMutation.mutate(
      { id: reviewId, content: content.trim() },
      {
        onSuccess: () => setContent(""),
      },
    );
  };

  if (hasExistingReply) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Write your reply to this review..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className={isOverLimit ? "border-destructive" : ""}
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            isOverLimit
              ? "text-destructive"
              : isNearLimit
                ? "text-amber-500"
                : "text-muted-foreground"
          }`}
        >
          {charCount}/{MAX_CHARACTERS}
        </span>

        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="gap-1.5"
        >
          {replyMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send Reply
        </Button>
      </div>
    </div>
  );
}
