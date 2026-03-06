/**
 * CompanyController
 * Session 8.1 - Company Module
 *
 * REST endpoints for company management.
 * Base path: /companies
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
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
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
import { CompanyService, CompanyView, CompanyAdminView, CompanyListResult } from './company.service';
import {
  RegisterCompanyDto,
  UpdateCompanyDto,
  AddCompanyAdminDto,
  CompanyQueryDto,
} from './dto';

interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: string;
  };
}

interface SuccessResponse<T> {
  data: T;
}

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // ============================================
  // POST /companies/register - Register a company
  // ============================================

  @Post('register')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new company' })
  @ApiResponse({ status: 201, description: 'Company registered successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate registration number' })
  async registerCompany(
    @Body() dto: RegisterCompanyDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<CompanyView>> {
    const data = await this.companyService.registerCompany(dto, req.user.sub);
    return { data };
  }

  // ============================================
  // GET /companies - List companies
  // ============================================

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List companies with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Companies listed successfully' })
  async listCompanies(
    @Query() query: CompanyQueryDto,
  ): Promise<SuccessResponse<CompanyListResult>> {
    const data = await this.companyService.listCompanies(query);
    return { data };
  }

  // ============================================
  // GET /companies/:id - Get company details
  // ============================================

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get company details by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company details retrieved' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompany(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<CompanyView>> {
    const data = await this.companyService.getCompany(id);
    return { data };
  }

  // ============================================
  // PATCH /companies/:id - Update company
  // ============================================

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update company details' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<SuccessResponse<CompanyView>> {
    const data = await this.companyService.updateCompany(id, dto);
    return { data };
  }

  // ============================================
  // POST /companies/:id/verify - Verify company
  // ============================================

  @Post(':id/verify')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a company (PENDING → ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async verifyCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<CompanyView>> {
    const data = await this.companyService.verifyCompany(id, req.user.sub);
    return { data };
  }

  // ============================================
  // POST /companies/:id/suspend - Suspend company
  // ============================================

  @Post(':id/suspend')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company suspended successfully' })
  @ApiResponse({ status: 400, description: 'Company already suspended' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async suspendCompany(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<CompanyView>> {
    const data = await this.companyService.suspendCompany(id);
    return { data };
  }

  // ============================================
  // POST /companies/:id/admins - Add admin
  // ============================================

  @Post(':id/admins')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an admin to a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 201, description: 'Admin added successfully' })
  @ApiResponse({ status: 404, description: 'Company or user not found' })
  @ApiResponse({ status: 409, description: 'User already an admin' })
  async addAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCompanyAdminDto,
  ): Promise<SuccessResponse<CompanyAdminView>> {
    const data = await this.companyService.addAdmin(id, dto);
    return { data };
  }

  // ============================================
  // GET /companies/:id/admins - Get admins
  // ============================================

  @Get(':id/admins')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all admins for a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company admins listed' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getAdmins(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<CompanyAdminView[]>> {
    const data = await this.companyService.getAdmins(id);
    return { data };
  }

  // ============================================
  // DELETE /companies/:id/admins/:userId - Remove admin
  // ============================================

  @Delete(':id/admins/:userId')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an admin from a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiParam({ name: 'userId', description: 'User ID of admin to remove' })
  @ApiResponse({ status: 204, description: 'Admin removed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot remove owner or last admin' })
  @ApiResponse({ status: 404, description: 'Company or admin not found' })
  async removeAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.companyService.removeAdmin(id, userId);
  }
}
