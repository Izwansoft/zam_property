import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';

/**
 * CommissionModule
 * Session 8.3 - Agent Commission
 *
 * Features:
 * - Calculate commissions from tenancy deals
 * - Approve and mark commissions as paid
 * - Auto-create BOOKING commission on tenancy activation
 * - Auto-create RENEWAL commission on contract renewal
 * - Agent commission summary/stats
 * - Configurable rates (default: 1 month BOOKING, 0.5 month RENEWAL)
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
