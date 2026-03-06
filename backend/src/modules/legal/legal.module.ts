import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';
import { PanelLawyerService } from './panel-lawyer.service';
import { NoticeGeneratorService } from './notice-generator.service';

/**
 * LegalModule
 * Session 8.5 - Legal Module Core
 * Session 8.6 - Legal Integration & Finalization
 *
 * Features:
 * - Create and manage legal cases (from overdue billing escalation)
 * - Panel lawyer management and case assignment (PanelLawyerService)
 * - Notice generation with templates (NoticeGeneratorService)
 * - Document upload/attachment to cases
 * - Case status transitions with validation
 * - Case resolution and settlement tracking
 * - Event-driven auto-creation on billing escalation
 * - Full flow: Overdue → Reminders → Legal case → Notice → Resolution/Court
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [LegalController],
  providers: [LegalService, PanelLawyerService, NoticeGeneratorService],
  exports: [LegalService, PanelLawyerService, NoticeGeneratorService],
})
export class LegalModule {}
