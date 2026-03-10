/**
 * Vertical Definition Controller
 * Part 8 - Vertical Module Contract
 *
 * Platform-level vertical definition management (SUPER_ADMIN only).
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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@core/rbac';
import { Role } from '@prisma/client';

import { ApiResponse as SuccessResponse } from '@shared/responses';

import { VerticalService } from '../services/vertical.service';
import { VerticalRegistryService, VerticalHealthResponse } from '../services/vertical-registry.service';
import {
  CreateVerticalDefinitionDto,
  UpdateVerticalDefinitionDto,
  VerticalQueryDto,
  VerticalDefinitionResponseDto,
  SetMaintenanceDto,
  MaintenanceStatusResponseDto,
} from '../dto/vertical.dto';

/**
 * Express request with authenticated user
 */
interface AuthRequest extends Request {
  user: {
    sub: string; // User ID
    partnerId?: string;
  };
}

@ApiTags('Verticals - Definitions')
@ApiBearerAuth()
@Controller('verticals/definitions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerticalDefinitionController {
  constructor(
    private readonly verticalService: VerticalService,
    private readonly verticalRegistry: VerticalRegistryService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // HEALTH ENDPOINT (No auth required - useful for frontend initialization)
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('health')
  @ApiOperation({
    summary: 'Get vertical implementation health',
    description:
      'Returns which verticals are actually implemented (have backend modules loaded). ' +
      'This is different from enabled/active status in the database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vertical health status',
  })
  async getHealth(): Promise<SuccessResponse<VerticalHealthResponse>> {
    const health = this.verticalRegistry.getHealthResponse();
    return { data: health };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create vertical definition',
    description: 'Create a new vertical definition (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Vertical created',
    type: VerticalDefinitionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid schema' })
  @ApiResponse({ status: 409, description: 'Vertical type already exists' })
  async create(
    @Body() dto: CreateVerticalDefinitionDto,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto>> {
    const created = await this.verticalService.createVerticalDefinition(dto);
    return { data: created };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Get all vertical definitions',
    description: 'Get all vertical definitions with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of verticals',
    type: [VerticalDefinitionResponseDto],
  })
  async findAll(
    @Query() query: VerticalQueryDto,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto[]>> {
    const items = await this.verticalService.getAllVerticalDefinitions(query);
    return { data: items };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active vertical definitions',
    description: 'Get all active vertical definitions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active verticals',
    type: [VerticalDefinitionResponseDto],
  })
  async findActive(): Promise<SuccessResponse<VerticalDefinitionResponseDto[]>> {
    const items = await this.verticalService.getActiveVerticalDefinitions();
    return { data: items };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get vertical definition by ID',
  })
  @ApiParam({ name: 'id', description: 'Vertical definition ID' })
  @ApiResponse({
    status: 200,
    description: 'Vertical definition',
    type: VerticalDefinitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto>> {
    const vertical = await this.verticalService.getVerticalDefinitionById(id);
    return { data: vertical };
  }

  @Get('type/:type')
  @ApiOperation({
    summary: 'Get vertical definition by type',
  })
  @ApiParam({ name: 'type', description: 'Vertical type (e.g., real_estate)' })
  @ApiResponse({
    status: 200,
    description: 'Vertical definition',
    type: VerticalDefinitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async findByType(
    @Param('type') type: string,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto>> {
    const vertical = await this.verticalService.getVerticalDefinitionByType(type);
    return { data: vertical };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update vertical definition',
    description: 'Update a vertical definition (SUPER_ADMIN only)',
  })
  @ApiParam({ name: 'id', description: 'Vertical definition ID' })
  @ApiResponse({
    status: 200,
    description: 'Vertical updated',
    type: VerticalDefinitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVerticalDefinitionDto,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto>> {
    const updated = await this.verticalService.updateVerticalDefinition(id, dto);
    return { data: updated };
  }

  @Patch(':id/activate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Activate vertical definition',
    description: 'Activate a vertical definition (SUPER_ADMIN only)',
  })
  @ApiParam({ name: 'id', description: 'Vertical definition ID' })
  @ApiResponse({
    status: 200,
    description: 'Vertical activated',
    type: VerticalDefinitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto>> {
    const updated = await this.verticalService.activateVerticalDefinition(id);
    return { data: updated };
  }

  @Patch(':id/deactivate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Deactivate vertical definition',
    description:
      'Deactivate a vertical definition (SUPER_ADMIN only). Cannot deactivate core verticals.',
  })
  @ApiParam({ name: 'id', description: 'Vertical definition ID' })
  @ApiResponse({
    status: 200,
    description: 'Vertical deactivated',
    type: VerticalDefinitionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot deactivate core vertical' })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto>> {
    const updated = await this.verticalService.deactivateVerticalDefinition(id);
    return { data: updated };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAINTENANCE MODE ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/maintenance')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Set maintenance mode for a vertical',
    description:
      'Enable or disable maintenance mode for a vertical (SUPER_ADMIN only). ' +
      'When enabled, partner portals, vendor portals, customer accounts, and public pages ' +
      'for this vertical will show a maintenance message. Super Admin portal is NOT affected.',
  })
  @ApiParam({ name: 'id', description: 'Vertical definition ID' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance mode updated',
    type: VerticalDefinitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async setMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetMaintenanceDto,
    @Req() req: AuthRequest,
  ): Promise<SuccessResponse<VerticalDefinitionResponseDto>> {
    const userId = req.user.sub;
    const updated = await this.verticalService.setMaintenanceMode(id, dto.enabled, userId, {
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      message: dto.message,
    });
    return { data: updated };
  }

  @Get('maintenance/:type')
  @ApiOperation({
    summary: 'Get maintenance status for a vertical',
    description:
      'Check if a vertical is under maintenance. Used by all portals and public pages ' +
      'to determine if they should show the maintenance page.',
  })
  @ApiParam({ name: 'type', description: 'Vertical type (e.g., real_estate)' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance status',
    type: MaintenanceStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async getMaintenanceStatus(
    @Param('type') type: string,
  ): Promise<SuccessResponse<MaintenanceStatusResponseDto>> {
    const status = await this.verticalService.getMaintenanceStatus(type);
    return { data: status };
  }

  @Get('maintenance')
  @ApiOperation({
    summary: 'Get maintenance status for all verticals',
    description: 'Check maintenance status for all verticals at once.',
  })
  @ApiResponse({
    status: 200,
    description: 'Maintenance statuses for all verticals',
    type: [MaintenanceStatusResponseDto],
  })
  async getAllMaintenanceStatuses(): Promise<SuccessResponse<MaintenanceStatusResponseDto[]>> {
    const statuses = await this.verticalService.getAllMaintenanceStatuses();
    return { data: statuses };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete vertical definition',
    description:
      'Delete a vertical definition (SUPER_ADMIN only). Cannot delete core verticals or verticals in use.',
  })
  @ApiParam({ name: 'id', description: 'Vertical definition ID' })
  @ApiResponse({ status: 204, description: 'Vertical deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete core vertical or vertical in use' })
  @ApiResponse({ status: 404, description: 'Vertical not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.verticalService.deleteVerticalDefinition(id);
  }
}
