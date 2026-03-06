import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { StorageModule } from '@infrastructure/storage';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';

/**
 * ClaimModule
 *
 * Features:
 * - Submit claims (damage, cleaning, missing item, utility, other)
 * - Upload evidence (photos, videos, receipts, quotes) via S3 presigned URLs
 * - Review claims (approve, partially approve, reject)
 * - Dispute claim decisions
 * - Link claims to maintenance tickets
 * - Claims from both owners and tenants
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    StorageModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [ClaimController],
  providers: [ClaimService],
  exports: [ClaimService],
})
export class ClaimModule {}
