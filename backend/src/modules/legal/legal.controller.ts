/**
 * LegalController
 * Session 8.5 - Legal Module Core
 * Session 8.6 - Legal Integration & Finalization
 *
 * REST endpoints for legal case management and panel lawyer management.
 *
 * Legal Case Endpoints:
 *   POST   /legal-cases                       - Create a legal case
 *   GET    /legal-cases                       - List legal cases
 *   GET    /legal-cases/:id                   - Get case details
 *   PATCH  /legal-cases/:id                   - Update case details
 *   POST   /legal-cases/:id/assign-lawyer     - Assign a lawyer
 *   POST   /legal-cases/:id/notice            - Generate a notice
 *   POST   /legal-cases/:id/status            - Update case status
 *   POST   /legal-cases/:id/resolve           - Resolve/close a case
 *   GET    /legal-cases/:id/documents         - List case documents
 *   POST   /legal-cases/:id/documents         - Upload a document
 *
 * Panel Lawyer Endpoints:
 *   POST   /panel-lawyers                     - Create a panel lawyer
 *   GET    /panel-lawyers                     - List panel lawyers
 *   GET    /panel-lawyers/:id                 - Get lawyer details
 *   PATCH  /panel-lawyers/:id                 - Update lawyer details
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { Role, LegalCaseStatus } from '@prisma/client';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/rbac/guards/roles.guard';
import { Roles } from '@core/rbac/decorators/roles.decorator';
import {
  LegalService,
  LegalCaseView,
  LegalCaseListResult,
  LegalDocumentView,
  PanelLawyerView,
} from './legal.service';
import {
  CreateLegalCaseDto,
  UpdateLegalCaseDto,
  AssignLawyerDto,
  GenerateNoticeDto,
  LegalCaseQueryDto,
  CreatePanelLawyerDto,
  UpdatePanelLawyerDto,
  ResolveCaseDto,
  UploadLegalDocumentDto,
} from './dto';

@ApiTags('Legal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  // ============================================
  // LEGAL CASE ENDPOINTS
  // ============================================

  @Post('legal-cases')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new legal case' })
  @ApiResponse({ status: 201, description: 'Legal case created' })
  async createCase(
    @Body() dto: CreateLegalCaseDto,
  ): Promise<{ data: LegalCaseView }> {
    const data = await this.legalService.createCase(dto);
    return { data };
  }

  @Get('legal-cases')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'List legal cases (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Legal cases list' })
  async listCases(
    @Query() query: LegalCaseQueryDto,
  ): Promise<{ data: LegalCaseListResult }> {
    const data = await this.legalService.listCases(query);
    return { data };
  }

  @Get('legal-cases/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Get legal case details' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiResponse({ status: 200, description: 'Legal case details' })
  async getCase(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: LegalCaseView }> {
    const data = await this.legalService.getCase(id);
    return { data };
  }

  @Patch('legal-cases/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({ summary: 'Update legal case details' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiResponse({ status: 200, description: 'Legal case updated' })
  async updateCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLegalCaseDto,
  ): Promise<{ data: LegalCaseView }> {
    const data = await this.legalService.updateCase(id, dto);
    return { data };
  }

  @Post('legal-cases/:id/assign-lawyer')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a panel lawyer to a legal case' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiResponse({ status: 200, description: 'Lawyer assigned' })
  async assignLawyer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignLawyerDto,
  ): Promise<{ data: LegalCaseView }> {
    const data = await this.legalService.assignLawyer(id, dto);
    return { data };
  }

  @Post('legal-cases/:id/notice')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a notice document for a legal case' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiResponse({ status: 201, description: 'Notice generated' })
  async generateNotice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GenerateNoticeDto,
  ): Promise<{ data: LegalDocumentView }> {
    const data = await this.legalService.generateNotice(id, dto);
    return { data };
  }

  @Post('legal-cases/:id/status')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update legal case status' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiQuery({ name: 'status', enum: LegalCaseStatus, description: 'New status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateCaseStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: LegalCaseStatus,
  ): Promise<{ data: LegalCaseView }> {
    const data = await this.legalService.updateCaseStatus(id, status);
    return { data };
  }

  @Post('legal-cases/:id/resolve')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve and close a legal case' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiResponse({ status: 200, description: 'Case resolved' })
  async resolveCase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveCaseDto,
  ): Promise<{ data: LegalCaseView }> {
    const data = await this.legalService.resolveCase(id, dto);
    return { data };
  }

  @Get('legal-cases/:id/documents')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'List documents for a legal case' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiResponse({ status: 200, description: 'Case documents' })
  async getCaseDocuments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: LegalDocumentView[] }> {
    const data = await this.legalService.getCaseDocuments(id);
    return { data };
  }

  @Post('legal-cases/:id/documents')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload/attach a document to a legal case' })
  @ApiParam({ name: 'id', description: 'Legal case ID' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadLegalDocumentDto,
  ): Promise<{ data: LegalDocumentView }> {
    const data = await this.legalService.uploadDocument(id, dto);
    return { data };
  }

  // ============================================
  // PANEL LAWYER ENDPOINTS
  // ============================================

  @Post('panel-lawyers')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a panel lawyer' })
  @ApiResponse({ status: 201, description: 'Panel lawyer created' })
  async createPanelLawyer(
    @Body() dto: CreatePanelLawyerDto,
  ): Promise<{ data: PanelLawyerView }> {
    const data = await this.legalService.createPanelLawyer(dto);
    return { data };
  }

  @Get('panel-lawyers')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'List panel lawyers' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Filter active only (default: true)' })
  @ApiResponse({ status: 200, description: 'Panel lawyers list' })
  async listPanelLawyers(
    @Query('activeOnly') activeOnly?: string,
  ): Promise<{ data: PanelLawyerView[] }> {
    const isActiveOnly = activeOnly !== 'false';
    const data = await this.legalService.listPanelLawyers(isActiveOnly);
    return { data };
  }

  @Get('panel-lawyers/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Get panel lawyer details' })
  @ApiParam({ name: 'id', description: 'Panel lawyer ID' })
  @ApiResponse({ status: 200, description: 'Panel lawyer details' })
  async getPanelLawyer(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ data: PanelLawyerView }> {
    const data = await this.legalService.getPanelLawyer(id);
    return { data };
  }

  @Patch('panel-lawyers/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({ summary: 'Update panel lawyer details' })
  @ApiParam({ name: 'id', description: 'Panel lawyer ID' })
  @ApiResponse({ status: 200, description: 'Panel lawyer updated' })
  async updatePanelLawyer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePanelLawyerDto,
  ): Promise<{ data: PanelLawyerView }> {
    const data = await this.legalService.updatePanelLawyer(id, dto);
    return { data };
  }
}
