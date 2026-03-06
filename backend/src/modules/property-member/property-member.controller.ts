/**
 * PropertyMemberController
 * Property-level access control — REST endpoints for managing property team members.
 *
 * Routes:
 *   POST   /properties/:listingId/members          — Add member
 *   GET    /properties/:listingId/members          — List members
 *   PATCH  /properties/:listingId/members/:memberId — Update member role
 *   DELETE /properties/:listingId/members/:memberId — Remove member
 *   GET    /my/properties                           — My assigned properties
 *   GET    /my/properties/:listingId/role           — My role on a property
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
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/rbac/guards/roles.guard';
import { Roles } from '@core/rbac/decorators/roles.decorator';
import {
  PropertyMemberService,
  PropertyMemberView,
  PropertyMemberListResult,
  MyPropertyView,
} from './property-member.service';
import {
  AddPropertyMemberDto,
  UpdatePropertyMemberDto,
  PropertyMemberQueryDto,
} from './dto';

interface SuccessResponse<T> {
  data: T;
}

// ============================================
// PROPERTY-SCOPED ROUTES: /properties/:listingId/members
// ============================================

@ApiTags('Property Members')
@ApiBearerAuth()
@Controller('properties/:listingId/members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertyMemberController {
  constructor(private readonly propertyMemberService: PropertyMemberService) {}

  // ============================================
  // POST /properties/:listingId/members
  // ============================================

  @Post()
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to a property' })
  @ApiParam({ name: 'listingId', description: 'Listing/Property ID' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 404, description: 'Listing or user not found' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  @ApiResponse({ status: 403, description: 'Insufficient permission to manage members' })
  async addMember(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Body() dto: AddPropertyMemberDto,
    @Request() req: any,
  ): Promise<SuccessResponse<PropertyMemberView>> {
    const data = await this.propertyMemberService.addMember(
      listingId,
      dto,
      req.user.sub,
      req.user.role,
    );
    return { data };
  }

  // ============================================
  // GET /properties/:listingId/members
  // ============================================

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @ApiOperation({ summary: 'List members of a property' })
  @ApiParam({ name: 'listingId', description: 'Listing/Property ID' })
  @ApiResponse({ status: 200, description: 'Members listed successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async listMembers(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Query() query: PropertyMemberQueryDto,
  ): Promise<SuccessResponse<PropertyMemberListResult>> {
    const data = await this.propertyMemberService.listMembers(listingId, query);
    return { data };
  }

  // ============================================
  // PATCH /properties/:listingId/members/:memberId
  // ============================================

  @Patch(':memberId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @ApiOperation({ summary: 'Update a property member role' })
  @ApiParam({ name: 'listingId', description: 'Listing/Property ID' })
  @ApiParam({ name: 'memberId', description: 'Property member ID' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot change own role' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permission' })
  async updateMember(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdatePropertyMemberDto,
    @Request() req: any,
  ): Promise<SuccessResponse<PropertyMemberView>> {
    const data = await this.propertyMemberService.updateMember(
      listingId,
      memberId,
      dto,
      req.user.sub,
      req.user.role,
    );
    return { data };
  }

  // ============================================
  // DELETE /properties/:listingId/members/:memberId
  // ============================================

  @Delete(':memberId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a property (soft delete)' })
  @ApiParam({ name: 'listingId', description: 'Listing/Property ID' })
  @ApiParam({ name: 'memberId', description: 'Property member ID' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove only admin' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permission' })
  async removeMember(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Request() req: any,
  ): Promise<void> {
    await this.propertyMemberService.removeMember(
      listingId,
      memberId,
      req.user.sub,
      req.user.role,
    );
  }
}

// ============================================
// MY PROPERTIES ROUTES: /my/properties
// ============================================

@ApiTags('My Properties')
@ApiBearerAuth()
@Controller('my/properties')
@UseGuards(JwtAuthGuard)
export class MyPropertiesController {
  constructor(private readonly propertyMemberService: PropertyMemberService) {}

  // ============================================
  // GET /my/properties
  // ============================================

  @Get()
  @ApiOperation({ summary: 'List properties assigned to me' })
  @ApiResponse({ status: 200, description: 'My properties listed' })
  async getMyProperties(
    @Request() req: any,
  ): Promise<SuccessResponse<MyPropertyView[]>> {
    const data = await this.propertyMemberService.getMyProperties(req.user.sub);
    return { data };
  }

  // ============================================
  // GET /my/properties/:listingId/role
  // ============================================

  @Get(':listingId/role')
  @ApiOperation({ summary: 'Get my role on a specific property' })
  @ApiParam({ name: 'listingId', description: 'Listing/Property ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved (null if no assignment)' })
  async getMyRole(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @Request() req: any,
  ): Promise<SuccessResponse<{ role: string } | null>> {
    const data = await this.propertyMemberService.getMyRole(listingId, req.user.sub);
    return { data };
  }
}
