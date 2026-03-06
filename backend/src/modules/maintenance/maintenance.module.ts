import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { StorageModule } from '@infrastructure/storage';

import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceStateMachine } from './maintenance.state-machine';

/**
 * Module for managing maintenance tickets
 *
 * Features:
 * - Create and track maintenance tickets
 * - Attach photos/videos/documents via S3 presigned URLs
 * - Internal and public comments/updates
 * - Priority and category-based filtering
 * - Role-based access (tenants see own tickets only)
 * - Event-driven notifications on status changes
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    StorageModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceStateMachine],
  exports: [MaintenanceService, MaintenanceStateMachine],
})
export class MaintenanceModule {}
