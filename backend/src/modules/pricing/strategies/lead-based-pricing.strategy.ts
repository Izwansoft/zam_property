import { Injectable, Logger } from '@nestjs/common';
import { PricingModel } from '@prisma/client';
import {
  IPricingStrategy,
  ChargeCalculationInput,
  ChargeCalculationResult,
  LeadBasedPricingConfig,
} from '../types/pricing.types';

/**
 * Lead-Based Pricing Strategy
 * Handles pay-per-lead / pay-per-interaction pricing
 */
@Injectable()
export class LeadBasedPricingStrategy implements IPricingStrategy {
  private readonly logger = new Logger(LeadBasedPricingStrategy.name);

  getModelType(): PricingModel {
    return PricingModel.LEAD_BASED;
  }

  validateConfig(config: unknown): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const leadConfig = config as LeadBasedPricingConfig;

    // Must have price per lead
    if (typeof leadConfig.pricePerLead !== 'number' || leadConfig.pricePerLead < 0) {
      return false;
    }

    // Free quota is optional but must be valid if present
    if (leadConfig.freeQuota !== undefined) {
      if (typeof leadConfig.freeQuota !== 'number' || leadConfig.freeQuota < 0) {
        return false;
      }
    }

    // Vertical pricing is optional but must be valid if present
    if (leadConfig.verticalPricing !== undefined) {
      if (typeof leadConfig.verticalPricing !== 'object') {
        return false;
      }
      // Validate all values are numbers
      for (const value of Object.values(leadConfig.verticalPricing)) {
        if (typeof value !== 'number' || value < 0) {
          return false;
        }
      }
    }

    return true;
  }

  async calculateCharge(
    config: LeadBasedPricingConfig,
    input: ChargeCalculationInput,
  ): Promise<ChargeCalculationResult> {
    this.logger.debug(`Calculating lead-based charge for event: ${input.eventType}`);

    // Only applies to interaction events
    if (!input.eventType.startsWith('interaction.created')) {
      return {
        shouldCharge: false,
        reason: 'Lead-based pricing only applies to interaction.created events',
      };
    }

    // Check vertical-specific pricing
    const verticalId = input.metadata?.verticalId as string | undefined;
    let pricePerLead = config.pricePerLead;

    if (verticalId && config.verticalPricing && config.verticalPricing[verticalId]) {
      pricePerLead = config.verticalPricing[verticalId];
      this.logger.debug(`Using vertical-specific pricing for ${verticalId}: ${pricePerLead}`);
    }

    // Check if within free quota (requires usage data from metadata)
    const currentUsage = (input.metadata?.currentUsage as number) || 0;
    const freeQuota = config.freeQuota || 0;

    if (currentUsage < freeQuota) {
      return {
        shouldCharge: false,
        reason: `Within free quota (${currentUsage}/${freeQuota})`,
        metadata: {
          currentUsage,
          freeQuota,
          remainingFree: freeQuota - currentUsage,
        },
      };
    }

    return {
      shouldCharge: true,
      chargeType: 'LEAD',
      amount: pricePerLead,
      currency: 'MYR',
      reason: `Lead charge for ${verticalId || 'default'} vertical`,
      metadata: {
        verticalId,
        pricePerLead,
        currentUsage,
        freeQuota,
        overageCount: currentUsage - freeQuota + 1,
      },
    };
  }
}
