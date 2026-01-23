import { Injectable, Logger } from '@nestjs/common';
import { PricingModel } from '@prisma/client';
import {
  IPricingStrategy,
  ChargeCalculationInput,
  ChargeCalculationResult,
  SaasPricingConfig,
} from '../types/pricing.types';

/**
 * SaaS Pricing Strategy
 * Handles flat-fee subscription pricing
 */
@Injectable()
export class SaasPricingStrategy implements IPricingStrategy {
  private readonly logger = new Logger(SaasPricingStrategy.name);

  getModelType(): PricingModel {
    return PricingModel.SAAS;
  }

  validateConfig(config: unknown): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const saasConfig = config as SaasPricingConfig;

    // Must have at least monthly fee
    if (typeof saasConfig.monthlyFee !== 'number' || saasConfig.monthlyFee < 0) {
      return false;
    }

    // Yearly fee is optional but must be valid if present
    if (saasConfig.yearlyFee !== undefined) {
      if (typeof saasConfig.yearlyFee !== 'number' || saasConfig.yearlyFee < 0) {
        return false;
      }
    }

    // Features must be an array if present
    if (saasConfig.features !== undefined) {
      if (!Array.isArray(saasConfig.features)) {
        return false;
      }
    }

    return true;
  }

  async calculateCharge(
    config: SaasPricingConfig,
    input: ChargeCalculationInput,
  ): Promise<ChargeCalculationResult> {
    this.logger.debug(`Calculating SaaS charge for event: ${input.eventType}`);

    // SaaS pricing typically applies to subscription events
    if (!input.eventType.startsWith('subscription.')) {
      return {
        shouldCharge: false,
        reason: 'SaaS pricing only applies to subscription events',
      };
    }

    // Determine if monthly or yearly
    const isYearlySubscription = input.metadata?.period === 'yearly';
    const amount = isYearlySubscription && config.yearlyFee ? config.yearlyFee : config.monthlyFee;

    return {
      shouldCharge: true,
      chargeType: 'SUBSCRIPTION',
      amount,
      currency: 'MYR',
      reason: `SaaS ${isYearlySubscription ? 'yearly' : 'monthly'} subscription fee`,
      metadata: {
        period: isYearlySubscription ? 'yearly' : 'monthly',
        features: config.features,
      },
    };
  }
}
