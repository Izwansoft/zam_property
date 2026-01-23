import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { PermissionsGuard, RequirePermission, Roles, RolesGuard } from '@core/rbac';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import {
  ApproveVendorDto,
  RejectVendorDto,
  ReactivateVendorDto,
  SuspendVendorDto,
  VendorQueryDto,
  VendorResponseDto,
  VendorDetailResponseDto,
} from '@modules/vendor/dto';
import {
  ListingQueryDto,
  ListingResponseDto,
  ListingDetailResponseDto,
  PublishListingDto,
  UnpublishListingDto,
  ArchiveListingDto,
  ExpireListingDto,
  FeatureListingDto,
} from '@modules/listing/dto';

import { VendorService } from '@modules/vendor/vendor.service';
import { ListingService } from '@modules/listing/listing.service';

import {
  AdminListingDashboardItemDto,
  AdminSystemHealthDto,
  AdminVendorDashboardItemDto,
  BulkActionResponseDto,
  BulkExpireListingsRequestDto,
  BulkReindexRequestDto,
  TenantDashboardStatsDto,
} from './dto';
import { AdminService } from './admin.service';

interface AuthenticatedRequest {
  user: {
    sub: string;
    tenantId: string;
    role: Role;
    vendorId?: string;
  };
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin')
@Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly vendorService: VendorService,
    private readonly listingService: ListingService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────

  @Get('dashboard/stats')
  @RequirePermission('admin:read')
  @ApiOperation({
    summary: 'Get tenant admin dashboard stats',
    description:
      'Returns tenant-scoped counts for vendors, listings, interactions, and moderation queues.',
  })
  @ApiResponse({ status: 200, type: TenantDashboardStatsDto })
  async getTenantDashboardStats(): Promise<SuccessResponse<TenantDashboardStatsDto>> {
    const stats = await this.adminService.getTenantDashboardStats();
    return { data: stats };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDORS (DASHBOARD)
  // ─────────────────────────────────────────────────────────────────────────

  @Get('vendors')
  @RequirePermission('vendor:read')
  @ApiOperation({
    summary: 'List vendors (admin dashboard)',
    description: 'Tenant-scoped vendor listing with aggregate counts for dashboard use.',
  })
  @ApiResponse({ status: 200, type: [AdminVendorDashboardItemDto] })
  async listVendorsDashboard(@Query() query: VendorQueryDto): Promise<
    SuccessResponse<{
      items: AdminVendorDashboardItemDto[];
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
    }>
  > {
    const result = await this.adminService.listVendorsDashboard(query);
    return { data: result };
  }

  @Get('vendors/:id')
  @RequirePermission('vendor:read')
  @ApiOperation({ summary: 'Get vendor by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({ status: 200, type: VendorDetailResponseDto })
  async getVendorById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<VendorDetailResponseDto>> {
    const vendor = await this.vendorService.getVendorByIdWithDetails(id);
    return { data: vendor };
  }

  @Post('vendors/:id/actions/approve')
  @RequirePermission('vendor:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve vendor (admin)' })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiBody({ required: false, type: ApproveVendorDto })
  @ApiResponse({ status: 200, type: VendorResponseDto })
  async approveVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: ApproveVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.approveVendor(id, req.user.sub);
    return { data: vendor };
  }

  @Post('vendors/:id/actions/reject')
  @RequirePermission('vendor:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject vendor (admin)' })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({ status: 200, type: VendorResponseDto })
  async rejectVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.rejectVendor(id, req.user.sub, dto.reason);
    return { data: vendor };
  }

  @Post('vendors/:id/actions/suspend')
  @RequirePermission('vendor:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend vendor (admin)' })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({ status: 200, type: VendorResponseDto })
  async suspendVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.suspendVendor(id, req.user.sub, dto.reason);
    return { data: vendor };
  }

  @Post('vendors/:id/actions/reactivate')
  @RequirePermission('vendor:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate vendor (admin)' })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiBody({ required: false, type: ReactivateVendorDto })
  @ApiResponse({ status: 200, type: VendorResponseDto })
  async reactivateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: ReactivateVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.reactivateVendor(id, req.user.sub);
    return { data: vendor };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTINGS (MODERATION)
  // ─────────────────────────────────────────────────────────────────────────

  @Get('listings')
  @RequirePermission('listing:read')
  @ApiOperation({
    summary: 'List listings (admin dashboard)',
    description:
      'Tenant-scoped listing listing with vendor details and counts for moderation views.',
  })
  @ApiResponse({ status: 200, type: [AdminListingDashboardItemDto] })
  async listListingsDashboard(@Query() query: ListingQueryDto): Promise<
    SuccessResponse<{
      items: AdminListingDashboardItemDto[];
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
    }>
  > {
    const result = await this.adminService.listListingsDashboard(query);
    return { data: result };
  }

  @Get('listings/:id')
  @RequirePermission('listing:read')
  @ApiOperation({ summary: 'Get listing by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({ status: 200, type: ListingDetailResponseDto })
  async getListingById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<ListingDetailResponseDto>> {
    const listing = await this.listingService.getListingByIdWithDetails(id);
    return { data: listing };
  }

  @Post('listings/:id/publish')
  @RequirePermission('listing:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish listing (admin)' })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiBody({ required: false, type: PublishListingDto })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async publishListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.publishListing(
      id,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    );
    return { data: listing };
  }

  @Post('listings/:id/unpublish')
  @RequirePermission('listing:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish listing (admin)' })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async unpublishListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UnpublishListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.unpublishListing(id, dto.reason);
    return { data: listing };
  }

  @Post('listings/:id/expire')
  @RequirePermission('listing:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expire listing (admin)' })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiBody({ required: false, type: ExpireListingDto })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async expireListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExpireListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.expireListing(id, dto.reason);
    return { data: listing };
  }

  @Post('listings/:id/archive')
  @RequirePermission('listing:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive listing (admin)' })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiBody({ required: false, type: ArchiveListingDto })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async archiveListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ArchiveListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.archiveListing(id, dto.reason);
    return { data: listing };
  }

  @Post('listings/:id/feature')
  @RequirePermission('listing:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Feature listing (admin)' })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async featureListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FeatureListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.featureListing(id, new Date(dto.featuredUntil));
    return { data: listing };
  }

  @Post('listings/:id/unfeature')
  @RequirePermission('listing:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfeature listing (admin)' })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({ status: 200, type: ListingResponseDto })
  async unfeatureListing(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.unfeatureListing(id);
    return { data: listing };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SYSTEM HEALTH
  // ─────────────────────────────────────────────────────────────────────────

  @Get('system/health')
  @RequirePermission('jobs:read')
  @ApiOperation({ summary: 'Get system health (admin)' })
  @ApiResponse({ status: 200, type: AdminSystemHealthDto })
  async getSystemHealth(): Promise<SuccessResponse<AdminSystemHealthDto>> {
    const health = await this.adminService.getSystemHealth();
    return { data: health };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BULK ACTIONS (ASYNC)
  // ─────────────────────────────────────────────────────────────────────────

  @Post('bulk/search/reindex')
  @RequirePermission('jobs:write')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger bulk reindex (async)' })
  @ApiResponse({ status: 202, type: BulkActionResponseDto })
  async triggerBulkReindex(
    @Body() dto: BulkReindexRequestDto,
  ): Promise<SuccessResponse<BulkActionResponseDto>> {
    const result = await this.adminService.triggerBulkReindex(dto);
    return { data: result };
  }

  @Post('bulk/listings/expire')
  @RequirePermission('jobs:write')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Expire multiple listings (async)' })
  @ApiResponse({ status: 202, type: BulkActionResponseDto })
  async bulkExpireListings(
    @Body() dto: BulkExpireListingsRequestDto,
  ): Promise<SuccessResponse<BulkActionResponseDto>> {
    const result = await this.adminService.triggerBulkExpireListings(dto);
    return { data: result };
  }
}
