// =============================================================================
// Interaction Module — Barrel Exports
// =============================================================================
// Leads, enquiries, bookings inbox
// =============================================================================

// Types
export type {
  Interaction,
  InteractionDetail,
  InteractionMessage,
  InteractionFilters,
  InteractionStatus,
  InteractionType,
  InteractionSortBy,
  UpdateInteractionStatusDto,
  SendMessageDto,
  CreateInteractionDto,
} from "./types";
export {
  DEFAULT_INTERACTION_FILTERS,
  VALID_STATUS_TRANSITIONS,
} from "./types";

// Hooks
export { useInteractions } from "./hooks/use-interactions";
export { useInteractionDetail } from "./hooks/use-interaction-detail";
export {
  useUpdateInteractionStatus,
  useSendMessage,
} from "./hooks/use-interaction-mutations";
export { useCreateInteraction } from "./hooks/use-create-interaction";

// Components
export {
  InteractionCard,
  InteractionCardSkeleton,
} from "./components/interaction-card";
export { InteractionFiltersBar } from "./components/interaction-filters";
export { InteractionList } from "./components/interaction-list";
export { InteractionPagination } from "./components/interaction-pagination";
export {
  InteractionDetailView,
  InteractionDetailSkeleton,
} from "./components/interaction-detail";
export { InteractionStatusActions } from "./components/interaction-status-actions";
export { InteractionReplyForm } from "./components/interaction-reply-form";

// Utils
export {
  INTERACTION_STATUS_CONFIG,
  INTERACTION_TYPE_CONFIG,
  getInteractionTypeLabel,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  STATUS_TRANSITION_LABELS,
  cleanInteractionFilters,
} from "./utils";
