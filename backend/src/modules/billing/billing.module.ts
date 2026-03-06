import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';

import { RentBillingService } from './billing.service';
import { RentBillingController } from './billing.controller';
import { BillingEventListeners } from './billing.listeners';
import { ReminderService } from './reminder';

/**
 * Module for managing rent billing (invoice generation, line items, late fees, PDF)
 *
 * Features:
 * - Generate monthly billing statements for tenancies
 * - Add line items (rent, utility, late fees, claim deductions, other)
 * - Calculate late fees based on overdue balances
 * - Generate PDF billing statements
 * - Track billing status (DRAFT → GENERATED → SENT → PAID/OVERDUE → WRITTEN_OFF)
 * - Filter and paginate billing statements
 * - Payment reminders with 4-tier escalation schedule
 * - Auto-generate initial bill on tenancy activation
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [RentBillingController],
  providers: [RentBillingService, ReminderService, BillingEventListeners],
  exports: [RentBillingService, ReminderService],
})
export class RentBillingModule {}
