import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';

import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';

/**
 * Module for managing owner payouts
 *
 * Features:
 * - Calculate gross rental from completed payments for a period
 * - Deduct platform fees (configurable percentage)
 * - Generate payout records with detailed line items
 * - Track payout status (PENDING → CALCULATED → APPROVED → PROCESSING → COMPLETED/FAILED)
 * - Filter and paginate payouts by owner, status, and period
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
