// =============================================================================
// Chat Store — Zustand store for real-time chat state
// =============================================================================
// Manages open/close state, threads, messages, typing indicators,
// and unread counts for the chat widget.
// =============================================================================

"use client";

import { create } from "zustand";
import type {
  ChatStoreState,
  ChatStoreActions,
  ChatThread,
  ChatMessage,
} from "../types";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type ChatStore = ChatStoreState & ChatStoreActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // ---- State ----
  isOpen: false,
  activeThreadId: null,
  threads: [],
  messages: {},
  typingUsers: {},
  totalUnread: 0,

  // ---- Actions ----

  openChat: (threadId?: string) => {
    set({
      isOpen: true,
      ...(threadId != null ? { activeThreadId: threadId } : {}),
    });
  },

  closeChat: () => {
    set({ isOpen: false });
  },

  setActiveThread: (threadId: string | null) => {
    set({ activeThreadId: threadId });
    // Mark as read when opening
    if (threadId) {
      get().markThreadRead(threadId);
    }
  },

  setThreads: (threads: ChatThread[]) => {
    set({ threads });
    get().recalculateUnread();
  },

  upsertThread: (thread: ChatThread) => {
    set((state) => {
      const idx = state.threads.findIndex((t) => t.id === thread.id);
      const updated =
        idx >= 0
          ? state.threads.map((t) => (t.id === thread.id ? thread : t))
          : [thread, ...state.threads];
      return { threads: updated };
    });
    get().recalculateUnread();
  },

  setMessages: (threadId: string, messages: ChatMessage[]) => {
    set((state) => ({
      messages: { ...state.messages, [threadId]: messages },
    }));
  },

  addMessage: (threadId: string, message: ChatMessage) => {
    set((state) => {
      const existing = state.messages[threadId] ?? [];
      // Avoid duplicates
      if (existing.some((m) => m.id === message.id)) return state;

      const updatedMessages = {
        ...state.messages,
        [threadId]: [...existing, message],
      };

      // Update thread's last message preview
      const updatedThreads = state.threads.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          messageCount: t.messageCount + 1,
          // Increment unread if this thread is not currently active
          unreadCount:
            state.activeThreadId === threadId && state.isOpen
              ? t.unreadCount
              : t.unreadCount + 1,
        };
      });

      return { messages: updatedMessages, threads: updatedThreads };
    });
    get().recalculateUnread();
  },

  setTypingUsers: (threadId: string, userIds: string[]) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [threadId]: userIds },
    }));
  },

  markThreadRead: (threadId: string) => {
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, unreadCount: 0 } : t,
      ),
    }));
    get().recalculateUnread();
  },

  recalculateUnread: () => {
    set((state) => ({
      totalUnread: state.threads.reduce((sum, t) => sum + t.unreadCount, 0),
    }));
  },
}));
