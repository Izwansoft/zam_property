import { Injectable, Logger } from '@nestjs/common';
import { PricingModel } from '@prisma/client';
import {
  IPricingStrategy,
  ChargeCalculationInput,
  ChargeCalculationResult,
  CommissionPricingConfig,
} from '../types/pricing.types';

/**
 * Commission Pricing Strategy
 * Handles percentage-based commission on transactions
 */
@Injectable()
export class CommissionPricingStrategy implements IPricingStrategy {
  private readonly logger = new Logger(CommissionPricingStrategy.name);

  getModelType(): PricingModel {
    return PricingModel.COMMISSION;
  }

  validateConfig(config: unknown): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const commissionConfig = config as CommissionPricingConfig;

    // Must have commission percentage
    if (
      typeof commissionConfig.commissionPercentage !== 'number' ||
      commissionConfig.commissionPercentage < 0 ||
      commissionConfig.commissionPercentage > 100
    ) {
      return false;
    }

    // Optional fields must be valid if present
    if (commissionConfig.minimumCommission !== undefined) {
      if (
        typeof commissionConfig.minimumCommission !== 'number' ||
        commissionConfig.minimumCommission < 0
      ) {
        return false;
      }
    }

    if (commissionConfig.maximumCommission !== undefined) {
      if (
        typeof commissionConfig.maximumCommission !== 'number' ||
        commissionConfig.maximumCommission < 0
      ) {
        return false;
      }
    }

    if (commissionConfig.flatFee !== undefined) {
      if (typeof commissionConfig.flatFee !== 'number' || commissionConfig.flatFee < 0) {
        return false;
      }
    }

    return true;
  }

  async calculateCharge(
    config: CommissionPricingConfig,
    input: ChargeCalculationInput,
  ): Promise<ChargeCalculationResult> {
    this.logger.debug(`Calculating commission charge for event: ${input.eventType}`);

    // Commission applies to booking confirmed or transaction events
    if (!input.eventType.includes('confirmed') && !input.eventType.includes('transaction')) {
      return {
        shouldCharge: false,
        reason: 'Commission pricing only applies to confirmed bookings or transactions',
      };
    }

    // Must have transaction amount
    if (!input.amount || input.amount <= 0) {
      return {
        shouldCharge: false,
        reason: 'Transaction amount required for commission calculation',
      };
    }

    // Calculate commission
    const percentageCommission = (input.amount * config.commissionPercentage) / 100;
    let commission = percentageCommission;

    // Apply minimum commission
    if (config.minimumCommission && commission < config.minimumCommission) {
      commission = config.minimumCommission;
      this.logger.debug(`Applied minimum commission: ${commission}`);
    }

    // Apply maximum commission
    if (config.maximumCommission && commission > config.maximumCommission) {
      commission = config.maximumCommission;
      this.logger.debug(`Applied maximum commission: ${commission}`);
    }

    // Add flat fee if configured (hybrid model)
    let totalCharge = commission;
    if (config.flatFee) {
      totalCharge += config.flatFee;
      this.logger.debug(`Added flat fee: ${config.flatFee}`);
    }

    return {
      shouldCharge: true,
      chargeType: 'COMMISSION',
      amount: totalCharge,
      currency: 'MYR',
      reason: `${config.commissionPercentage}% commission${config.flatFee ? ` + ${config.flatFee} flat fee` : ''}`,
      metadata: {
        transactionAmount: input.amount,
        commissionPercentage: config.commissionPercentage,
        calculatedCommission: percentageCommission,
        flatFee: config.flatFee,
        minimumApplied: config.minimumCommission && commission === config.minimumCommission,
        maximumApplied: config.maximumCommission && commission === config.maximumCommission,
      },
    };
  }
}
