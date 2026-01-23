import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PricingModel } from '@prisma/client';
import { PricingConfigRepository } from '../repositories/pricing-config.repository';
import { SaasPricingStrategy } from '../strategies/saas-pricing.strategy';
import { LeadBasedPricingStrategy } from '../strategies/lead-based-pricing.strategy';
import { CommissionPricingStrategy } from '../strategies/commission-pricing.strategy';
import {
  IPricingStrategy,
  ChargeCalculationInput,
  ChargeCalculationResult,
  PricingConfigData,
  PricingRuleConditions,
} from '../types/pricing.types';

/**
 * Pricing Calculation Service
 * Orchestrates pricing strategies and calculates charges
 */
@Injectable()
export class PricingCalculationService {
  private readonly logger = new Logger(PricingCalculationService.name);
  private readonly strategies: Map<PricingModel, IPricingStrategy>;

  constructor(
    private readonly pricingRepo: PricingConfigRepository,
    private readonly saasStrategy: SaasPricingStrategy,
    private readonly leadBasedStrategy: LeadBasedPricingStrategy,
    private readonly commissionStrategy: CommissionPricingStrategy,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Register all strategies
    this.strategies = new Map();
    this.strategies.set(PricingModel.SAAS, saasStrategy);
    this.strategies.set(PricingModel.LEAD_BASED, leadBasedStrategy);
    this.strategies.set(PricingModel.COMMISSION, commissionStrategy);
  }

  /**
   * Calculate charge for given event
   */
  async calculateChargeForEvent(
    tenantId: string,
    input: ChargeCalculationInput,
  ): Promise<ChargeCalculationResult> {
    this.logger.debug(`Calculating charge for tenant ${tenantId}, event: ${input.eventType}`);

    // Get active pricing configs for this tenant and event type
    const configs = await this.pricingRepo.findActiveConfigs(tenantId, input.eventType);

    if (configs.length === 0) {
      this.logger.debug(`No active pricing configs for event: ${input.eventType}`);
      return {
        shouldCharge: false,
        reason: 'No active pricing configuration found',
      };
    }

    // Process each config and its rules
    for (const config of configs) {
      for (const rule of config.rules) {
        // Check if rule matches event type
        if (rule.eventType !== input.eventType) {
          continue;
        }

        // Check rule conditions
        if (rule.conditions) {
          const conditions = rule.conditions as PricingRuleConditions;
          if (!this.matchesConditions(conditions, input)) {
            continue;
          }
        }

        // Get strategy for this pricing model
        const strategy = this.strategies.get(config.model);
        if (!strategy) {
          this.logger.warn(`No strategy found for pricing model: ${config.model}`);
          continue;
        }

        // Calculate charge using strategy
        const result = await strategy.calculateCharge(
          config.config as unknown as PricingConfigData,
          input,
        );

        if (result.shouldCharge) {
          // Enrich result with config/rule IDs
          result.pricingConfigId = config.id;
          result.pricingRuleId = rule.id;

          // Create charge event
          await this.createChargeEvent(tenantId, input, result);

          return result;
        }
      }
    }

    return {
      shouldCharge: false,
      reason: 'No matching pricing rule found',
    };
  }

  /**
   * Create charge event
   */
  async createChargeEvent(
    tenantId: string,
    input: ChargeCalculationInput,
    result: ChargeCalculationResult,
  ): Promise<void> {
    if (!result.shouldCharge || !result.chargeType || !result.amount) {
      return;
    }

    await this.pricingRepo.createChargeEvent({
      tenantId,
      chargeType: result.chargeType,
      amount: result.amount,
      currency: result.currency || 'MYR',
      eventType: input.eventType,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      pricingConfigId: result.pricingConfigId,
      pricingRuleId: result.pricingRuleId,
      metadata: {
        ...input.metadata,
        ...result.metadata,
        reason: result.reason,
      },
    });

    // Emit domain event
    this.eventEmitter.emit('charge.created', {
      tenantId,
      chargeType: result.chargeType,
      amount: result.amount,
      currency: result.currency,
      eventType: input.eventType,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    });

    this.logger.log(
      `Created charge: ${result.chargeType} - ${result.amount} ${result.currency} for ${input.resourceType}:${input.resourceId}`,
    );
  }

  /**
   * Check if input matches rule conditions
   */
  private matchesConditions(
    conditions: PricingRuleConditions,
    input: ChargeCalculationInput,
  ): boolean {
    // Check vertical filter
    if (conditions.verticalId) {
      const inputVertical = input.metadata?.verticalId as string | undefined;
      if (inputVertical !== conditions.verticalId) {
        return false;
      }
    }

    // Check listing type filter
    if (conditions.listingType) {
      const inputListingType = input.metadata?.listingType as string | undefined;
      if (inputListingType !== conditions.listingType) {
        return false;
      }
    }

    // Check interaction type filter
    if (conditions.interactionType) {
      const inputInteractionType = input.metadata?.interactionType as string | undefined;
      if (inputInteractionType !== conditions.interactionType) {
        return false;
      }
    }

    // Check amount range
    if (input.amount !== undefined) {
      if (conditions.minAmount && input.amount < conditions.minAmount) {
        return false;
      }
      if (conditions.maxAmount && input.amount > conditions.maxAmount) {
        return false;
      }
    }

    // All conditions matched
    return true;
  }

  /**
   * Validate pricing configuration
   */
  validatePricingConfig(model: PricingModel, config: unknown): void {
    const strategy = this.strategies.get(model);

    if (!strategy) {
      throw new BadRequestException(`Invalid pricing model: ${model}`);
    }

    if (!strategy.validateConfig(config)) {
      throw new BadRequestException(`Invalid configuration for ${model} pricing model`);
    }
  }

  /**
   * Get charge summary for tenant
   */
  async getChargeSummary(tenantId: string): Promise<{
    totalPending: number;
    totalProcessed: number;
    breakdownByType: Record<string, number>;
  }> {
    return this.pricingRepo.getChargeSummary(tenantId);
  }
}
