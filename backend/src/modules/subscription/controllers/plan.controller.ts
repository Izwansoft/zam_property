import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlanService } from '../services/plan.service';
import { CreatePlanDto, UpdatePlanDto, PlanQueryDto } from '../dto/subscription.dto';
import { randomUUID } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

@ApiTags('Plans')
@ApiBearerAuth()
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  async create(@Body() dto: CreatePlanDto) {
    const plan = await this.planService.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      priceMonthly: dto.priceMonthly ? new Decimal(dto.priceMonthly) : undefined,
      priceYearly: dto.priceYearly ? new Decimal(dto.priceYearly) : undefined,
      currency: dto.currency,
      entitlements: dto.entitlements as Record<string, unknown>,
      isActive: dto.isActive,
      isPublic: dto.isPublic,
    });

    return {
      data: plan,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all plans with pagination' })
  async findAll(@Query() query: PlanQueryDto) {
    const { data, total } = await this.planService.findAll({
      isActive: query.isActive,
      isPublic: query.isPublic,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      data,
      meta: {
        requestId: randomUUID(),
        pagination: {
          page: query.page || 1,
          pageSize: query.pageSize || 20,
          total,
          totalPages: Math.ceil(total / (query.pageSize || 20)),
        },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  async findById(@Param('id') id: string) {
    const plan = await this.planService.findById(id);

    return {
      data: plan,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const plan = await this.planService.update(id, {
      name: dto.name,
      description: dto.description,
      priceMonthly: dto.priceMonthly ? new Decimal(dto.priceMonthly) : undefined,
      priceYearly: dto.priceYearly ? new Decimal(dto.priceYearly) : undefined,
      entitlements: dto.entitlements as Record<string, unknown> | undefined,
      isActive: dto.isActive,
      isPublic: dto.isPublic,
    });

    return {
      data: plan,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a plan' })
  async activate(@Param('id') id: string) {
    const plan = await this.planService.activate(id);

    return {
      data: plan,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a plan' })
  async deactivate(@Param('id') id: string) {
    const plan = await this.planService.deactivate(id);

    return {
      data: plan,
      meta: {
        requestId: randomUUID(),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan (soft delete via deactivation)' })
  async delete(@Param('id') id: string) {
    const plan = await this.planService.delete(id);

    return {
      data: plan,
      meta: {
        requestId: randomUUID(),
      },
    };
  }
}
