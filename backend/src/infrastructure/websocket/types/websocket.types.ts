import { Socket } from 'socket.io';

/**
 * Extended socket interface with authenticated user data.
 * Per Part 33 - all sockets carry user context after authentication.
 */
export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    tenantId: string;
    email?: string;
    roles: string[];
    vendorId?: string;
    permissions?: string[];
  };
}

/**
 * WebSocket namespaces per Part 33.2.
 */
export enum WsNamespace {
  /** Default/public (limited) - no auth required */
  DEFAULT = '/',
  /** Tenant-scoped events - requires tenant membership */
  TENANT = '/tenant',
  /** Vendor-specific events - requires vendor user */
  VENDOR = '/vendor',
  /** Platform admin events - requires platform admin */
  PLATFORM = '/platform',
  /** User notifications - requires authenticated user */
  NOTIFICATIONS = '/notifications',
}

/**
 * Room naming convention: {scope}:{entity_type}:{entity_id}
 */
export interface RoomNames {
  tenant: (tenantId: string) => string;
  tenantListings: (tenantId: string) => string;
  vendor: (vendorId: string) => string;
  listing: (listingId: string) => string;
  user: (userId: string) => string;
  interaction: (interactionId: string) => string;
}

export const ROOM_NAMES: RoomNames = {
  tenant: (tenantId) => `tenant:${tenantId}`,
  tenantListings: (tenantId) => `tenant:${tenantId}:listings`,
  vendor: (vendorId) => `vendor:${vendorId}`,
  listing: (listingId) => `listing:${listingId}`,
  user: (userId) => `user:${userId}`,
  interaction: (interactionId) => `interaction:${interactionId}`,
};

/**
 * Room size limits for scalability per Part 33.9.
 */
export const ROOM_LIMITS = {
  listing: 1000, // Max viewers per listing
  interaction: 10, // Max participants per chat
  tenant: 10000, // Max connections per tenant
};

/**
 * WebSocket error codes.
 */
export enum WsErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  FORBIDDEN = 'FORBIDDEN',
  ROOM_FULL = 'ROOM_FULL',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}

/**
 * Standard WebSocket error response.
 */
export interface WsErrorResponse {
  code: WsErrorCode;
  message: string;
}

/**
 * Standard WebSocket success response.
 */
export interface WsSuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

/**
 * Typing indicator payload.
 */
export interface TypingPayload {
  interactionId: string;
  userId: string;
}

/**
 * Message read payload.
 */
export interface MessageReadPayload {
  interactionId: string;
  messageIds: string[];
}

/**
 * Join/Leave room payload.
 */
export interface RoomPayload {
  id: string;
}

/**
 * Listing viewers payload.
 */
export interface ListingViewersPayload {
  listingId: string;
  count: number;
}
