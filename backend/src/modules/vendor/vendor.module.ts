import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { TenantContextModule } from '@core/tenant-context';
import { VendorStateMachine } from '@core/workflows';

import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { VendorRepository } from './vendor.repository';

@Module({
  imports: [DatabaseModule, TenantContextModule],
  controllers: [VendorController],
  providers: [VendorService, VendorRepository, VendorStateMachine],
  exports: [VendorService, VendorRepository],
})
export class VendorModule {}
