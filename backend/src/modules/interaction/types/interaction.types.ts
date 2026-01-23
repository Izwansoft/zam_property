import {
  Interaction,
  InteractionMessage,
  InteractionType,
  InteractionStatus,
} from '@prisma/client';

/**
 * Interaction record type (alias for Prisma Interaction)
 */
export type InteractionRecord = Interaction;

/**
 * Interaction message record type (alias for Prisma InteractionMessage)
 */
export type InteractionMessageRecord = InteractionMessage;

/**
 * Booking data structure
 */
export interface BookingData {
  startDate?: string;
  endDate?: string;
  preferredTime?: string;
  quantity?: number;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Create interaction params
 */
export interface CreateInteractionParams {
  vendorId: string;
  listingId: string;
  verticalType: string;
  interactionType: InteractionType;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message?: string;
  bookingData?: BookingData;
  source?: string;
  referrer?: string;
}

/**
 * Update interaction status params
 */
export interface UpdateInteractionStatusParams {
  status: InteractionStatus;
}

/**
 * Create message params
 */
export interface CreateMessageParams {
  interactionId: string;
  senderType: 'vendor' | 'customer' | 'system';
  senderId?: string;
  senderName: string;
  message: string;
  isInternal?: boolean;
}

/**
 * Interaction query params
 */
export interface FindManyInteractionsParams {
  vendorId?: string;
  listingId?: string;
  interactionType?: InteractionType;
  status?: InteractionStatus;
  page?: number;
  pageSize?: number;
}
