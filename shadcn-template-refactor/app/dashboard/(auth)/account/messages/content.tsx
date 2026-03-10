// =============================================================================
// Messages — Full-page chat view for account dashboard
// =============================================================================
// Embeds the chat thread list + conversation in a full-page layout
// (as opposed to the floating widget overlay).
// =============================================================================

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { MessageCircle, Search, ArrowLeft, Send, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useChatStore } from "@/modules/chat";
import { ChatMessageList } from "@/modules/chat/components/chat-message-components";
import { ChatInput } from "@/modules/chat/components/chat-input";
import type { ChatThread, ChatMessage } from "@/modules/chat";

// ---------------------------------------------------------------------------
// Mock data (same as ChatWidget — in production, both would share API data)
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
    createdAt: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  }));
}

function generateMockMessages(threadId: string): ChatMessage[] {
  const baseTime = Date.now() - 86_400_000;
  return [
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
}

// ---------------------------------------------------------------------------
// Helpers
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
// Component
// ---------------------------------------------------------------------------

export function MessagesContent() {
  const {
    threads,
    messages,
    activeThreadId,
    setThreads,
    setMessages,
    setActiveThread,
    addMessage,
  } = useChatStore();

  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Initialize mock threads if empty
  useEffect(() => {
    if (threads.length === 0) {
      setThreads(generateMockThreads());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages for active thread
  useEffect(() => {
    if (activeThreadId && !messages[activeThreadId]) {
      setMessages(activeThreadId, generateMockMessages(activeThreadId));
    }
  }, [activeThreadId, messages, setMessages]);

  const filtered = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.toLowerCase();
    return threads.filter(
      (t) =>
        t.vendorName.toLowerCase().includes(q) ||
        t.listingTitle.toLowerCase().includes(q),
    );
  }, [threads, search]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const activeMessages = activeThreadId
    ? (messages[activeThreadId] ?? [])
    : [];

  const handleSend = useCallback(
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

      // Simulated reply
      setTimeout(() => {
        addMessage(activeThreadId, {
          id: `msg-${Date.now()}-reply`,
          threadId: activeThreadId,
          content: "Thank you for your message. I'll get back to you shortly.",
          senderId: "vendor-001",
          senderName: "Agent Sarah",
          senderRole: "VENDOR",
          createdAt: new Date().toISOString(),
        });
      }, 2000 + Math.random() * 1000);
    },
    [activeThreadId, addMessage],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Your conversations with agents and vendors."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "messages", label: "Messages" },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="flex h-150">
          {/* Thread List Panel */}
          <div
            className={cn(
              "w-full md:w-80 border-r flex flex-col shrink-0",
              activeThreadId && "hidden md:flex",
            )}
          >
            {/* Search */}
            <div className="p-3 border-b">
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

            {/* Threads */}
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
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setActiveThread(thread.id)}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-3 text-left rounded-lg transition-colors",
                        "hover:bg-accent/50",
                        thread.id === activeThreadId && "bg-accent",
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={thread.vendorAvatar}
                          alt={thread.vendorName}
                        />
                        <AvatarFallback className="text-xs">
                          {thread.vendorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {thread.vendorName}
                          </p>
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
                      {thread.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 min-w-5 flex items-center justify-center rounded-full px-1 text-[10px] shrink-0"
                        >
                          {thread.unreadCount > 99
                            ? "99+"
                            : thread.unreadCount}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Conversation Panel */}
          <div
            className={cn(
              "flex-1 flex flex-col",
              !activeThreadId && "hidden md:flex",
            )}
          >
            {activeThread ? (
              <>
                {/* Conversation header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 md:hidden"
                    onClick={() => setActiveThread(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {activeThread.vendorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activeThread.vendorName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {activeThread.listingTitle}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ChatMessageList
                  messages={activeMessages}
                  currentUserRole="CUSTOMER"
                />

                {/* Input */}
                <ChatInput onSend={handleSend} isSending={isSending} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground/50">
                <MessageCircle className="h-12 w-12" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
