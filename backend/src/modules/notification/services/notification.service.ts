import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as Handlebars from 'handlebars';
import { NotificationType, NotificationChannel, NotificationStatus, Prisma } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import { SmtpEmailProvider } from '../providers/smtp-email.provider';
import { SendGridEmailProvider } from '../providers/sendgrid-email.provider';
import {
  TemplateVariables,
  DeliveryResult,
  RenderedNotification,
  IEmailProvider,
} from '../types/notification.types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailProvider: IEmailProvider;

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly sendGridProvider: SendGridEmailProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Use SMTP by default (can be configured via env)
    this.emailProvider = this.smtpProvider;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Template Rendering
  // ───────────────────────────────────────────────────────────────────────────

  private renderTemplate(template: string, variables: TemplateVariables): string {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(variables);
  }

  private async getRenderedNotification(params: {
    partnerId: string;
    type: NotificationType;
    channel: NotificationChannel;
    variables: TemplateVariables;
    locale?: string;
  }): Promise<RenderedNotification> {
    // Try to find partner-specific template
    const template = await this.notificationRepo.findTemplateByTypeAndChannel({
      partnerId: params.partnerId,
      type: params.type,
      channel: params.channel,
      locale: params.locale || 'en',
    });

    if (!template) {
      throw new NotFoundException(
        `Template not found for type: ${params.type}, channel: ${params.channel}`,
      );
    }

    const subject = template.subject
      ? this.renderTemplate(template.subject, params.variables)
      : undefined;
    const body = this.renderTemplate(template.bodyTemplate, params.variables);

    return {
      subject,
      body,
      variables: params.variables,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Preference Checking
  // ───────────────────────────────────────────────────────────────────────────

  private async isDeliveryAllowed(params: {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
  }): Promise<boolean> {
    // Check if user has opted out of this notification type + channel
    const isEnabled = await this.notificationRepo.isChannelEnabled(params);

    if (!isEnabled) {
      this.logger.log(`User ${params.userId} has opted out of ${params.type} on ${params.channel}`);
    }

    return isEnabled;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Channel Delivery
  // ───────────────────────────────────────────────────────────────────────────

  private async executeChannelDelivery(params: {
    channel: NotificationChannel;
    to: string;
    subject?: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<DeliveryResult> {
    switch (params.channel) {
      case NotificationChannel.EMAIL:
        return this.emailProvider.send({
          to: params.to,
          subject: params.subject,
          body: params.body,
          data: params.data,
        });

      case NotificationChannel.IN_APP:
        // In-app notifications are just stored in database, no external delivery
        return { success: true, timestamp: new Date() };

      case NotificationChannel.SMS:
      case NotificationChannel.PUSH:
      case NotificationChannel.WHATSAPP:
        // TODO: Implement other channel providers
        this.logger.warn(`Channel ${params.channel} not implemented yet`);
        return { success: false, error: 'Not implemented', timestamp: new Date() };

      default:
        throw new BadRequestException(`Unsupported channel: ${params.channel}`);
    }
  }

  private async deliverViaChannel(params: {
    notificationId: string;
    channel: NotificationChannel;
    to: string; // Email, phone, device token
    subject?: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const result = await this.executeChannelDelivery({
        channel: params.channel,
        to: params.to,
        subject: params.subject,
        body: params.body,
        data: params.data,
      });

      if (result.success) {
        await this.notificationRepo.updateNotificationStatus({
          id: params.notificationId,
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        });

        this.logger.log(`Notification ${params.notificationId} sent via ${params.channel}`);
      } else {
        await this.notificationRepo.updateNotificationStatus({
          id: params.notificationId,
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          errorMessage: result.error,
        });

        this.logger.error(`Notification ${params.notificationId} failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.notificationRepo.updateNotificationStatus({
        id: params.notificationId,
        status: NotificationStatus.FAILED,
        failedAt: new Date(),
        errorMessage,
      });

      await this.notificationRepo.incrementRetryCount(params.notificationId);

      this.logger.error(`Failed to deliver notification ${params.notificationId}:`, error);
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Send a notification to a user (event-driven)
   * This creates the notification record and triggers async delivery
   */
  async sendNotification(params: {
    partnerId: string;
    userId: string;
    userEmail: string; // For email delivery
    type: NotificationType;
    channel: NotificationChannel;
    variables: TemplateVariables;
    eventId?: string;
    resourceType?: string;
    resourceId?: string;
  }): Promise<string> {
    // Check if delivery is allowed
    const isAllowed = await this.isDeliveryAllowed({
      userId: params.userId,
      type: params.type,
      channel: params.channel,
    });

    if (!isAllowed) {
      this.logger.log(`Skipping notification delivery (user opted out)`);
      return 'SKIPPED';
    }

    // Render template
    const rendered = await this.getRenderedNotification({
      partnerId: params.partnerId,
      type: params.type,
      channel: params.channel,
      variables: params.variables,
    });

    // Create notification record
    const notification = await this.notificationRepo.createNotification({
      partnerId: params.partnerId,
      userId: params.userId,
      type: params.type,
      channel: params.channel,
      title: rendered.subject || params.type,
      body: rendered.body,
      data: params.variables as unknown as Prisma.InputJsonValue,
      eventId: params.eventId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
    });

    // Emit event for async delivery (via background job)
    this.eventEmitter.emit('notification.deliver', {
      notificationId: notification.id,
      channel: params.channel,
      to: params.userEmail, // TODO: Get phone/device token for other channels
      subject: rendered.subject,
      body: rendered.body,
    });

    this.logger.log(`Notification queued for delivery: ${notification.id}`);
    return notification.id;
  }

  /**
   * Send notification to multiple users (batch)
   */
  async sendBatchNotification(params: {
    partnerId: string;
    userIds: string[];
    type: NotificationType;
    channels: NotificationChannel[];
    variables: TemplateVariables;
    eventId?: string;
    resourceType?: string;
    resourceId?: string;
  }): Promise<number> {
    let sentCount = 0;

    for (const userId of params.userIds) {
      for (const channel of params.channels) {
        try {
          // TODO: Get user email from database
          const userEmail = `user-${userId}@example.com`; // Placeholder

          await this.sendNotification({
            partnerId: params.partnerId,
            userId,
            userEmail,
            type: params.type,
            channel,
            variables: params.variables,
            eventId: params.eventId,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
          });

          sentCount++;
        } catch (error) {
          this.logger.error(`Failed to send notification to user ${userId}:`, error);
        }
      }
    }

    this.logger.log(`Batch notification: ${sentCount} notifications queued`);
    return sentCount;
  }

  /**
   * Process notification delivery (called by background job or event listener)
   */
  async processDelivery(params: {
    notificationId: string;
    channel: NotificationChannel;
    to: string;
    subject?: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    await this.deliverViaChannel(params);
  }

  /**
   * List user notifications (for in-app notification UI)
   */
  async listUserNotifications(params: {
    partnerId: string;
    userId: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    unreadOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    return this.notificationRepo.findNotifications({
      ...params,
      channel: params.channel || NotificationChannel.IN_APP,
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(partnerId: string, userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(partnerId, userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(partnerId: string, userId: string, notificationId: string) {
    const notification = await this.notificationRepo.findNotificationById(notificationId, partnerId);

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or access denied');
    }

    return this.notificationRepo.markAsRead(notificationId, partnerId);
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(partnerId: string, userId: string): Promise<number> {
    const result = await this.notificationRepo.markAllAsRead({
      partnerId,
      userId,
    });
    return result.count;
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(partnerId: string, userId: string) {
    return this.notificationRepo.findPreferences({ userId });
  }

  /**
   * Update notification preference
   */
  async updatePreference(params: {
    partnerId: string;
    userId: string;
    notificationType: NotificationType;
    channel: NotificationChannel;
    enabled: boolean;
  }) {
    return this.notificationRepo.upsertPreference(params);
  }
}
