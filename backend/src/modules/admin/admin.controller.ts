import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
  AdminTenantDetailDto,
  AdminTenantItemDto,
  CreatePartnerDto,
  PartnerQueryDto,
  SuspendTenantDto,
  DeactivateTenantDto,
  UpdatePartnerSettingsDto,
  PropertyManagementStatsDto,
  PartnerDashboardStatsDto,
} from './dto';
import { AdminService } from './admin.service';

interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: Role;
    vendorId?: string;
  };
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin')
@Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
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
    summary: 'Get partner admin dashboard stats',
    description:
      'Returns partner-scoped counts for vendors, listings, interactions, and moderation queues.',
  })
  @ApiResponse({ status: 200, type: PartnerDashboardStatsDto })
  async getTenantDashboardStats(): Promise<SuccessResponse<PartnerDashboardStatsDto>> {
    const stats = await this.adminService.getTenantDashboardStats();
    return { data: stats };
  }

  @Get('dashboard/pm-stats')
  @RequirePermission('admin:read')
  @ApiOperation({
    summary: 'Get property management dashboard stats',
    description:
      'Returns partner-scoped aggregated stats for tenancies, billing, maintenance, payouts, deposits, inspections, claims, legal, tenants, and companies/agents.',
  })
  @ApiResponse({ status: 200, type: PropertyManagementStatsDto })
  async getPropertyManagementStats(): Promise<SuccessResponse<PropertyManagementStatsDto>> {
    const stats = await this.adminService.getPropertyManagementStats();
    return { data: stats };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TENANTS (PLATFORM)
  // ─────────────────────────────────────────────────────────────────────────

  @Post('partners')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('admin:create')
  @ApiOperation({
    summary: 'Create new partner',
    description:
      'Create a new partner with initial admin user and enabled verticals. SUPER_ADMIN only.',
  })
  @ApiResponse({ status: 201, type: AdminTenantDetailDto })
  @ApiResponse({ status: 400, description: 'Invalid vertical types' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async createPartner(
    @Body() dto: CreatePartnerDto,
  ): Promise<SuccessResponse<AdminTenantDetailDto>> {
    const partner = await this.adminService.createPartner(dto);
    return { data: partner };
  }

  @Get('partners')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('admin:read')
  @ApiOperation({
    summary: 'List tenants (platform)',
    description: 'Platform-level partner listing with filters, search, and pagination.',
  })
  @ApiResponse({ status: 200, type: [AdminTenantItemDto] })
  async listTenants(@Query() query: PartnerQueryDto): Promise<
    SuccessResponse<{
      items: AdminTenantItemDto[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>
  > {
    const result = await this.adminService.listTenants(query);
    return { data: result };
  }

  @Get('partners/:id')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('admin:read')
  @ApiOperation({ summary: 'Get partner by ID (platform)' })
  @ApiParam({ name: 'id', description: 'Partner UUID', type: 'string' })
  @ApiResponse({ status: 200, type: AdminTenantDetailDto })
  async getTenantById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<AdminTenantDetailDto>> {
    const partner = await this.adminService.getTenantById(id);
    return { data: partner };
  }

  @Patch('partners/:id/suspend')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('admin:update')
  @ApiOperation({ summary: 'Suspend partner (platform)' })
  @ApiParam({ name: 'id', description: 'Partner UUID', type: 'string' })
  @ApiResponse({ status: 200, type: AdminTenantDetailDto })
  async suspendTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendTenantDto,
  ): Promise<SuccessResponse<AdminTenantDetailDto>> {
    const partner = await this.adminService.suspendTenant(id, dto);
    return { data: partner };
  }

  @Patch('partners/:id/reactivate')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('admin:update')
  @ApiOperation({ summary: 'Reactivate partner (platform)' })
  @ApiParam({ name: 'id', description: 'Partner UUID', type: 'string' })
  @ApiResponse({ status: 200, type: AdminTenantDetailDto })
  async reactivateTenant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<AdminTenantDetailDto>> {
    const partner = await this.adminService.reactivateTenant(id);
    return { data: partner };
  }

  @Patch('partners/:id/deactivate')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('admin:update')
  @ApiOperation({ summary: 'Deactivate partner (platform)' })
  @ApiParam({ name: 'id', description: 'Partner UUID', type: 'string' })
  @ApiResponse({ status: 200, type: AdminTenantDetailDto })
  async deactivateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeactivateTenantDto,
  ): Promise<SuccessResponse<AdminTenantDetailDto>> {
    const partner = await this.adminService.deactivateTenant(id, dto);
    return { data: partner };
  }

  @Patch('partners/:id/settings')
  @Roles(Role.SUPER_ADMIN)
  @RequirePermission('admin:update')
  @ApiOperation({ summary: 'Update partner settings (platform)' })
  @ApiParam({ name: 'id', description: 'Partner UUID', type: 'string' })
  @ApiResponse({ status: 200, type: AdminTenantDetailDto })
  async updatePartnerSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartnerSettingsDto,
  ): Promise<SuccessResponse<AdminTenantDetailDto>> {
    const partner = await this.adminService.updatePartnerSettings(id, dto);
    return { data: partner };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VENDORS (DASHBOARD)
  // ─────────────────────────────────────────────────────────────────────────

  @Get('vendors')
  @RequirePermission('vendor:read')
  @ApiOperation({
    summary: 'List vendors (admin dashboard)',
    description: 'Partner-scoped vendor listing with aggregate counts for dashboard use.',
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
      'Partner-scoped listing listing with vendor details and counts for moderation views.',
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
