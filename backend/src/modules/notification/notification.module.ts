import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '../../database/database.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { SendGridEmailProvider } from './providers/sendgrid-email.provider';
import {
  ListingNotificationHandler,
  InteractionNotificationHandler,
  ReviewNotificationHandler,
  SubscriptionNotificationHandler,
  BillingNotificationHandler,
  NotificationDeliveryHandler,
} from './listeners/notification.handlers';

/**
 * Notification module - Event-driven, multi-channel notification system
 *
 * Features:
 * - Template-driven messaging (Handlebars)
 * - Multi-channel delivery (EMAIL, IN_APP, SMS, PUSH, WhatsApp)
 * - Event-driven notifications (async, non-blocking)
 * - User preference management (opt-out model)
 * - Tenant-customizable templates
 *
 * Architecture:
 * - Domain events → Notification handlers
 * - Handlers → NotificationService.sendNotification()
 * - Service → Creates notification + emits 'notification.deliver' event
 * - Delivery handler → Processes delivery via channel providers
 */
@Module({
  imports: [DatabaseModule, EventEmitterModule],
  controllers: [NotificationController],
  providers: [
    // Repositories
    NotificationRepository,

    // Services
    NotificationService,

    // Email providers
    SmtpEmailProvider,
    SendGridEmailProvider,

    // Event handlers (domain event listeners)
    ListingNotificationHandler,
    InteractionNotificationHandler,
    ReviewNotificationHandler,
    SubscriptionNotificationHandler,
    BillingNotificationHandler,

    // Delivery handler (processes actual delivery)
    NotificationDeliveryHandler,
  ],
  exports: [NotificationService], // Export for use in other modules
})
export class NotificationModule {}
