// =============================================================================
// WebSocket — Socket.IO client, provider, hooks (barrel export)
// =============================================================================

// Types & constants
export {
  SOCKET_NAMESPACES,
  SOCKET_EVENTS,
  LISTING_EVENTS,
  INTERACTION_EVENTS,
  VENDOR_EVENTS,
  REVIEW_EVENTS,
  SUBSCRIPTION_EVENTS,
  CONTRACT_EVENTS,
  TENANCY_EVENTS,
  NOTIFICATION_EVENTS,
  BILLING_EVENTS,
  PAYMENT_EVENTS,
  PAYOUT_EVENTS,
  DEPOSIT_EVENTS,
  INSPECTION_EVENTS,
  CLAIM_EVENTS,
  MAINTENANCE_EVENTS,
  PRESENCE_EVENTS,
  RECONNECT_CONFIG,
  getNamespaceForPortal,
} from "./types";

export type {
  SocketNamespace,
  ConnectionStatus,
  SocketState,
  SocketContextValue,
  SocketConnectionOptions,
  ListingEventPayload,
  ListingViewersPayload,
  InteractionEventPayload,
  InteractionMessagePayload,
  InteractionTypingPayload,
  VendorEventPayload,
  ReviewEventPayload,
  ContractEventPayload,
  TenancyEventPayload,
  NotificationPayload,
  NotificationCountPayload,
  PresencePayload,
  BillingEventPayload,
  PaymentEventPayload,
  PayoutEventPayload,
  DepositEventPayload,
  InspectionEventPayload,
  ClaimEventPayload,
  MaintenanceEventPayload,
} from "./types";

// Provider & context hook
export { SocketProvider, useSocket } from "./socket-provider";

// Hooks
export { useSocketEvent } from "./use-socket-event";
export { useSocketRoom } from "./use-socket-room";

// Domain-specific hooks (Session 3.3)
export { useRealtimeSync } from "./hooks/use-realtime-sync";
export { useListingViewerCount } from "./hooks/use-listing-viewer-count";
export { useInteractionTyping } from "./hooks/use-interaction-typing";
export { useReconnectionHandler } from "./hooks/use-reconnection-handler";
export { useContractRealtime } from "./hooks/use-contract-realtime";
export { useMaintenanceRealtime } from "./hooks/use-maintenance-realtime";
export { useTenancyRealtime } from "./hooks/use-tenancy-realtime";
export { useBillingPaymentRealtime } from "./hooks/use-billing-payment-realtime";
export { usePropertyOpsRealtime } from "./hooks/use-property-ops-realtime";

// Realtime Sync Provider (Session 3.3)
export { RealtimeSyncProvider } from "./realtime-sync-provider";

// UI Components
export {
  ConnectionStatusBanner,
  ConnectionStatusIndicator,
  ConnectionStatusIcon,
} from "./connection-status";
