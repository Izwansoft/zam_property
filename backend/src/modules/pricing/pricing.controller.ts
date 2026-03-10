import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
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
  ListPricingRulesDto,
  ListChargeEventsDto,
  PricingConfigResponseDto,
  ChargeCalculationResponseDto,
} from './dto/pricing.dto';

@ApiTags('Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pricing')
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
  async createConfig(@Body() dto: CreatePricingConfigDto, @Request() req: any) {
    const partnerId = req.user.partnerId;

    // Validate configuration
    this.calculationService.validatePricingConfig(dto.model, dto.config);

    const config = await this.pricingRepo.createConfig({
      partnerId,
      model: dto.model,
      name: dto.name,
      description: dto.description,
      config: dto.config as Prisma.InputJsonValue,
      verticalId: dto.verticalId,
      isActive: dto.isActive,
    });

    this.logger.log(`Created pricing config: ${config.id} for partner: ${partnerId}`);
    return config;
  }

  @Get('configs')
  @ApiOperation({ summary: 'List pricing configurations' })
  @ApiResponse({ status: 200 })
  async listConfigs(@Query() query: ListPricingConfigsDto, @Request() req: any) {
    const partnerId = req.user.partnerId;
    const { items, total } = await this.pricingRepo.findConfigs({
      partnerId,
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
  async getConfig(@Param('id') id: string, @Request() req: any) {
    const partnerId = req.user.partnerId;
    return this.pricingRepo.findConfigById(id, partnerId);
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: 'Update pricing configuration' })
  @ApiResponse({ status: 200, type: PricingConfigResponseDto })
  async updateConfig(@Param('id') id: string, @Body() dto: UpdatePricingConfigDto, @Request() req: any) {
    const partnerId = req.user.partnerId;
    // If config is being updated, validate it
    if (dto.config) {
      const existing = await this.pricingRepo.findConfigById(id, partnerId);
      if (existing) {
        this.calculationService.validatePricingConfig(existing.model, dto.config);
      }
    }

    const updated = await this.pricingRepo.updateConfig(id, partnerId, {
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
  async deleteConfig(@Param('id') id: string, @Request() req: any) {
    const partnerId = req.user.partnerId;
    await this.pricingRepo.deleteConfig(id, partnerId);
    this.logger.log(`Deleted pricing config: ${id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRICING RULE ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('rules')
  @ApiOperation({ summary: 'List pricing rules' })
  @ApiResponse({ status: 200 })
  async listRules(@Query() query: ListPricingRulesDto) {
    const { items, total } = await this.pricingRepo.findRules({
      pricingConfigId: query.pricingConfigId,
      isActive: query.isActive,
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

  @Post('rules')
  @ApiOperation({ summary: 'Create pricing rule' })
  @ApiResponse({ status: 201 })
  async createRule(@Body() dto: CreatePricingRuleDto, @Request() req: any) {
    const partnerId = req.user.partnerId;
    // Verify pricing config belongs to partner
    const config = await this.pricingRepo.findConfigById(dto.pricingConfigId, partnerId);
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
  async calculateCharge(@Body() dto: CalculateChargeDto, @Request() req: any) {
    const partnerId = req.user.partnerId;
    return this.calculationService.calculateChargeForEvent(partnerId, {
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
  async listChargeEvents(@Query() query: ListChargeEventsDto, @Request() req: any) {
    const partnerId = req.user.partnerId;
    const { items, total } = await this.pricingRepo.findChargeEvents({
      partnerId,
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
  async getChargeSummary(@Request() req: any) {
    const partnerId = req.user.partnerId;
    return this.calculationService.getChargeSummary(partnerId);
  }
}
