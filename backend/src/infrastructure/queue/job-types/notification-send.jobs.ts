import { BaseJobData } from '../queue.interfaces';

/**
 * Notification job types per part-31.md specification.
 */
export type NotificationJobType =
  | 'email.transactional'
  | 'email.marketing'
  | 'sms.send'
  | 'push.send'
  | 'in_app.create'
  | 'webhook.deliver';

/**
 * Base notification job payload.
 */
export interface NotificationJobBase extends BaseJobData {
  type: NotificationJobType;
  template: string;
  data: Record<string, unknown>;
  metadata?: {
    source: string;
    correlationId: string;
    priority?: 'high' | 'normal' | 'low';
  };
}

/**
 * Transactional email job (order confirmations, password resets, etc.).
 */
export interface EmailTransactionalJob extends NotificationJobBase {
  type: 'email.transactional';
  recipientId?: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  locale?: string;
}

/**
 * Marketing email job (newsletters, promotions).
 */
export interface EmailMarketingJob extends NotificationJobBase {
  type: 'email.marketing';
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  locale?: string;
  campaignId?: string;
  unsubscribeUrl?: string;
}

/**
 * SMS send job.
 */
export interface SmsSendJob extends NotificationJobBase {
  type: 'sms.send';
  recipientId?: string;
  recipientPhone: string;
  locale?: string;
}

/**
 * Push notification job.
 */
export interface PushSendJob extends NotificationJobBase {
  type: 'push.send';
  recipientId: string;
  deviceTokens?: string[];
  title?: string;
  body?: string;
  imageUrl?: string;
  actionUrl?: string;
}

/**
 * In-app notification job.
 */
export interface InAppCreateJob extends NotificationJobBase {
  type: 'in_app.create';
  recipientId: string;
  title: string;
  body: string;
  notificationType: string;
  actionUrl?: string;
  imageUrl?: string;
  expiresAt?: string;
}

/**
 * Webhook delivery job.
 */
export interface WebhookDeliverJob extends NotificationJobBase {
  type: 'webhook.deliver';
  webhookUrl: string;
  webhookSecret?: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  retryCount?: number;
}

/**
 * Union type for all notification jobs.
 */
export type NotificationSendJob =
  | EmailTransactionalJob
  | EmailMarketingJob
  | SmsSendJob
  | PushSendJob
  | InAppCreateJob
  | WebhookDeliverJob;

/**
 * Notification delivery result.
 */
export interface NotificationDeliveryResult {
  success: boolean;
  channel: NotificationJobType;
  recipientId?: string;
  messageId?: string;
  providerResponse?: Record<string, unknown>;
  error?: string;
  deliveredAt?: string;
}
