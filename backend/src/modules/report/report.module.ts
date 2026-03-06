import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';

import { ReportService } from './report.service';
import { ReportController } from './report.controller';

/**
 * Module for financial reports
 *
 * Provides aggregated financial reporting:
 * - Revenue report (platform fee income from payouts)
 * - Collection report (billed vs collected rent)
 * - Outstanding report (unpaid / overdue bills with aging)
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
