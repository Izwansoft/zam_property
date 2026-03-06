import {
  Controller,
  Get,
  Post,
  Patch,
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
import { InspectionService } from './inspection.service';
import {
  CreateInspectionDto,
  UpdateChecklistDto,
  CompleteInspectionDto,
  InspectionQueryDto,
  RequestVideoDto,
  SubmitVideoDto,
  ReviewVideoDto,
} from './dto';

interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: string;
    vendorId?: string;
  };
}

interface SuccessResponse<T> {
  data: T;
}

@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  // ============================================
  // POST /inspections - Schedule inspection
  // ============================================

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a new inspection' })
  @ApiResponse({ status: 201, description: 'Inspection scheduled successfully' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async scheduleInspection(
    @Body() dto: CreateInspectionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.scheduleInspection(dto, req.user.sub);
    return { data };
  }

  // ============================================
  // GET /inspections - List inspections
  // ============================================

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'List inspections with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of inspections' })
  async listInspections(
    @Query() query: InspectionQueryDto,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.listInspections(query);
    return { data };
  }

  // ============================================
  // GET /inspections/:id - Get inspection detail
  // ============================================

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Get inspection details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Inspection details' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async getInspection(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.getInspection(id);
    return { data };
  }

  // ============================================
  // PATCH /inspections/:id/checklist - Update checklist
  // ============================================

  @Patch(':id/checklist')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Update inspection checklist items' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Checklist updated' })
  @ApiResponse({ status: 400, description: 'Cannot update completed inspection' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async updateChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChecklistDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.updateChecklist(id, dto, req.user.sub);
    return { data };
  }

  // ============================================
  // POST /inspections/:id/complete - Complete inspection
  // ============================================

  @Post(':id/complete')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete an inspection with rating' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Inspection completed' })
  @ApiResponse({ status: 400, description: 'Inspection already completed' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async completeInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteInspectionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.completeInspection(id, dto, req.user.sub);
    return { data };
  }

  // ============================================
  // GET /inspections/:id/report - Generate/get report
  // ============================================

  @Get(':id/report')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Generate or retrieve inspection report' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Report URL' })
  @ApiResponse({ status: 400, description: 'Inspection not yet completed' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async getReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.generateReport(id, req.user.sub);
    return { data };
  }

  // ============================================
  // POST /inspections/:id/request-video - Request video from tenant
  // ============================================

  @Post(':id/request-video')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request video inspection from tenant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Video requested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status for video request' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async requestVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestVideoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.requestVideo(id, dto, req.user.sub);
    return { data };
  }

  // ============================================
  // POST /inspections/:id/submit-video - Submit video (get presigned upload URL)
  // ============================================

  @Post(':id/submit-video')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit video for inspection (returns presigned upload URL)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Presigned upload URL and inspection data' })
  @ApiResponse({ status: 400, description: 'Invalid status for video submission' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async submitVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitVideoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.submitVideo(id, dto, req.user.sub);
    return { data };
  }

  // ============================================
  // POST /inspections/:id/review-video - Review submitted video
  // ============================================

  @Post(':id/review-video')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review submitted video (approve or request redo)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Video reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Can only review when video is submitted' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  async reviewVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewVideoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<any>> {
    const data = await this.inspectionService.reviewVideo(id, dto, req.user.sub);
    return { data };
  }

  // ============================================
  // GET /inspections/:id/video - Get video download URL
  // ============================================

  @Get(':id/video')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Get presigned download URL for inspection video' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Video download URL' })
  @ApiResponse({ status: 404, description: 'No video found for this inspection' })
  async getVideoDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<any>> {
    const url = await this.inspectionService.getVideoDownloadUrl(id);
    return { data: { url } };
  }
}
