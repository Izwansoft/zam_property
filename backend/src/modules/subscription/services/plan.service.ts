import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlanRepository } from '../repositories/plan.repository';
import {
  CreatePlanParams,
  UpdatePlanParams,
  FindManyPlansParams,
  PlanRecord,
  PlanEntitlements,
} from '../types/subscription.types';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(
    private readonly planRepository: PlanRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new plan
   */
  async create(params: CreatePlanParams): Promise<PlanRecord> {
    // Check if slug already exists
    const existing = await this.planRepository.findBySlug(params.slug);
    if (existing) {
      throw new ConflictException(`Plan with slug '${params.slug}' already exists`);
    }

    // Validate entitlements structure
    this.validateEntitlements(params.entitlements);

    const plan = await this.planRepository.create(params);

    this.eventEmitter.emit('plan.created', {
      planId: plan.id,
      slug: plan.slug,
      name: plan.name,
    });

    this.logger.log(`Plan created: ${plan.id} (${plan.slug})`);

    return plan;
  }

  /**
   * Find all plans with pagination
   */
  async findAll(params: FindManyPlansParams = {}): Promise<{ data: PlanRecord[]; total: number }> {
    return this.planRepository.findMany(params);
  }

  /**
   * Find plan by ID
   */
  async findById(id: string): Promise<PlanRecord> {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Plan with ID '${id}' not found`);
    }
    return plan;
  }

  /**
   * Find plan by slug
   */
  async findBySlug(slug: string): Promise<PlanRecord> {
    const plan = await this.planRepository.findBySlug(slug);
    if (!plan) {
      throw new NotFoundException(`Plan with slug '${slug}' not found`);
    }
    return plan;
  }

  /**
   * Update plan
   */
  async update(id: string, params: UpdatePlanParams): Promise<PlanRecord> {
    // Verify plan exists
    await this.findById(id);

    // Validate entitlements if provided
    if (params.entitlements) {
      this.validateEntitlements(params.entitlements);
    }

    const plan = await this.planRepository.update(id, params);

    this.eventEmitter.emit('plan.updated', {
      planId: plan.id,
      slug: plan.slug,
      changes: params,
    });

    this.logger.log(`Plan updated: ${plan.id}`);

    return plan;
  }

  /**
   * Activate a plan
   */
  async activate(id: string): Promise<PlanRecord> {
    await this.findById(id);
    const plan = await this.planRepository.activate(id);

    this.eventEmitter.emit('plan.activated', {
      planId: plan.id,
      slug: plan.slug,
    });

    this.logger.log(`Plan activated: ${plan.id}`);

    return plan;
  }

  /**
   * Deactivate a plan
   */
  async deactivate(id: string): Promise<PlanRecord> {
    await this.findById(id);

    // Check if any active subscriptions exist
    const activeSubscriptions = await this.planRepository.countSubscriptions(id);
    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot deactivate plan with ${activeSubscriptions} active subscription(s)`,
      );
    }

    const plan = await this.planRepository.deactivate(id);

    this.eventEmitter.emit('plan.deactivated', {
      planId: plan.id,
      slug: plan.slug,
    });

    this.logger.log(`Plan deactivated: ${plan.id}`);

    return plan;
  }

  /**
   * Delete a plan (soft delete via deactivation)
   */
  async delete(id: string): Promise<PlanRecord> {
    return this.deactivate(id);
  }

  /**
   * Validate entitlements structure
   */
  private validateEntitlements(entitlements: PlanEntitlements | Record<string, unknown>): void {
    // Basic validation - ensure it's a valid object
    if (!entitlements || typeof entitlements !== 'object') {
      throw new BadRequestException('Entitlements must be a valid object');
    }

    const ent = entitlements as PlanEntitlements;

    // Optional: Add more specific validation rules here
    // For example, check that listing limits are positive numbers
    if (ent.listings) {
      const listings = ent.listings;

      if (listings.limit !== undefined && listings.limit < 0) {
        throw new BadRequestException('Listing limit must be non-negative');
      }

      if (listings.verticals) {
        Object.values(listings.verticals).forEach((limit) => {
          if (typeof limit !== 'number' || limit < 0) {
            throw new BadRequestException('Vertical listing limits must be non-negative numbers');
          }
        });
      }
    }
  }
}
