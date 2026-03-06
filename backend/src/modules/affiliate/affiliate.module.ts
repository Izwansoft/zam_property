import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { AffiliateController } from './affiliate.controller';
import { AffiliateService } from './affiliate.service';

/**
 * AffiliateModule
 * Session 8.4 - Affiliate Module
 *
 * Features:
 * - Register affiliates with unique referral codes
 * - Track referrals (OWNER_REGISTRATION, TENANT_BOOKING, AGENT_SIGNUP)
 * - Confirm referrals and calculate earnings
 * - Process payouts for unpaid commissions
 * - Event-driven auto-tracking on vendor approval and tenancy activation
 * - Configurable commission rates per referral type
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AffiliateController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
