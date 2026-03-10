/**
 * Vertical Module
 * Part 8 - Vertical Module Contract
 */

import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '@/infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';

import { VerticalDefinitionRepository, PartnerVerticalRepository } from './repositories';
import { VerticalService, VerticalRegistryService } from './services';
import { VerticalDefinitionController, PartnerVerticalController } from './controllers';
import { VerticalGuard, AnyVerticalGuard } from './guards';

@Global() // Make VerticalRegistryService globally available
@Module({
  imports: [DatabaseModule, PartnerContextModule],
  controllers: [VerticalDefinitionController, PartnerVerticalController],
  providers: [
    // Repositories
    VerticalDefinitionRepository,
    PartnerVerticalRepository,
    // Services
    VerticalService,
    VerticalRegistryService,
    // Guards
    VerticalGuard,
    AnyVerticalGuard,
  ],
  exports: [
    VerticalService,
    VerticalRegistryService,
    VerticalDefinitionRepository,
    PartnerVerticalRepository,
    VerticalGuard,
    AnyVerticalGuard,
  ],
})
export class VerticalModule {}
