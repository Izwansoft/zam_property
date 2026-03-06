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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role, TenantStatus } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantQueryDto,
  RequestDocumentUploadDto,
  ConfirmDocumentUploadDto,
  VerifyDocumentDto,
  RunScreeningDto,
  UpdateScreeningResultDto,
} from './dto';
import { TenantService, TenantListResult, DocumentUploadResponse } from './tenant.service';
import { TenantView, TenantDetailView, TenantDocumentView } from './tenant.repository';
import { TenantGuard, TenantAccess, TenantAccessLevel } from './guards';

interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: Role;
    vendorId?: string;
  };
}

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // LIST & GET
  // ─────────────────────────────────────────────────────────────────────────

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.TENANT)
  @TenantAccess(TenantAccessLevel.VENDOR_PROPERTIES)
  @ApiOperation({
    summary: 'List tenants',
    description:
      'Get a paginated list of tenants. TENANT role sees only own profile. VENDOR roles see tenants in their properties. Admins see all.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tenants',
  })
  async listTenants(
    @Query() query: TenantQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenantListResult>> {
    // If user is tenant, fetch their own profile only
    if (req.user.role === Role.TENANT) {
      const tenant = await this.tenantService.getTenantByUserId(req.user.sub);
      return {
        data: {
          items: tenant ? [tenant] : [],
          pagination: { page: 1, pageSize: 1, totalItems: tenant ? 1 : 0, totalPages: 1 },
        },
      };
    }

    // If user is vendor, filter by vendor's properties
    if (
      (req.user.role === Role.VENDOR_ADMIN || req.user.role === Role.VENDOR_STAFF) &&
      req.user.vendorId
    ) {
      const tenants = await this.tenantService.getTenantsByVendorId(req.user.vendorId);
      return {
        data: {
          items: tenants,
          pagination: { page: 1, pageSize: tenants.length, totalItems: tenants.length, totalPages: 1 },
        },
      };
    }

    // Admins get full list with pagination
    const result = await this.tenantService.listTenants(query);
    return { data: result };
  }

  @Get('me')
  @Roles(Role.TENANT, Role.CUSTOMER)
  @ApiOperation({
    summary: 'Get my tenant profile',
    description: 'Get the tenant profile for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant profile',
  })
  @ApiResponse({ status: 404, description: 'Tenant profile not found' })
  async getMyTenantProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenantDetailView | null>> {
    const tenant = await this.tenantService.getTenantByUserId(req.user.sub);
    if (tenant) {
      const details = await this.tenantService.getTenantByIdWithDetails(tenant.id);
      return { data: details };
    }
    return { data: null };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.TENANT)
  @TenantAccess(TenantAccessLevel.VENDOR_PROPERTIES)
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Get detailed tenant information including documents and tenancies.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<TenantDetailView>> {
    const tenant = await this.tenantService.getTenantByIdWithDetails(id);
    return { data: tenant };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE & UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.CUSTOMER, Role.TENANT)
  @ApiOperation({
    summary: 'Create tenant profile',
    description:
      'Create a new tenant profile for a user. Users can create their own profile. Admins can create for any user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant created',
  })
  @ApiResponse({ status: 409, description: 'Tenant profile already exists' })
  async createTenant(
    @Body() dto: CreateTenantDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenantView>> {
    // Customers can only create for themselves
    if (req.user.role === Role.CUSTOMER || req.user.role === Role.TENANT) {
      dto.userId = req.user.sub;
    }

    const tenant = await this.tenantService.createTenant(dto);
    return { data: tenant };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.TENANT)
  @TenantAccess(TenantAccessLevel.SELF_ONLY)
  @ApiOperation({
    summary: 'Update tenant profile',
    description: 'Update tenant profile information. Tenants can update their own profile.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<SuccessResponse<TenantView>> {
    const tenant = await this.tenantService.updateTenant(id, dto);
    return { data: tenant };
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenantAccess(TenantAccessLevel.FULL)
  @ApiOperation({
    summary: 'Update tenant status',
    description: 'Update tenant status. Admin action only.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
  })
  async updateTenantStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: TenantStatus },
  ): Promise<SuccessResponse<TenantView>> {
    const tenant = await this.tenantService.updateTenantStatus(id, body.status);
    return { data: tenant };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTS
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/documents')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.TENANT)
  @TenantAccess(TenantAccessLevel.SELF_ONLY)
  @ApiOperation({
    summary: 'Request document upload URL',
    description:
      'Request a presigned URL to upload a document. Returns URL valid for 1 hour.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Upload URL generated',
  })
  async requestDocumentUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestDocumentUploadDto,
  ): Promise<SuccessResponse<DocumentUploadResponse>> {
    const response = await this.tenantService.requestDocumentUpload(id, dto);
    return { data: response };
  }

  @Post(':id/documents/:documentId/confirm')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.TENANT)
  @TenantAccess(TenantAccessLevel.SELF_ONLY)
  @ApiOperation({
    summary: 'Confirm document upload',
    description: 'Confirm that a document has been uploaded to S3.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiParam({ name: 'documentId', description: 'Document UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Upload confirmed',
  })
  async confirmDocumentUpload(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: ConfirmDocumentUploadDto,
  ): Promise<SuccessResponse<TenantDocumentView>> {
    const document = await this.tenantService.confirmDocumentUpload(documentId, dto.storageKey);
    return { data: document };
  }

  @Get(':id/documents')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.TENANT)
  @TenantAccess(TenantAccessLevel.VENDOR_PROPERTIES)
  @ApiOperation({
    summary: 'Get tenant documents',
    description: 'Get all documents for an tenant.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'List of documents',
  })
  async getTenantDocuments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<TenantDocumentView[]>> {
    const documents = await this.tenantService.getTenantDocuments(id);
    return { data: documents };
  }

  @Delete(':id/documents/:documentId')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.TENANT)
  @TenantAccess(TenantAccessLevel.SELF_ONLY)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete a document. Tenants can delete their own documents.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiParam({ name: 'documentId', description: 'Document UUID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ): Promise<void> {
    await this.tenantService.deleteDocument(documentId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/documents/:documentId/verify')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @TenantAccess(TenantAccessLevel.FULL)
  @ApiOperation({
    summary: 'Verify document',
    description: 'Verify or unverify an tenant document. Admin action.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiParam({ name: 'documentId', description: 'Document UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Document verification updated',
  })
  async verifyDocument(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: VerifyDocumentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenantDocumentView>> {
    const document = await this.tenantService.verifyDocument(documentId, dto, req.user.sub);
    return { data: document };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENING
  // ─────────────────────────────────────────────────────────────────────────

  @Post(':id/screen')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenantAccess(TenantAccessLevel.VENDOR_PROPERTIES)
  @ApiOperation({
    summary: 'Run screening',
    description:
      'Run screening process for an tenant. Uses mock scoring for MVP.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Screening completed',
  })
  async runScreening(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RunScreeningDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenantView>> {
    const tenant = await this.tenantService.runScreening(id, dto, req.user.sub);
    return { data: tenant };
  }

  @Patch(':id/screening')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @TenantAccess(TenantAccessLevel.FULL)
  @ApiOperation({
    summary: 'Update screening result',
    description: 'Manually update screening result. Admin override.',
  })
  @ApiParam({ name: 'id', description: 'Tenant UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Screening result updated',
  })
  async updateScreeningResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScreeningResultDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenantView>> {
    const tenant = await this.tenantService.updateScreeningResult(id, dto, req.user.sub);
    return { data: tenant };
  }
}
