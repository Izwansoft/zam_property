import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';

import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { DepositEventListeners } from './deposit.listeners';

/**
 * Module for managing tenant deposits (security, utility, key)
 *
 * Features:
 * - Create deposits for tenancies
 * - Track deposit collection
 * - Manage deductions from claims
 * - Process deposit refunds
 * - Support partial/full refunds
 * - Forfeit deposits
 * - Auto-finalize deposits on tenancy termination
 */
@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [DepositController],
  providers: [DepositService, DepositEventListeners],
  exports: [DepositService],
})
export class DepositModule {}
