/**
 * Partner Vertical Controller
 * Part 8 - Vertical Module Contract
 *
 * Partner-level vertical enablement management.
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
  UpdatePartnerVerticalDto,
  PartnerVerticalQueryDto,
  PartnerVerticalResponseDto,
} from '../dto/vertical.dto';

@ApiTags('Verticals - Partner Enablement')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Partner-ID', required: true, description: 'Partner identifier' })
@Controller('verticals/partner')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnerVerticalController {
  constructor(private readonly verticalService: VerticalService) {}

  @Post('enable')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Enable vertical for partner',
    description: 'Enable a vertical for the current partner (PARTNER_ADMIN or higher)',
  })
  @ApiResponse({ status: 201, description: 'Vertical enabled', type: PartnerVerticalResponseDto })
  @ApiResponse({ status: 400, description: 'Vertical is not active' })
  @ApiResponse({ status: 404, description: 'Vertical type not found' })
  @ApiResponse({ status: 409, description: 'Vertical already enabled' })
  async enableVertical(
    @Body() dto: EnableVerticalDto,
  ): Promise<SuccessResponse<PartnerVerticalResponseDto>> {
    const enabled = await this.verticalService.enableVerticalForTenant(dto);
    return { data: enabled };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Get partner verticals',
    description: 'Get all verticals for the current partner with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of partner verticals',
    type: [PartnerVerticalResponseDto],
  })
  async findAll(
    @Query() query: PartnerVerticalQueryDto,
  ): Promise<SuccessResponse<PartnerVerticalResponseDto[]>> {
    const items = await this.verticalService.getPartnerVerticals(query);
    return { data: items };
  }

  @Get('enabled')
  @ApiOperation({
    summary: 'Get enabled verticals for partner',
    description: 'Get all enabled and active verticals for the current partner',
  })
  @ApiResponse({
    status: 200,
    description: 'List of enabled verticals',
    type: [PartnerVerticalResponseDto],
  })
  async findEnabled(): Promise<SuccessResponse<PartnerVerticalResponseDto[]>> {
    const items = await this.verticalService.getEnabledVerticalsForTenant();
    return { data: items };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Get partner vertical by ID',
  })
  @ApiParam({ name: 'id', description: 'Partner vertical ID' })
  @ApiResponse({ status: 200, description: 'Partner vertical', type: PartnerVerticalResponseDto })
  @ApiResponse({ status: 404, description: 'Partner vertical not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<PartnerVerticalResponseDto>> {
    const PartnerVertical = await this.verticalService.getPartnerVerticalById(id);
    return { data: PartnerVertical };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Update partner vertical',
    description: 'Update partner vertical configuration',
  })
  @ApiParam({ name: 'id', description: 'Partner vertical ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner vertical updated',
    type: PartnerVerticalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Partner vertical not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartnerVerticalDto,
  ): Promise<SuccessResponse<PartnerVerticalResponseDto>> {
    const updated = await this.verticalService.updatePartnerVertical(id, dto);
    return { data: updated };
  }

  @Delete(':verticalType')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disable vertical for partner',
    description: 'Disable a vertical for the current partner',
  })
  @ApiParam({ name: 'verticalType', description: 'Vertical type (e.g., real_estate)' })
  @ApiResponse({ status: 200, description: 'Vertical disabled', type: PartnerVerticalResponseDto })
  @ApiResponse({ status: 400, description: 'Vertical already disabled' })
  @ApiResponse({ status: 404, description: 'Vertical not found for partner' })
  async disableVertical(
    @Param('verticalType') verticalType: string,
  ): Promise<SuccessResponse<PartnerVerticalResponseDto>> {
    const updated = await this.verticalService.disableVerticalForTenant(verticalType);
    return { data: updated };
  }
}
