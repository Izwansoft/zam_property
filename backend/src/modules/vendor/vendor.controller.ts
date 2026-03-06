import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorQueryDto,
  VendorResponseDto,
  VendorDetailResponseDto,
  ApproveVendorDto,
  RejectVendorDto,
  SuspendVendorDto,
  ReactivateVendorDto,
  UpdateVendorProfileDto,
  UpdateVendorSettingsDto,
} from './dto';
import { VendorService } from './vendor.service';

interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: Role;
    vendorId?: string;
  };
}

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // LIST & GET
  // ─────────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'List vendors',
    description:
      'Get a paginated list of vendors within the partner. Requires SUPER_ADMIN, PARTNER_ADMIN, or VENDOR_ADMIN role.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vendors',
    type: [VendorResponseDto],
  })
  async listVendors(@Query() query: VendorQueryDto): Promise<
    SuccessResponse<{
      items: VendorResponseDto[];
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
    }>
  > {
    const result = await this.vendorService.listVendors({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      vendorType: query.vendorType,
      search: query.search,
    });

    return {
      data: {
        items: result.items,
        pagination: result.pagination,
      },
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({
    summary: 'Get vendor by ID',
    description: 'Get detailed vendor information including profile and settings.',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Vendor details',
    type: VendorDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<VendorDetailResponseDto>> {
    const vendor = await this.vendorService.getVendorByIdWithDetails(id);
    return { data: vendor };
  }

  @Get('by-slug/:slug')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get vendor by slug',
    description: 'Get vendor information by URL-friendly slug.',
  })
  @ApiParam({ name: 'slug', description: 'Vendor slug', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Vendor details',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorBySlug(@Param('slug') slug: string): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.getVendorBySlug(slug);
    return { data: vendor };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE & UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Create vendor',
    description:
      'Create a new vendor. Requires SUPER_ADMIN or PARTNER_ADMIN role. New vendors start in PENDING status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Vendor created',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Vendor already exists' })
  async createVendor(@Body() dto: CreateVendorDto): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.createVendor(dto);
    return { data: vendor };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Update vendor',
    description: 'Update vendor basic information. VENDOR_ADMIN can only update their own vendor.',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Vendor updated',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    // VENDOR_ADMIN can only update their own vendor
    if (req.user.role === Role.VENDOR_ADMIN) {
      await this.vendorService.assertUserCanManageVendor(id, req.user.vendorId);
    }

    const vendor = await this.vendorService.updateVendor(id, dto);
    return { data: vendor };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Delete vendor',
    description: 'Soft delete a vendor. Requires SUPER_ADMIN or PARTNER_ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Vendor deleted' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async deleteVendor(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.vendorService.deleteVendor(id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS WORKFLOW ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/actions/approve')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve vendor',
    description: 'Approve a pending vendor. Transitions: PENDING → APPROVED',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Vendor approved',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async approveVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.approveVendor(id, req.user.sub);
    return { data: vendor };
  }

  @Post(':id/actions/reject')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject vendor',
    description: 'Reject a pending vendor with reason. Transitions: PENDING → REJECTED',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Vendor rejected',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async rejectVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.rejectVendor(id, req.user.sub, dto.reason);
    return { data: vendor };
  }

  @Post(':id/actions/suspend')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspend vendor',
    description: 'Suspend an approved vendor. Transitions: APPROVED → SUSPENDED',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Vendor suspended',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async suspendVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.suspendVendor(id, req.user.sub, dto.reason);
    return { data: vendor };
  }

  @Post(':id/actions/reactivate')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reactivate vendor',
    description:
      'Reactivate a suspended or rejected vendor. Transitions: SUSPENDED/REJECTED → APPROVED',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Vendor reactivated',
    type: VendorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async reactivateVendor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactivateVendorDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorResponseDto>> {
    const vendor = await this.vendorService.reactivateVendor(id, req.user.sub);
    return { data: vendor };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROFILE & SETTINGS
  // ─────────────────────────────────────────────────────────────────────────

  @Patch(':id/profile')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Update vendor profile',
    description: 'Update vendor profile information (business details, address, branding).',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: VendorDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateVendorProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorProfileDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorDetailResponseDto>> {
    // VENDOR_ADMIN can only update their own vendor
    if (req.user.role === Role.VENDOR_ADMIN) {
      await this.vendorService.assertUserCanManageVendor(id, req.user.vendorId);
    }

    const vendor = await this.vendorService.updateVendorProfile(id, dto);
    return { data: vendor };
  }

  @Patch(':id/settings')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Update vendor settings',
    description: 'Update vendor settings (notifications, auto-response, privacy).',
  })
  @ApiParam({ name: 'id', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Settings updated',
    type: VendorDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateVendorSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorSettingsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<VendorDetailResponseDto>> {
    // VENDOR_ADMIN can only update their own vendor
    if (req.user.role === Role.VENDOR_ADMIN) {
      await this.vendorService.assertUserCanManageVendor(id, req.user.vendorId);
    }

    const vendor = await this.vendorService.updateVendorSettings(id, dto);
    return { data: vendor };
  }
}
