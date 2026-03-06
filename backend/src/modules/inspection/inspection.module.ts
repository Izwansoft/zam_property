import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { StorageModule } from '@infrastructure/storage';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';

/**
 * InspectionModule
 *
 * Features:
 * - Schedule inspections (move-in, periodic, move-out, emergency)
 * - Update checklist items with condition ratings
 * - Complete inspections with overall rating
 * - Generate PDF inspection reports (PDFKit → S3)
 * - Download report via presigned URL
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    StorageModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}
