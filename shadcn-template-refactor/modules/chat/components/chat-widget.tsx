// =============================================================================
// Chat Widget — Floating button + slide-out panel for real-time messaging
// =============================================================================
// Shows a floating chat icon (bottom-right) with unread badge.
// Opens a sheet/panel listing threads on left + active conversation on right.
// Uses the interaction messaging API (MSW-mocked) for chat.
// =============================================================================

"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import {
  MessageCircle,
  X,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useChatStore } from "../store/chat-store";
import { ChatThreadList } from "./chat-thread-list";
import { ChatMessageList } from "./chat-message-components";
import { ChatInput } from "./chat-input";
import type { ChatMessage, ChatThread } from "../types";

// ---------------------------------------------------------------------------
// Mock Data Generator (simulates API fetch until backend is ready)
// ---------------------------------------------------------------------------

function generateMockThreads(): ChatThread[] {
  const vendors = [
    { name: "Hartamas Real Estate", id: "v-001" },
    { name: "PropNex Realty", id: "v-002" },
    { name: "ERA Malaysia", id: "v-003" },
    { name: "IQI Global", id: "v-004" },
    { name: "Kith & Kin Realty", id: "v-005" },
  ];
  const listings = [
    "Semi-D in Bangsar",
    "Condo in Mont Kiara",
    "Terrace House in PJ",
    "Penthouse KLCC",
    "Bungalow Shah Alam",
  ];

  return vendors.map((vendor, i) => ({
    id: `thread-${i + 1}`,
    listingId: `listing-${i + 1}`,
    listingTitle: listings[i],
    vendorId: vendor.id,
    vendorName: vendor.name,
    lastMessage:
      i === 0
        ? "Sure, I can arrange a viewing this weekend."
        : i === 1
          ? "The asking price is negotiable."
          : i === 2
            ? "Photos of the renovated kitchen attached."
            : i === 3
              ? "Maintenance fee is RM400/month."
              : "Let me check and get back to you.",
    lastMessageAt: new Date(
      Date.now() - i * 3_600_000 * Math.random() * 24,
    ).toISOString(),
    unreadCount: i === 0 ? 2 : i === 2 ? 1 : 0,
    messageCount: 3 + i * 2,
    status: "active" as const,
    createdAt: new Date(
      Date.now() - (i + 1) * 86_400_000,
    ).toISOString(),
    updatedAt: new Date(
      Date.now() - i * 3_600_000,
    ).toISOString(),
  }));
}

function generateMockMessages(threadId: string): ChatMessage[] {
  const baseTime = Date.now() - 86_400_000; // 1 day ago
  const msgs: ChatMessage[] = [
    {
      id: `${threadId}-msg-1`,
      threadId,
      content: "Hi, I'm interested in this property. Is it still available?",
      senderId: "customer-001",
      senderName: "You",
      senderRole: "CUSTOMER",
      createdAt: new Date(baseTime).toISOString(),
    },
    {
      id: `${threadId}-msg-2`,
      threadId,
      content:
        "Hello! Yes, this property is still on the market. Would you like to schedule a viewing?",
      senderId: "vendor-001",
      senderName: "Agent Sarah",
      senderRole: "VENDOR",
      createdAt: new Date(baseTime + 30 * 60_000).toISOString(),
    },
    {
      id: `${threadId}-msg-3`,
      threadId,
      content:
        "That would be great! I'm available on Saturday morning or Sunday afternoon.",
      senderId: "customer-001",
      senderName: "You",
      senderRole: "CUSTOMER",
      createdAt: new Date(baseTime + 2 * 3_600_000).toISOString(),
    },
    {
      id: `${threadId}-msg-4`,
      threadId,
      content:
        "Saturday 10am works perfectly. I'll send you the address details.",
      senderId: "vendor-001",
      senderName: "Agent Sarah",
      senderRole: "VENDOR",
      createdAt: new Date(baseTime + 3 * 3_600_000).toISOString(),
    },
    {
      id: `${threadId}-msg-5`,
      threadId,
      content: "Viewing appointment confirmed for Saturday at 10:00 AM.",
      senderId: "system",
      senderName: "System",
      senderRole: "SYSTEM",
      createdAt: new Date(baseTime + 3 * 3_600_000 + 60_000).toISOString(),
    },
  ];
  return msgs;
}

// ---------------------------------------------------------------------------
// ChatPanel — The conversation area (header + messages + input)
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  thread: ChatThread;
  messages: ChatMessage[];
  onBack: () => void;
  onSendMessage: (content: string) => void;
  isSending: boolean;
  typingNames?: string[];
}

function ChatPanel({
  thread,
  messages,
  onBack,
  onSendMessage,
  isSending,
  typingNames,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{thread.vendorName}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {thread.listingTitle}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ChatMessageList
        messages={messages}
        currentUserRole="CUSTOMER"
        typingNames={typingNames}
      />

      {/* Input */}
      <ChatInput onSend={onSendMessage} isSending={isSending} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Widget (Floating Button + Sheet)
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const {
    isOpen,
    activeThreadId,
    threads,
    messages,
    totalUnread,
    openChat,
    closeChat,
    setActiveThread,
    setThreads,
    setMessages,
    addMessage,
  } = useChatStore();

  const [isSending, setIsSending] = useState(false);

  // Initialize mock threads on mount
  useEffect(() => {
    if (threads.length === 0) {
      setThreads(generateMockThreads());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when active thread changes
  useEffect(() => {
    if (activeThreadId && !messages[activeThreadId]) {
      const mockMsgs = generateMockMessages(activeThreadId);
      setMessages(activeThreadId, mockMsgs);
    }
  }, [activeThreadId, messages, setMessages]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const activeMessages = activeThreadId ? (messages[activeThreadId] ?? []) : [];

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!activeThreadId) return;
      setIsSending(true);

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        threadId: activeThreadId,
        content,
        senderId: "customer-001",
        senderName: "You",
        senderRole: "CUSTOMER",
        createdAt: new Date().toISOString(),
      };

      addMessage(activeThreadId, newMsg);
      setIsSending(false);

      // Simulate vendor reply after 2-3 seconds
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: `msg-${Date.now()}-reply`,
          threadId: activeThreadId,
          content: "Thank you for your message. I'll get back to you shortly.",
          senderId: "vendor-001",
          senderName: "Agent Sarah",
          senderRole: "VENDOR",
          createdAt: new Date().toISOString(),
        };
        addMessage(activeThreadId, replyMsg);
      }, 2000 + Math.random() * 1000);
    },
    [activeThreadId, addMessage],
  );

  const handleSelectThread = useCallback(
    (threadId: string) => {
      setActiveThread(threadId);
    },
    [setActiveThread],
  );

  // Whether to show the thread list on mobile (only when no active thread)
  const showThreadList = !activeThreadId;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        type="button"
        onClick={() => openChat()}
        className={cn(
          "fixed bottom-6 right-6 z-50 print:hidden",
          "flex items-center justify-center",
          "h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg",
          "hover:scale-105 active:scale-95 transition-transform",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isOpen && "hidden",
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px] pointer-events-none"
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </Badge>
        )}
      </button>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeChat()}>
        <SheetContent
          side="right"
          className="w-full sm:w-[420px] md:w-[500px] p-0 flex flex-col [&>button]:hidden"
        >
          {/* Sheet Header */}
          <SheetHeader className="px-4 py-3 border-b space-y-0 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              {activeThreadId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden md:flex"
                  onClick={() => setActiveThread(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <SheetTitle className="text-base">
                {activeThread ? activeThread.vendorName : "Messages"}
              </SheetTitle>
              {totalUnread > 0 && !activeThreadId && (
                <Badge variant="secondary" className="text-xs">
                  {totalUnread} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={closeChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Mobile: show either thread list or conversation */}
            <div className="h-full md:hidden">
              {showThreadList ? (
                <ChatThreadList
                  threads={threads}
                  activeThreadId={activeThreadId}
                  onSelectThread={handleSelectThread}
                />
              ) : activeThread ? (
                <ChatPanel
                  thread={activeThread}
                  messages={activeMessages}
                  onBack={() => setActiveThread(null)}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                />
              ) : null}
            </div>

            {/* Desktop: split layout */}
            <div className="hidden md:flex h-full">
              {activeThread ? (
                <ChatPanel
                  thread={activeThread}
                  messages={activeMessages}
                  onBack={() => setActiveThread(null)}
                  onSendMessage={handleSendMessage}
                  isSending={isSending}
                />
              ) : (
                <ChatThreadList
                  threads={threads}
                  activeThreadId={activeThreadId}
                  onSelectThread={handleSelectThread}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
