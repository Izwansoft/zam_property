import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { RentPaymentModule } from '@modules/payment';

import { TenancyController } from './tenancy.controller';
import { TenancyService } from './tenancy.service';
import { TenancyRepository } from './tenancy.repository';
import { TenancyStateMachine } from './tenancy.state-machine';
import { TenancyGuard } from './guards';

@Module({
  imports: [
    DatabaseModule,
    PartnerContextModule,
    EventEmitterModule.forRoot(),
    RentPaymentModule,
  ],
  controllers: [TenancyController],
  providers: [
    TenancyService,
    TenancyRepository,
    TenancyStateMachine,
    TenancyGuard,
  ],
  exports: [TenancyService, TenancyRepository],
})
export class TenancyModule {}
