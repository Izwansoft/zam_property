// =============================================================================
// Chat Module — Barrel Exports
// =============================================================================
// Real-time messaging features for property inquiries.
// =============================================================================

// Types
export type {
  ChatThread,
  ChatMessage,
  SendChatMessageDto,
  StartChatDto,
  ChatStoreState,
  ChatStoreActions,
} from "./types";

// Store
export { useChatStore } from "./store/chat-store";

// Components
export { ChatWidget } from "./components/chat-widget";
export { StartChatButton } from "./components/start-chat-button";
export { ChatBubble, ChatMessageList, TypingIndicator } from "./components/chat-message-components";
export { ChatThreadList } from "./components/chat-thread-list";
export { ChatInput } from "./components/chat-input";
