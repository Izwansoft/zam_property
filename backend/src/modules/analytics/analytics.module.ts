import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { EventsModule } from '@infrastructure/events';
import { QueueModule } from '@infrastructure/queue';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsListeners } from './listeners/analytics.listeners';

@Module({
  imports: [DatabaseModule, EventsModule, QueueModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsListeners],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
