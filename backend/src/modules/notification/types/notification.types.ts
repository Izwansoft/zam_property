import { NotificationType, NotificationChannel } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Channel Provider Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base delivery result for all notification channels
 */
export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * Email-specific delivery result
 */
export interface EmailDeliveryResult extends DeliveryResult {
  to: string;
  subject: string;
  provider: 'smtp' | 'sendgrid';
}

/**
 * SMS-specific delivery result
 */
export interface SmsDeliveryResult extends DeliveryResult {
  to: string;
  provider: 'twilio' | 'custom';
}

/**
 * Push notification delivery result
 */
export interface PushDeliveryResult extends DeliveryResult {
  deviceToken: string;
  provider: 'fcm' | 'apns';
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Variables
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base template variables available to all notifications
 */
export interface BaseTemplateVariables {
  partnerName: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  appUrl: string;
}

/**
 * Listing-related template variables
 */
export interface ListingTemplateVariables extends BaseTemplateVariables {
  listingId: string;
  listingTitle: string;
  listingUrl: string;
  listingStatus?: string;
  vendorName?: string;
}

/**
 * Interaction-related template variables
 */
export interface InteractionTemplateVariables extends BaseTemplateVariables {
  interactionId: string;
  interactionType: string;
  listingTitle: string;
  customerName: string;
  messagePreview?: string;
  interactionUrl: string;
}

/**
 * Review-related template variables
 */
export interface ReviewTemplateVariables extends BaseTemplateVariables {
  reviewId: string;
  rating: number;
  reviewTitle: string;
  reviewerName: string;
  vendorName: string;
  reviewUrl: string;
}

/**
 * Subscription-related template variables
 */
export interface SubscriptionTemplateVariables extends BaseTemplateVariables {
  subscriptionId: string;
  planName: string;
  amount: number;
  currency: string;
  expiryDate?: string;
  renewalDate?: string;
  subscriptionUrl: string;
}

/**
 * Payment-related template variables
 */
export interface PaymentTemplateVariables extends BaseTemplateVariables {
  invoiceId: string;
  amount: number;
  currency: string;
  status: string;
  paymentDate?: string;
  invoiceUrl: string;
}

/**
 * Vendor-related template variables
 */
export interface VendorTemplateVariables extends BaseTemplateVariables {
  vendorId: string;
  vendorName: string;
  vendorStatus: string;
  reason?: string;
  vendorUrl: string;
}

/**
 * Rent billing-related template variables
 */
export interface BillingTemplateVariables extends BaseTemplateVariables {
  billNumber: string;
  totalAmount: number;
  dueDate: string;
  tenantName?: string;
  ownerName?: string;
  propertyTitle?: string;
}

/**
 * Rent payment-related template variables
 */
export interface RentPaymentTemplateVariables extends BaseTemplateVariables {
  amount: string;
  currency: string;
  billNumber: string;
  receiptNumber?: string;
  paymentDate?: string;
  payerName?: string;
  payerEmail?: string;
  error?: string;
}

/**
 * Union type of all possible template variables
 */
export type TemplateVariables =
  | BaseTemplateVariables
  | ListingTemplateVariables
  | InteractionTemplateVariables
  | ReviewTemplateVariables
  | SubscriptionTemplateVariables
  | PaymentTemplateVariables
  | VendorTemplateVariables
  | BillingTemplateVariables
  | RentPaymentTemplateVariables;

// ─────────────────────────────────────────────────────────────────────────────
// Notification Payload
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload for creating a notification
 */
export interface NotificationPayload {
  partnerId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  templateId?: string;
  eventId?: string;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Payload for sending via specific channel
 */
export interface ChannelPayload {
  to: string; // Email address, phone number, device token
  subject?: string; // For email/SMS
  body: string;
  data?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel Provider Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Email provider interface (SMTP, SendGrid, etc.)
 */
export interface IEmailProvider {
  send(payload: ChannelPayload): Promise<EmailDeliveryResult>;
  getProviderName(): string;
}

/**
 * SMS provider interface (Twilio, etc.)
 */
export interface ISmsProvider {
  send(payload: ChannelPayload): Promise<SmsDeliveryResult>;
  getProviderName(): string;
}

/**
 * Push notification provider interface (FCM, APNS, etc.)
 */
export interface IPushProvider {
  send(payload: ChannelPayload): Promise<PushDeliveryResult>;
  getProviderName(): string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Rendering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rendered notification content
 */
export interface RenderedNotification {
  subject?: string; // For email/SMS
  body: string;
  variables: TemplateVariables;
}

/**
 * Template context for rendering
 */
export interface TemplateContext {
  template: string;
  variables: TemplateVariables;
  locale?: string;
}
