import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PlanRepository } from '../repositories/plan.repository';
import { PartnerContextService } from '@core/partner-context/partner-context.service';
import {
  CreateSubscriptionParams,
  ChangePlanParams,
  SubscriptionRecord,
} from '../types/subscription.types';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    private readonly PartnerContext: PartnerContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Assign a subscription to current partner
   */
  async assign(params: CreateSubscriptionParams): Promise<SubscriptionRecord> {
    const partnerId = this.PartnerContext.partnerId;

    // Check if partner already has a subscription
    const existing = await this.subscriptionRepository.findBypartnerId(partnerId);
    if (existing) {
      throw new ConflictException('Partner already has an active subscription');
    }

    // Verify plan exists and is active
    const plan = await this.planRepository.findById(params.planId);
    if (!plan) {
      throw new NotFoundException(`Plan with ID '${params.planId}' not found`);
    }
    if (!plan.isActive) {
      throw new BadRequestException('Cannot assign inactive plan');
    }

    const subscription = await this.subscriptionRepository.create(params);

    this.eventEmitter.emit('subscription.created', {
      partnerId,
      subscriptionId: subscription.id,
      planId: params.planId,
    });

    this.logger.log(`Subscription created for partner ${partnerId}`);

    return subscription;
  }

  /**
   * Get current partner's subscription
   */
  async getCurrent(): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository.findCurrent();
    if (!subscription) {
      throw new NotFoundException('No active subscription found for partner');
    }
    return subscription;
  }

  /**
   * Get subscription by partner ID (admin only)
   */
  async getBypartnerId(partnerId: string): Promise<SubscriptionRecord> {
    const subscription = await this.subscriptionRepository.findBypartnerId(partnerId);
    if (!subscription) {
      throw new NotFoundException(`No subscription found for partner ${partnerId}`);
    }
    return subscription;
  }

  /**
   * Update subscription status
   */
  async updateStatus(status: SubscriptionStatus): Promise<SubscriptionRecord> {
    const partnerId = this.PartnerContext.partnerId;

    // Verify subscription exists
    await this.getCurrent();

    // Validate status transition
    const currentSubscription = await this.subscriptionRepository.findCurrent();
    this.validateStatusTransition(currentSubscription!.status, status);

    const subscription = await this.subscriptionRepository.updateStatus(partnerId, status);

    this.eventEmitter.emit('subscription.status_changed', {
      partnerId,
      subscriptionId: subscription.id,
      oldStatus: currentSubscription!.status,
      newStatus: status,
    });

    this.logger.log(`Subscription status updated for partner ${partnerId}: ${status}`);

    return subscription;
  }

  /**
   * Change plan
   */
  async changePlan(params: ChangePlanParams): Promise<SubscriptionRecord> {
    const partnerId = this.PartnerContext.partnerId;

    // Verify current subscription exists
    const currentSubscription = await this.getCurrent();

    // Verify new plan exists and is active
    const newPlan = await this.planRepository.findById(params.newPlanId);
    if (!newPlan) {
      throw new NotFoundException(`Plan with ID '${params.newPlanId}' not found`);
    }
    if (!newPlan.isActive) {
      throw new BadRequestException('Cannot switch to inactive plan');
    }

    // Prevent switching to the same plan
    if (currentSubscription.planId === params.newPlanId) {
      throw new BadRequestException('Already subscribed to this plan');
    }

    const effectiveDate = params.effectiveDate || new Date();

    const subscription = await this.subscriptionRepository.changePlan(
      partnerId,
      params.newPlanId,
      effectiveDate,
    );

    this.eventEmitter.emit('subscription.plan_changed', {
      partnerId,
      subscriptionId: subscription.id,
      oldPlanId: currentSubscription.planId,
      newPlanId: params.newPlanId,
      effectiveDate,
    });

    this.logger.log(
      `Subscription plan changed for partner ${partnerId}: ${currentSubscription.planId} -> ${params.newPlanId}`,
    );

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancel(): Promise<SubscriptionRecord> {
    const partnerId = this.PartnerContext.partnerId;

    // Verify subscription exists
    await this.getCurrent();

    const subscription = await this.subscriptionRepository.cancel(partnerId);

    this.eventEmitter.emit('subscription.cancelled', {
      partnerId,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      cancelledAt: subscription.cancelledAt,
    });

    this.logger.log(`Subscription cancelled for partner ${partnerId}`);

    return subscription;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(current: SubscriptionStatus, next: SubscriptionStatus): void {
    const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
      [SubscriptionStatus.ACTIVE]: [
        SubscriptionStatus.PAST_DUE,
        SubscriptionStatus.PAUSED,
        SubscriptionStatus.CANCELLED,
      ],
      [SubscriptionStatus.PAST_DUE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
      [SubscriptionStatus.PAUSED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
      [SubscriptionStatus.CANCELLED]: [], // terminal state
    };

    const allowed = validTransitions[current] || [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
    }
  }
}
