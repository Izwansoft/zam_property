import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { PricingConfigRepository } from './repositories/pricing-config.repository';
import { PricingCalculationService } from './services/pricing-calculation.service';
import {
  CreatePricingConfigDto,
  UpdatePricingConfigDto,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  CalculateChargeDto,
  ListPricingConfigsDto,
  ListChargeEventsDto,
  PricingConfigResponseDto,
  ChargeCalculationResponseDto,
} from './dto/pricing.dto';

@ApiTags('Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/pricing')
export class PricingController {
  private readonly logger = new Logger(PricingController.name);

  constructor(
    private readonly pricingRepo: PricingConfigRepository,
    private readonly calculationService: PricingCalculationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // PRICING CONFIG ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('configs')
  @ApiOperation({ summary: 'Create pricing configuration' })
  @ApiResponse({ status: 201, type: PricingConfigResponseDto })
  async createConfig(@Body() dto: CreatePricingConfigDto) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context

    // Validate configuration
    this.calculationService.validatePricingConfig(dto.model, dto.config);

    const config = await this.pricingRepo.createConfig({
      tenantId,
      model: dto.model,
      name: dto.name,
      description: dto.description,
      config: dto.config as Prisma.InputJsonValue,
      verticalId: dto.verticalId,
      isActive: dto.isActive,
    });

    this.logger.log(`Created pricing config: ${config.id} for tenant: ${tenantId}`);
    return config;
  }

  @Get('configs')
  @ApiOperation({ summary: 'List pricing configurations' })
  @ApiResponse({ status: 200 })
  async listConfigs(@Query() query: ListPricingConfigsDto) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    const { items, total } = await this.pricingRepo.findConfigs({
      tenantId,
      model: query.model,
      isActive: query.isActive,
      verticalId: query.verticalId,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: items,
      meta: {
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          totalItems: total,
          totalPages: Math.ceil(total / (query.pageSize || 20)),
        },
      },
    };
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Get pricing configuration by ID' })
  @ApiResponse({ status: 200, type: PricingConfigResponseDto })
  async getConfig(@Param('id') id: string) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    return this.pricingRepo.findConfigById(id, tenantId);
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: 'Update pricing configuration' })
  @ApiResponse({ status: 200, type: PricingConfigResponseDto })
  async updateConfig(@Param('id') id: string, @Body() dto: UpdatePricingConfigDto) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    // If config is being updated, validate it
    if (dto.config) {
      const existing = await this.pricingRepo.findConfigById(id, tenantId);
      if (existing) {
        this.calculationService.validatePricingConfig(existing.model, dto.config);
      }
    }

    const updated = await this.pricingRepo.updateConfig(id, tenantId, {
      ...dto,
      config: dto.config as Prisma.InputJsonValue | undefined,
    });
    this.logger.log(`Updated pricing config: ${id}`);
    return updated;
  }

  @Delete('configs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pricing configuration' })
  @ApiResponse({ status: 204 })
  async deleteConfig(@Param('id') id: string) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    await this.pricingRepo.deleteConfig(id, tenantId);
    this.logger.log(`Deleted pricing config: ${id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRICING RULE ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('rules')
  @ApiOperation({ summary: 'Create pricing rule' })
  @ApiResponse({ status: 201 })
  async createRule(@Body() dto: CreatePricingRuleDto) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    // Verify pricing config belongs to tenant
    const config = await this.pricingRepo.findConfigById(dto.pricingConfigId, tenantId);
    if (!config) {
      this.logger.error(`Pricing config not found: ${dto.pricingConfigId}`);
      throw new Error('Pricing config not found');
    }

    const rule = await this.pricingRepo.createRule({
      pricingConfigId: dto.pricingConfigId,
      name: dto.name,
      description: dto.description,
      eventType: dto.eventType,
      chargeType: dto.chargeType,
      amount: dto.amount,
      currency: dto.currency,
      conditions: dto.conditions as Prisma.InputJsonValue | undefined,
      isActive: dto.isActive,
    });

    this.logger.log(`Created pricing rule: ${rule.id} for config: ${dto.pricingConfigId}`);
    return rule;
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update pricing rule' })
  @ApiResponse({ status: 200 })
  async updateRule(@Param('id') id: string, @Body() dto: UpdatePricingRuleDto) {
    const updated = await this.pricingRepo.updateRule(id, {
      ...dto,
      conditions: dto.conditions as Prisma.InputJsonValue | undefined,
    });
    this.logger.log(`Updated pricing rule: ${id}`);
    return updated;
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pricing rule' })
  @ApiResponse({ status: 204 })
  async deleteRule(@Param('id') id: string) {
    await this.pricingRepo.deleteRule(id);
    this.logger.log(`Deleted pricing rule: ${id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHARGE CALCULATION ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate charge for event' })
  @ApiResponse({ status: 200, type: ChargeCalculationResponseDto })
  async calculateCharge(@Body() dto: CalculateChargeDto) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    return this.calculationService.calculateChargeForEvent(tenantId, {
      eventType: dto.eventType,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      amount: dto.amount,
      metadata: dto.metadata,
    });
  }

  @Get('charges')
  @ApiOperation({ summary: 'List charge events' })
  @ApiResponse({ status: 200 })
  async listChargeEvents(@Query() query: ListChargeEventsDto) {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    const { items, total } = await this.pricingRepo.findChargeEvents({
      tenantId,
      chargeType: query.chargeType,
      eventType: query.eventType,
      processed: query.processed,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data: items,
      meta: {
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          totalItems: total,
          totalPages: Math.ceil(total / (query.pageSize || 20)),
        },
      },
    };
  }

  @Get('charges/summary')
  @ApiOperation({ summary: 'Get charge summary' })
  @ApiResponse({ status: 200 })
  async getChargeSummary() {
    const tenantId = 'test-tenant-id'; // TODO: Get from context
    return this.calculationService.getChargeSummary(tenantId);
  }
}
