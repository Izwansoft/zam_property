/**
 * Vertical Module
 * Part 8 - Vertical Module Contract
 */

import { Module } from '@nestjs/common';

import { DatabaseModule } from '@/infrastructure/database';
import { PartnerContextModule } from '@core/partner-context';

import { VerticalDefinitionRepository, PartnerVerticalRepository } from './repositories';
import { VerticalService } from './services';
import { VerticalDefinitionController, PartnerVerticalController } from './controllers';
import { VerticalGuard, AnyVerticalGuard } from './guards';

@Module({
  imports: [DatabaseModule, PartnerContextModule],
  controllers: [VerticalDefinitionController, PartnerVerticalController],
  providers: [
    // Repositories
    VerticalDefinitionRepository,
    PartnerVerticalRepository,
    // Services
    VerticalService,
    // Guards
    VerticalGuard,
    AnyVerticalGuard,
  ],
  exports: [
    VerticalService,
    VerticalDefinitionRepository,
    PartnerVerticalRepository,
    VerticalGuard,
    AnyVerticalGuard,
  ],
})
export class VerticalModule {}
