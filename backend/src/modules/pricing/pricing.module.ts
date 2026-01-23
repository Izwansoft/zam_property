import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { PricingController } from './pricing.controller';
import { PricingConfigRepository } from './repositories/pricing-config.repository';
import { PricingCalculationService } from './services/pricing-calculation.service';
import { SaasPricingStrategy } from './strategies/saas-pricing.strategy';
import { LeadBasedPricingStrategy } from './strategies/lead-based-pricing.strategy';
import { CommissionPricingStrategy } from './strategies/commission-pricing.strategy';

@Module({
  imports: [DatabaseModule],
  controllers: [PricingController],
  providers: [
    // Repository
    PricingConfigRepository,

    // Services
    PricingCalculationService,

    // Strategies
    SaasPricingStrategy,
    LeadBasedPricingStrategy,
    CommissionPricingStrategy,
  ],
  exports: [PricingCalculationService, PricingConfigRepository],
})
export class PricingModule {}
