import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '../../redis/redis.module';
import { StorageModule } from '../../storage/storage.module';
import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { QUEUE_NAMES } from '../queue.constants';
import { MediaProcessor } from './media.processor';
import { NotificationProcessor } from './notification.processor';
import { ListingExpireProcessor } from './listing-expire.processor';
import { AnalyticsProcessor } from './analytics.processor';
import { CleanupProcessor } from './cleanup.processor';
import { TenancyExpiryProcessor } from './tenancy-expiry.processor';
import { BillingProcessor } from './billing.processor';

/**
 * Processors module for registering all queue processors.
 *
 * This module is separate from QueueModule to avoid circular dependencies
 * and to allow processors to have their own dependencies.
 *
 * Note: SearchIndexProcessor is registered in SearchModule.
 */
@Module({
  imports: [
    RedisModule,
    StorageModule,
    DatabaseModule,
    EventsModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.MEDIA_PROCESS },
      { name: QUEUE_NAMES.NOTIFICATION_SEND },
      { name: QUEUE_NAMES.CLEANUP_PROCESS },
      { name: QUEUE_NAMES.ANALYTICS_PROCESS },
      { name: QUEUE_NAMES.BILLING_PROCESS },
      { name: 'listing.expire' },
      { name: 'tenancy.expiry' },
    ),
  ],
  providers: [
    MediaProcessor,
    NotificationProcessor,
    ListingExpireProcessor,
    AnalyticsProcessor,
    CleanupProcessor,
    TenancyExpiryProcessor,
    BillingProcessor,
  ],
  exports: [
    MediaProcessor,
    NotificationProcessor,
    ListingExpireProcessor,
    AnalyticsProcessor,
    CleanupProcessor,
    TenancyExpiryProcessor,
    BillingProcessor,
  ],
})
export class ProcessorsModule {}
