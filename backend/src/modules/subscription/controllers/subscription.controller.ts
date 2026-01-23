import { Controller, Get, Post, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { EntitlementService } from '../services/entitlement.service';
import { UsageService } from '../services/usage.service';
import {
  AssignSubscriptionDto,
  UpdateSubscriptionStatusDto,
  ChangePlanDto,
} from '../dto/subscription.dto';
import { randomUUID } from 'crypto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly entitlementService: EntitlementService,
    private readonly usageService: UsageService,
  ) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant subscription' })
  async getCurrent() {
    const subscription = await this.subscriptionService.getCurrent();

    return {
      data: subscription,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign subscription to current tenant' })
  async assign(@Body() dto: AssignSubscriptionDto) {
    const currentPeriodStart = dto.currentPeriodStart
      ? new Date(dto.currentPeriodStart)
      : new Date();

    const currentPeriodEnd = dto.currentPeriodEnd
      ? new Date(dto.currentPeriodEnd)
      : new Date(new Date().setMonth(new Date().getMonth() + 1));

    const subscription = await this.subscriptionService.assign({
      tenantId: '', // Will be set by TenantContextService
      planId: dto.planId,
      currentPeriodStart,
      currentPeriodEnd,
      externalId: dto.externalId,
      externalProvider: dto.externalProvider,
      overrides: dto.overrides,
    });

    return {
      data: subscription,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update subscription status' })
  async updateStatus(@Body() dto: UpdateSubscriptionStatusDto) {
    const subscription = await this.subscriptionService.updateStatus(dto.status);

    return {
      data: subscription,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Post('change-plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  async changePlan(@Body() dto: ChangePlanDto) {
    const subscription = await this.subscriptionService.changePlan({
      newPlanId: dto.newPlanId,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
    });

    return {
      data: subscription,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  async cancel() {
    const subscription = await this.subscriptionService.cancel();

    return {
      data: subscription,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Get('entitlements')
  @ApiOperation({ summary: 'Get resolved entitlements for current tenant' })
  async getEntitlements() {
    const entitlements = await this.entitlementService.resolve();

    return {
      data: entitlements,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage summary for current tenant' })
  async getUsage() {
    const usage = await this.usageService.getAllCurrent();

    return {
      data: usage,
      meta: {
        requestId: randomUUID(),
      },
    };
  }
}
