import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { PermissionsGuard, RequirePermission, Roles, RolesGuard } from '@core/rbac';
import { PartnerContextService } from '@core/partner-context';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import { CreateExperimentDto, ExperimentResponseDto, SetExperimentPartnerOptInDto } from './dto';
import { ExperimentService } from './experiment.service';

@ApiTags('Admin - Experiments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/experiments')
@Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
export class ExperimentAdminController {
  constructor(
    private readonly experiments: ExperimentService,
    private readonly PartnerContext: PartnerContextService,
  ) {}

  @Get()
  @RequirePermission('feature-flag:read')
  @ApiOperation({ summary: 'List experiments (admin)' })
  @ApiResponse({ status: 200, type: [ExperimentResponseDto] })
  async list(): Promise<SuccessResponse<ExperimentResponseDto[]>> {
    const experiments = await this.experiments.listExperiments();
    return { data: experiments as unknown as ExperimentResponseDto[] };
  }

  @Get(':key')
  @RequirePermission('feature-flag:read')
  @ApiOperation({ summary: 'Get experiment by key (admin)' })
  @ApiParam({ name: 'key', type: String })
  @ApiResponse({ status: 200, type: ExperimentResponseDto })
  async getByKey(@Param('key') key: string): Promise<SuccessResponse<ExperimentResponseDto>> {
    const experiment = await this.experiments.getExperimentByKeyOrThrow(key);
    return { data: experiment as unknown as ExperimentResponseDto };
  }

  @Post()
  @RequirePermission('feature-flag:write')
  @ApiOperation({ summary: 'Create experiment (admin)' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateExperimentDto,
  ): Promise<SuccessResponse<{ id: string; key: string }>> {
    const created = await this.experiments.createExperiment({
      key: dto.key,
      description: dto.description,
      owner: dto.owner,
      successMetrics: dto.successMetrics ?? null,
      variants: dto.variants,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      isActive: dto.isActive,
      featureFlagKey: dto.featureFlagKey ?? null,
    });
    return { data: created };
  }

  @Post(':key/partner-opt-in')
  @RequirePermission('feature-flag:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Opt a partner in/out of an experiment (admin)' })
  @ApiParam({ name: 'key', type: String })
  @ApiResponse({ status: 200 })
  async setOptIn(
    @Param('key') key: string,
    @Body() dto: SetExperimentPartnerOptInDto,
  ): Promise<SuccessResponse<{ ok: true }>> {
    const partnerId = dto.partnerId ?? this.PartnerContext.partnerId;
    await this.experiments.upsertTenantOptIn(key, partnerId, dto.optIn);
    return { data: { ok: true } };
  }
}
