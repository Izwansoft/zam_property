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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';
import { Request } from 'express';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import {
  CreateListingDto,
  UpdateListingDto,
  ListingQueryDto,
  ListingResponseDto,
  ListingDetailResponseDto,
  PublishListingDto,
  UnpublishListingDto,
  ArchiveListingDto,
  ExpireListingDto,
  FeatureListingDto,
} from './dto';
import { ListingService } from './listing.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    partnerId: string;
    role: Role;
  };
}

@ApiTags('Listings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // LIST & GET
  // ─────────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.CUSTOMER)
  @ApiOperation({
    summary: 'List listings',
    description:
      'Get a paginated list of listings within the partner. Supports filtering by status, vertical type, vendor, and more.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of listings',
    type: [ListingResponseDto],
  })
  async listListings(@Query() query: ListingQueryDto): Promise<
    SuccessResponse<{
      items: ListingResponseDto[];
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
    }>
  > {
    const result = await this.listingService.listListings({
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      verticalType: query.verticalType,
      vendorId: query.vendorId,
      search: query.search,
      isFeatured: query.isFeatured,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      city: query.city,
      state: query.state,
      sortBy: query.sortBy as 'createdAt' | 'updatedAt' | 'price' | 'title' | undefined,
      sortOrder: query.sortOrder,
    });

    return {
      data: {
        items: result.items,
        pagination: result.pagination,
      },
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get listing by ID',
    description: 'Get detailed listing information including vendor and media.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing details',
    type: ListingDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListingById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<ListingDetailResponseDto>> {
    const listing = await this.listingService.getListingByIdWithDetails(id);
    // Increment view count (fire and forget)
    void this.listingService.incrementViewCount(id);
    return { data: listing };
  }

  @Get('by-slug/:slug')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get listing by slug',
    description: 'Get listing information by URL-friendly slug.',
  })
  @ApiParam({ name: 'slug', description: 'Listing slug', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing details',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListingBySlug(
    @Param('slug') slug: string,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.getListingBySlug(slug);
    return { data: listing };
  }

  @Get('vendor/:vendorId')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({
    summary: 'Get listings by vendor',
    description: 'Get all listings for a specific vendor.',
  })
  @ApiParam({ name: 'vendorId', description: 'Vendor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'List of vendor listings',
    type: [ListingResponseDto],
  })
  async getVendorListings(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<
    SuccessResponse<{
      items: ListingResponseDto[];
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
    }>
  > {
    const result = await this.listingService.getVendorListings(vendorId, { page, pageSize });
    return {
      data: {
        items: result.items,
        pagination: result.pagination,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE & UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({
    summary: 'Create listing',
    description:
      'Create a new listing submission. SUPER_ADMIN/PARTNER_ADMIN can create directly. VENDOR_ADMIN, COMPANY_ADMIN, and AGENT can submit to vendors they are assigned to. New listings always start in DRAFT status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Listing created',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Listing already exists' })
  async createListing(
    @Body() dto: CreateListingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.createListing({
      vendorId: dto.vendorId,
      verticalType: dto.verticalType,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      currency: dto.currency,
      priceType: dto.priceType,
      location: dto.location as Prisma.InputJsonValue | undefined,
      attributes: dto.attributes as Prisma.InputJsonValue | undefined,
      actor: {
        userId: req.user.sub,
        role: req.user.role,
      },
    });
    return { data: listing };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Update listing',
    description: 'Update an existing listing. Only DRAFT and PUBLISHED listings can be updated.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing updated',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async updateListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.updateListing(id, {
      title: dto.title,
      description: dto.description,
      price: dto.price,
      currency: dto.currency,
      priceType: dto.priceType,
      location: dto.location as Prisma.InputJsonValue | undefined,
      attributes: dto.attributes as Prisma.InputJsonValue | undefined,
      isFeatured: dto.isFeatured,
      featuredUntil: dto.featuredUntil ? new Date(dto.featuredUntil) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return { data: listing };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete listing',
    description: 'Soft delete a listing.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Listing deleted' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async deleteListing(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.listingService.deleteListing(id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATUS WORKFLOW ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/publish')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish listing',
    description: 'Publish a DRAFT listing. Transitions status from DRAFT to PUBLISHED.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing published',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
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

  @Post(':id/unpublish')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unpublish listing',
    description: 'Unpublish a PUBLISHED listing. Transitions status back to DRAFT.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing unpublished',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async unpublishListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UnpublishListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.unpublishListing(id, dto.reason);
    return { data: listing };
  }

  @Post(':id/expire')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expire listing',
    description: 'Expire a PUBLISHED listing. Transitions status from PUBLISHED to EXPIRED.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing expired',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async expireListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExpireListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.expireListing(id, dto.reason);
    return { data: listing };
  }

  @Post(':id/archive')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive listing',
    description: 'Archive a listing. Can transition from DRAFT, PUBLISHED, or EXPIRED to ARCHIVED.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing archived',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async archiveListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ArchiveListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.archiveListing(id, dto.reason);
    return { data: listing };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FEATURED LISTING ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/feature')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Feature listing',
    description: 'Mark a listing as featured until a specified date.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing featured',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid featured date' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async featureListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FeatureListingDto,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.featureListing(id, new Date(dto.featuredUntil));
    return { data: listing };
  }

  @Post(':id/unfeature')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unfeature listing',
    description: 'Remove featured status from a listing.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Listing unfeatured',
    type: ListingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async unfeatureListing(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<ListingResponseDto>> {
    const listing = await this.listingService.unfeatureListing(id);
    return { data: listing };
  }
}
