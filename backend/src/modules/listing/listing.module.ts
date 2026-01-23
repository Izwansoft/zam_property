import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { TenantContextModule } from '@core/tenant-context';
import { ValidationModule } from '@core/validation';
import { ListingStateMachine } from '@core/workflows';

import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { ListingRepository } from './listing.repository';
import { ListingValidationHelper } from './helpers';

@Module({
  imports: [DatabaseModule, TenantContextModule, ValidationModule],
  controllers: [ListingController],
  providers: [ListingService, ListingRepository, ListingStateMachine, ListingValidationHelper],
  exports: [ListingService, ListingRepository, ListingValidationHelper],
})
export class ListingModule {}
