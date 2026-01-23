import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import { AnalyticsService, type AuthUser } from './analytics.service';
import { AnalyticsDateRangeQueryDto, VendorAnalyticsQueryDto } from './dto/analytics-query.dto';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('tenant/overview')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Get tenant-wide analytics overview',
    description: 'Read-only aggregated analytics for the current tenant over a date range.',
  })
  @ApiResponse({ status: 200, description: 'Tenant analytics overview' })
  async getTenantOverview(
    @Query() query: AnalyticsDateRangeQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<unknown>> {
    const result = await this.analyticsService.getTenantOverview(req.user, query);
    return { data: result };
  }

  @Get('vendor/overview')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({
    summary: 'Get vendor analytics overview',
    description:
      'Read-only aggregated analytics for a vendor over a date range. Vendor roles are restricted to their own vendor.',
  })
  @ApiResponse({ status: 200, description: 'Vendor analytics overview' })
  async getVendorOverview(
    @Query() query: VendorAnalyticsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<unknown>> {
    const result = await this.analyticsService.getVendorOverview(req.user, query);
    return { data: result };
  }

  @Get('vendor/listings')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({
    summary: 'Get vendor listing performance analytics',
    description:
      'Read-only aggregated listing performance for a vendor over a date range. Vendor roles are restricted to their own vendor.',
  })
  @ApiResponse({ status: 200, description: 'Vendor listing analytics' })
  async getVendorListings(
    @Query() query: VendorAnalyticsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<unknown>> {
    const result = await this.analyticsService.getVendorListings(req.user, query);
    return { data: result };
  }
}
