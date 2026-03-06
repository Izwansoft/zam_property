import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUE_NAMES } from '../../queue/queue.constants';
import {
  NotificationSendJob,
  EmailTransactionalJob,
  EmailMarketingJob,
  SmsSendJob,
  PushSendJob,
  InAppCreateJob,
  WebhookDeliverJob,
  NotificationDeliveryResult,
} from '../../queue/job-types';
import { JobResult } from '../../queue/queue.interfaces';

/**
 * Notification processor for handling async notification delivery.
 *
 * Per part-31.md:
 * - email.transactional: Send transactional emails (priority: high, timeout: 30s, retries: 5)
 * - email.marketing: Send marketing emails (priority: low, timeout: 30s, retries: 3)
 * - sms.send: Send SMS messages (priority: high, timeout: 15s, retries: 3)
 * - push.send: Send push notifications (priority: normal, timeout: 10s, retries: 3)
 * - in_app.create: Create in-app notifications (priority: high, timeout: 5s, retries: 5)
 * - webhook.deliver: Deliver webhooks (priority: normal, timeout: 30s, retries: 5)
 *
 * Rate limits per part-31.md:
 * - Email: 100/second per partner
 * - SMS: 10/second per partner
 * - Push: 1000/second global
 */
@Processor(QUEUE_NAMES.NOTIFICATION_SEND)
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {
    super();
  }

  async process(job: Job<NotificationSendJob>): Promise<JobResult> {
    const startTime = Date.now();
    const { name, data } = job;

    this.logger.log({
      event: 'job.started',
      queue: QUEUE_NAMES.NOTIFICATION_SEND,
      jobId: job.id,
      jobType: name,
      partnerId: data.partnerId,
      notificationType: data.type,
    });

    try {
      let result: JobResult;

      switch (data.type) {
        case 'email.transactional':
          result = await this.handleEmailTransactional(job as Job<EmailTransactionalJob>);
          break;
        case 'email.marketing':
          result = await this.handleEmailMarketing(job as Job<EmailMarketingJob>);
          break;
        case 'sms.send':
          result = await this.handleSmsSend(job as Job<SmsSendJob>);
          break;
        case 'push.send':
          result = await this.handlePushSend(job as Job<PushSendJob>);
          break;
        case 'in_app.create':
          result = await this.handleInAppCreate(job as Job<InAppCreateJob>);
          break;
        case 'webhook.deliver':
          result = await this.handleWebhookDeliver(job as Job<WebhookDeliverJob>);
          break;
        default:
          this.logger.warn(`Unknown notification type: ${(data as NotificationSendJob).type}`);
          result = {
            success: false,
            message: `Unknown notification type: ${(data as NotificationSendJob).type}`,
            processedAt: new Date().toISOString(),
          };
      }

      this.logger.log({
        event: 'job.completed',
        queue: QUEUE_NAMES.NOTIFICATION_SEND,
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        success: result.success,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        event: 'job.failed',
        queue: QUEUE_NAMES.NOTIFICATION_SEND,
        jobId: job.id,
        jobType: name,
        duration: Date.now() - startTime,
        error: err.message,
        stack: err.stack,
      });

      // Emit failure event for monitoring
      this.eventEmitter.emit('notification.delivery_failed', {
        partnerId: data.partnerId,
        type: data.type,
        template: data.template,
        error: err.message,
        correlationId: data.metadata?.correlationId,
      });

      throw error; // Let BullMQ handle retries
    }
  }

  /**
   * Handle transactional email delivery.
   * Uses NotificationService via event-driven pattern to avoid circular dependencies.
   */
  private async handleEmailTransactional(job: Job<EmailTransactionalJob>): Promise<JobResult> {
    const { partnerId, recipientEmail, recipientName, template, data, subject, locale } = job.data;

    this.logger.debug(`Sending transactional email to ${recipientEmail}, template: ${template}`);

    await job.updateProgress(10);

    // Emit event for NotificationService to handle actual delivery
    // This decouples the processor from the notification module
    const deliveryResult = await this.emitAndWaitForDelivery('email.transactional.send', {
      partnerId,
      recipientEmail,
      recipientName,
      template,
      data,
      subject,
      locale,
      correlationId: job.data.metadata?.correlationId,
    });

    await job.updateProgress(100);

    const result: NotificationDeliveryResult = {
      success: deliveryResult?.success ?? true,
      channel: 'email.transactional',
      recipientId: job.data.recipientId,
      messageId: deliveryResult?.messageId,
      deliveredAt: new Date().toISOString(),
    };

    this.eventEmitter.emit('notification.delivered', result);

    return {
      success: result.success,
      message: `Transactional email sent to ${recipientEmail}`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle marketing email delivery.
   */
  private async handleEmailMarketing(job: Job<EmailMarketingJob>): Promise<JobResult> {
    const { partnerId, recipientEmail, template, data, campaignId } = job.data;

    this.logger.debug(`Sending marketing email to ${recipientEmail}, campaign: ${campaignId}`);

    await job.updateProgress(10);

    // Emit event for delivery
    const deliveryResult = await this.emitAndWaitForDelivery('email.marketing.send', {
      partnerId,
      recipientEmail,
      template,
      data,
      campaignId,
      correlationId: job.data.metadata?.correlationId,
    });

    await job.updateProgress(100);

    const result: NotificationDeliveryResult = {
      success: deliveryResult?.success ?? true,
      channel: 'email.marketing',
      messageId: deliveryResult?.messageId,
      deliveredAt: new Date().toISOString(),
    };

    return {
      success: result.success,
      message: `Marketing email sent to ${recipientEmail}`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle SMS delivery.
   */
  private async handleSmsSend(job: Job<SmsSendJob>): Promise<JobResult> {
    const { partnerId, recipientPhone, template, data } = job.data;

    this.logger.debug(`Sending SMS to ${recipientPhone}`);

    await job.updateProgress(10);

    // SMS sending would integrate with Twilio, Vonage, etc.
    // For now, emit event for future provider integration
    const deliveryResult = await this.emitAndWaitForDelivery('sms.send', {
      partnerId,
      recipientPhone,
      template,
      data,
      correlationId: job.data.metadata?.correlationId,
    });

    await job.updateProgress(100);

    const result: NotificationDeliveryResult = {
      success: deliveryResult?.success ?? true,
      channel: 'sms.send',
      recipientId: job.data.recipientId,
      messageId: deliveryResult?.messageId,
      deliveredAt: new Date().toISOString(),
    };

    return {
      success: result.success,
      message: `SMS sent to ${recipientPhone}`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle push notification delivery.
   */
  private async handlePushSend(job: Job<PushSendJob>): Promise<JobResult> {
    const { partnerId, recipientId, title, body, deviceTokens } = job.data;

    this.logger.debug(`Sending push notification to user ${recipientId}`);

    await job.updateProgress(10);

    // Push notifications would integrate with FCM, APNs, etc.
    const deliveryResult = await this.emitAndWaitForDelivery('push.send', {
      partnerId,
      recipientId,
      title,
      body,
      deviceTokens,
      correlationId: job.data.metadata?.correlationId,
    });

    await job.updateProgress(100);

    const result: NotificationDeliveryResult = {
      success: deliveryResult?.success ?? true,
      channel: 'push.send',
      recipientId,
      deliveredAt: new Date().toISOString(),
    };

    return {
      success: result.success,
      message: `Push notification sent to ${recipientId}`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle in-app notification creation.
   */
  private async handleInAppCreate(job: Job<InAppCreateJob>): Promise<JobResult> {
    const { partnerId, recipientId, title, body, notificationType, actionUrl } = job.data;

    this.logger.debug(`Creating in-app notification for user ${recipientId}`);

    await job.updateProgress(10);

    // Emit event for NotificationService to create the notification record
    const deliveryResult = await this.emitAndWaitForDelivery('in_app.create', {
      partnerId,
      recipientId,
      title,
      body,
      notificationType,
      actionUrl,
      correlationId: job.data.metadata?.correlationId,
    });

    await job.updateProgress(100);

    const result: NotificationDeliveryResult = {
      success: deliveryResult?.success ?? true,
      channel: 'in_app.create',
      recipientId,
      deliveredAt: new Date().toISOString(),
    };

    // Also emit WebSocket event for real-time delivery
    this.eventEmitter.emit('notification.realtime', {
      partnerId,
      userId: recipientId,
      notification: {
        title,
        body,
        type: notificationType,
        actionUrl,
      },
    });

    return {
      success: result.success,
      message: `In-app notification created for ${recipientId}`,
      data: result as unknown as Record<string, unknown>,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Handle webhook delivery.
   */
  private async handleWebhookDeliver(job: Job<WebhookDeliverJob>): Promise<JobResult> {
    const { webhookUrl, payload, headers, webhookSecret } = job.data;

    this.logger.debug(`Delivering webhook to ${webhookUrl}`);

    await job.updateProgress(10);

    try {
      // Build request headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Timestamp': new Date().toISOString(),
        ...headers,
      };

      // Add signature if secret provided
      if (webhookSecret) {
        const crypto = await import('crypto');
        const signature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(payload))
          .digest('hex');
        requestHeaders['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      await job.updateProgress(30);

      // Make HTTP request
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
      });

      await job.updateProgress(80);

      const success = response.ok;
      const statusCode = response.status;

      if (!success) {
        const errorBody = await response.text();
        this.logger.warn(
          `Webhook delivery failed: ${webhookUrl} returned ${statusCode}: ${errorBody}`,
        );

        // Throw error to trigger retry
        if (statusCode >= 500) {
          throw new Error(`Webhook delivery failed with status ${statusCode}`);
        }
      }

      await job.updateProgress(100);

      const result: NotificationDeliveryResult = {
        success,
        channel: 'webhook.deliver',
        providerResponse: { statusCode },
        deliveredAt: new Date().toISOString(),
      };

      return {
        success,
        message: success ? `Webhook delivered to ${webhookUrl}` : `Webhook failed: ${statusCode}`,
        data: result as unknown as Record<string, unknown>,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Webhook delivery error: ${err.message}`);
      throw error;
    }
  }

  /**
   * Emit event and optionally wait for handler response.
   * This is a fire-and-forget pattern; actual delivery happens in listeners.
   */
  private async emitAndWaitForDelivery(
    event: string,
    data: Record<string, unknown>,
  ): Promise<{ success: boolean; messageId?: string } | undefined> {
    // Emit event asynchronously
    this.eventEmitter.emit(event, data);

    // Return immediately - actual delivery is handled by listeners
    // In a more advanced setup, you could use promise-based event handling
    return { success: true };
  }
}
