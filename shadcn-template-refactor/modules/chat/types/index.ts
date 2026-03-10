// =============================================================================
// Chat Module Types — Real-time messaging types
// =============================================================================
// Extends the interaction messaging model for real-time chat widget.
// Chat threads are backed by interactions (ENQUIRY/LEAD type).
// =============================================================================

// ---------------------------------------------------------------------------
// Chat Thread (maps to an Interaction with messages)
// ---------------------------------------------------------------------------

export interface ChatThread {
  /** Interaction ID backing this chat */
  id: string;
  /** Listing associated with conversation */
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  /** Vendor info */
  vendorId: string;
  vendorName: string;
  vendorAvatar?: string;
  /** Last message preview */
  lastMessage?: string;
  lastMessageAt?: string;
  /** Count of unread messages */
  unreadCount: number;
  /** Total message count */
  messageCount: number;
  /** Thread status */
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Chat Message
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  threadId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: "CUSTOMER" | "VENDOR" | "SYSTEM";
  /** Optional attachment */
  attachment?: {
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  };
  createdAt: string;
  /** Whether this message has been read by the recipient */
  isRead?: boolean;
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface SendChatMessageDto {
  threadId: string;
  content: string;
}

export interface StartChatDto {
  vendorId: string;
  listingId: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Chat Store State
// ---------------------------------------------------------------------------

export interface ChatStoreState {
  /** Whether the chat widget drawer is open */
  isOpen: boolean;
  /** Currently active thread ID */
  activeThreadId: string | null;
  /** All threads the user has */
  threads: ChatThread[];
  /** Messages keyed by thread ID */
  messages: Record<string, ChatMessage[]>;
  /** IDs of users currently typing in each thread */
  typingUsers: Record<string, string[]>;
  /** Total unread across all threads */
  totalUnread: number;
}

export interface ChatStoreActions {
  /** Open the chat widget */
  openChat: (threadId?: string) => void;
  /** Close the chat widget */
  closeChat: () => void;
  /** Set the active thread */
  setActiveThread: (threadId: string | null) => void;
  /** Set all threads (from API) */
  setThreads: (threads: ChatThread[]) => void;
  /** Add or update a thread */
  upsertThread: (thread: ChatThread) => void;
  /** Set messages for a thread */
  setMessages: (threadId: string, messages: ChatMessage[]) => void;
  /** Append a new message to a thread */
  addMessage: (threadId: string, message: ChatMessage) => void;
  /** Set typing users for a thread */
  setTypingUsers: (threadId: string, userIds: string[]) => void;
  /** Mark a thread as read */
  markThreadRead: (threadId: string) => void;
  /** Recalculate total unread count */
  recalculateUnread: () => void;
}
