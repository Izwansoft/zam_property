import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { DatabaseModule } from '../database/database.module';
import { QueueService } from './queue.service';
import { SchedulerService } from './scheduler.service';
import { JobMonitorController } from './job-monitor.controller';
import { QUEUE_NAMES } from './queue.constants';

/**
 * Queue module providing BullMQ job queue infrastructure.
 * This module is global so QueueService is available throughout the app.
 *
 * Per part-31.md:
 * - Uses BullMQ for job queues (Redis-backed)
 * - Supports job priorities, retries, and scheduling
 * - Provides scheduler for cron jobs
 * - Provides admin endpoints for job monitoring
 */
@Global()
@Module({
  imports: [
    RedisModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
    }),
    // Register individual queues
    BullModule.registerQueue(
      { name: QUEUE_NAMES.MEDIA_PROCESS },
      { name: QUEUE_NAMES.SEARCH_INDEX },
      { name: QUEUE_NAMES.NOTIFICATION_SEND },
      { name: QUEUE_NAMES.BILLING_PROCESS },
      { name: QUEUE_NAMES.CLEANUP_PROCESS },
      { name: QUEUE_NAMES.ANALYTICS_PROCESS },
      { name: QUEUE_NAMES.DATA_TRANSFER },
      { name: 'listing.expire' },
    ),
  ],
  controllers: [JobMonitorController],
  providers: [QueueService, SchedulerService],
  exports: [QueueService, SchedulerService],
})
export class QueueModule implements OnModuleDestroy {
  constructor(private readonly queueService: QueueService) {}

  async onModuleDestroy(): Promise<void> {
    await this.queueService.closeAll();
  }
}
