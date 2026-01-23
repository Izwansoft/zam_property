/**
 * Tenant Vertical Controller
 * Part 8 - Vertical Module Contract
 *
 * Tenant-level vertical enablement management.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@core/rbac';
import { Role } from '@prisma/client';

import { ApiResponse as SuccessResponse } from '@shared/responses';

import { VerticalService } from '../services/vertical.service';
import {
  EnableVerticalDto,
  UpdateTenantVerticalDto,
  TenantVerticalQueryDto,
  TenantVerticalResponseDto,
} from '../dto/vertical.dto';

@ApiTags('Verticals - Tenant Enablement')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Tenant-ID', required: true, description: 'Tenant identifier' })
@Controller('verticals/tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantVerticalController {
  constructor(private readonly verticalService: VerticalService) {}

  @Post('enable')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Enable vertical for tenant',
    description: 'Enable a vertical for the current tenant (TENANT_ADMIN or higher)',
  })
  @ApiResponse({ status: 201, description: 'Vertical enabled', type: TenantVerticalResponseDto })
  @ApiResponse({ status: 400, description: 'Vertical is not active' })
  @ApiResponse({ status: 404, description: 'Vertical type not found' })
  @ApiResponse({ status: 409, description: 'Vertical already enabled' })
  async enableVertical(
    @Body() dto: EnableVerticalDto,
  ): Promise<SuccessResponse<TenantVerticalResponseDto>> {
    const enabled = await this.verticalService.enableVerticalForTenant(dto);
    return { data: enabled };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Get tenant verticals',
    description: 'Get all verticals for the current tenant with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenant verticals',
    type: [TenantVerticalResponseDto],
  })
  async findAll(
    @Query() query: TenantVerticalQueryDto,
  ): Promise<SuccessResponse<TenantVerticalResponseDto[]>> {
    const items = await this.verticalService.getTenantVerticals(query);
    return { data: items };
  }

  @Get('enabled')
  @ApiOperation({
    summary: 'Get enabled verticals for tenant',
    description: 'Get all enabled and active verticals for the current tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'List of enabled verticals',
    type: [TenantVerticalResponseDto],
  })
  async findEnabled(): Promise<SuccessResponse<TenantVerticalResponseDto[]>> {
    const items = await this.verticalService.getEnabledVerticalsForTenant();
    return { data: items };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Get tenant vertical by ID',
  })
  @ApiParam({ name: 'id', description: 'Tenant vertical ID' })
  @ApiResponse({ status: 200, description: 'Tenant vertical', type: TenantVerticalResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant vertical not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<TenantVerticalResponseDto>> {
    const tenantVertical = await this.verticalService.getTenantVerticalById(id);
    return { data: tenantVertical };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Update tenant vertical',
    description: 'Update tenant vertical configuration',
  })
  @ApiParam({ name: 'id', description: 'Tenant vertical ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant vertical updated',
    type: TenantVerticalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant vertical not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantVerticalDto,
  ): Promise<SuccessResponse<TenantVerticalResponseDto>> {
    const updated = await this.verticalService.updateTenantVertical(id, dto);
    return { data: updated };
  }

  @Delete(':verticalType')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable vertical for tenant',
    description: 'Disable a vertical for the current tenant',
  })
  @ApiParam({ name: 'verticalType', description: 'Vertical type (e.g., real_estate)' })
  @ApiResponse({ status: 200, description: 'Vertical disabled', type: TenantVerticalResponseDto })
  @ApiResponse({ status: 400, description: 'Vertical already disabled' })
  @ApiResponse({ status: 404, description: 'Vertical not found for tenant' })
  async disableVertical(
    @Param('verticalType') verticalType: string,
  ): Promise<SuccessResponse<TenantVerticalResponseDto>> {
    const updated = await this.verticalService.disableVerticalForTenant(verticalType);
    return { data: updated };
  }
}
