import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { PermissionsGuard, RequirePermission, Roles, RolesGuard } from '@core/rbac';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import {
  CreateFeatureFlagDto,
  FeatureFlagResponseDto,
  SetFeatureFlagUserTargetDto,
  UpdateFeatureFlagDto,
  UpsertFeatureFlagOverrideDto,
} from './dto';
import { FeatureFlagService } from './feature-flag.service';

@ApiTags('Admin - Feature Flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/feature-flags')
@Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
export class FeatureFlagAdminController {
  constructor(private readonly featureFlags: FeatureFlagService) {}

  @Get()
  @RequirePermission('feature-flag:read')
  @ApiOperation({ summary: 'List feature flags (admin)' })
  @ApiResponse({ status: 200, type: [FeatureFlagResponseDto] })
  async list(): Promise<SuccessResponse<FeatureFlagResponseDto[]>> {
    const flags = await this.featureFlags.listFlags();
    return { data: flags as unknown as FeatureFlagResponseDto[] };
  }

  @Get(':key')
  @RequirePermission('feature-flag:read')
  @ApiOperation({ summary: 'Get feature flag by key (admin)' })
  @ApiParam({ name: 'key', type: String })
  @ApiResponse({ status: 200, type: FeatureFlagResponseDto })
  async getByKey(@Param('key') key: string): Promise<SuccessResponse<FeatureFlagResponseDto>> {
    const flag = await this.featureFlags.getFlagByKeyOrThrow(key);
    return { data: flag as unknown as FeatureFlagResponseDto };
  }

  @Post()
  @RequirePermission('feature-flag:write')
  @ApiOperation({ summary: 'Create feature flag (admin)' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateFeatureFlagDto,
  ): Promise<SuccessResponse<{ id: string; key: string }>> {
    const created = await this.featureFlags.createFlag({
      key: dto.key,
      type: dto.type,
      description: dto.description,
      owner: dto.owner,
      defaultValue: dto.defaultValue ?? false,
      rolloutPercentage: dto.rolloutPercentage ?? null,
      allowedVerticals: dto.allowedVerticals,
      allowedRoles: dto.allowedRoles,
      reviewAt: dto.reviewAt ? new Date(dto.reviewAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return { data: created };
  }

  @Patch(':key')
  @RequirePermission('feature-flag:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update feature flag (admin)' })
  @ApiParam({ name: 'key', type: String })
  @ApiResponse({ status: 200 })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
  ): Promise<SuccessResponse<{ id: string; key: string }>> {
    const updated = await this.featureFlags.updateFlag(key, {
      type: dto.type,
      description: dto.description,
      owner: dto.owner,
      defaultValue: dto.defaultValue,
      rolloutPercentage: dto.rolloutPercentage ?? undefined,
      allowedVerticals: dto.allowedVerticals,
      allowedRoles: dto.allowedRoles,
      reviewAt: dto.reviewAt ? new Date(dto.reviewAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      isArchived: dto.isArchived,
    });
    return { data: updated };
  }

  @Post(':key/overrides')
  @RequirePermission('feature-flag:write')
  @ApiOperation({ summary: 'Upsert feature flag override (admin)' })
  @ApiParam({ name: 'key', type: String })
  @ApiResponse({ status: 200 })
  async upsertOverride(
    @Param('key') key: string,
    @Body() dto: UpsertFeatureFlagOverrideDto,
  ): Promise<SuccessResponse<{ id: string }>> {
    const created = await this.featureFlags.upsertOverride(key, {
      tenantId: dto.tenantId ?? null,
      verticalType: dto.verticalType ?? null,
      role: dto.role ?? null,
      isEmergency: dto.isEmergency ?? false,
      value: dto.value,
      rolloutPercentage: dto.rolloutPercentage ?? null,
    });
    return { data: created };
  }

  @Post(':key/user-targets')
  @RequirePermission('feature-flag:write')
  @ApiOperation({ summary: 'Set per-user feature target (admin)' })
  @ApiParam({ name: 'key', type: String })
  @ApiResponse({ status: 200 })
  async setUserTarget(
    @Param('key') key: string,
    @Body() dto: SetFeatureFlagUserTargetDto,
  ): Promise<SuccessResponse<{ ok: true }>> {
    await this.featureFlags.setUserTarget(key, {
      tenantId: dto.tenantId,
      userId: dto.userId,
      value: dto.value,
    });
    return { data: { ok: true } };
  }
}
