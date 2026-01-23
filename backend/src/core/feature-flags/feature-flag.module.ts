import { Module } from '@nestjs/common';

import { DatabaseModule } from '@infrastructure/database';
import { CacheModule } from '@infrastructure/cache';
import { TenantContextModule } from '@core/tenant-context';

import { FeatureFlagAdminController } from './feature-flag-admin.controller';
import { ExperimentAdminController } from './experiment-admin.controller';
import { FeatureFlagService } from './feature-flag.service';
import { ExperimentService } from './experiment.service';
import { FeatureFlagGuard } from './guards/feature-flag.guard';

@Module({
  imports: [DatabaseModule, CacheModule, TenantContextModule],
  controllers: [FeatureFlagAdminController, ExperimentAdminController],
  providers: [FeatureFlagService, ExperimentService, FeatureFlagGuard],
  exports: [FeatureFlagService, ExperimentService, FeatureFlagGuard],
})
export class FeatureFlagModule {}
