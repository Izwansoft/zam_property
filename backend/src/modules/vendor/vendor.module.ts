import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';
import { VendorStateMachine } from '@core/workflows';

import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { VendorRepository } from './vendor.repository';

@Module({
  imports: [DatabaseModule, PartnerContextModule],
  controllers: [VendorController],
  providers: [VendorService, VendorRepository, VendorStateMachine],
  exports: [VendorService, VendorRepository],
})
export class VendorModule {}
