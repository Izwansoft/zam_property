// =============================================================================
// Start Chat Button — Opens chat from vendor card / listing page
// =============================================================================
// Creates or finds an existing thread for this listing + vendor combo,
// then opens the chat widget to that thread.
// =============================================================================

"use client";

import { useCallback } from "react";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useChatStore } from "../store/chat-store";
import type { ChatThread } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StartChatButtonProps {
  vendorId: string;
  vendorName: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  /** Button variant */
  variant?: "default" | "outline" | "secondary" | "ghost";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Custom label */
  label?: string;
  /** Full width */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StartChatButton({
  vendorId,
  vendorName,
  listingId,
  listingTitle,
  listingImage,
  variant = "outline",
  size = "default",
  label = "Chat with Agent",
  className,
}: StartChatButtonProps) {
  const { threads, openChat, setActiveThread, upsertThread } = useChatStore();

  const handleStartChat = useCallback(() => {
    // Check if a thread already exists for this listing + vendor
    const existing = threads.find(
      (t) => t.listingId === listingId && t.vendorId === vendorId,
    );

    if (existing) {
      openChat(existing.id);
      return;
    }

    // Create a new thread
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      listingId,
      listingTitle,
      listingImage,
      vendorId,
      vendorName,
      unreadCount: 0,
      messageCount: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    upsertThread(newThread);
    openChat(newThread.id);
  }, [threads, vendorId, vendorName, listingId, listingTitle, listingImage, openChat, upsertThread]);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleStartChat}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
