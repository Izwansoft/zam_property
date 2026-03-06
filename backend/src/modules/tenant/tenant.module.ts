import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { StorageModule } from '@infrastructure/storage';
import { PartnerContextModule } from '@core/partner-context';

import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantRepository } from './tenant.repository';
import { TenantGuard } from './guards';

@Module({
  imports: [DatabaseModule, PartnerContextModule, StorageModule],
  controllers: [TenantController],
  providers: [TenantService, TenantRepository, TenantGuard],
  exports: [TenantService, TenantRepository],
})
export class TenantModule {}
