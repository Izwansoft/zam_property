/**
 * Vertical Module
 * Part 8 - Vertical Module Contract
 */

import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/infrastructure/database';
import { TenantContextModule } from '@core/tenant-context';

import { VerticalDefinitionRepository, TenantVerticalRepository } from './repositories';
import { VerticalService } from './services';
import { VerticalDefinitionController, TenantVerticalController } from './controllers';
import { VerticalGuard, AnyVerticalGuard } from './guards';

@Module({
  imports: [DatabaseModule, TenantContextModule],
  controllers: [VerticalDefinitionController, TenantVerticalController],
  providers: [
    // Repositories
    VerticalDefinitionRepository,
    TenantVerticalRepository,
    // Services
    VerticalService,
    // Guards
    VerticalGuard,
    AnyVerticalGuard,
  ],
  exports: [
    VerticalService,
    VerticalDefinitionRepository,
    TenantVerticalRepository,
    VerticalGuard,
    AnyVerticalGuard,
  ],
})
export class VerticalModule {}
