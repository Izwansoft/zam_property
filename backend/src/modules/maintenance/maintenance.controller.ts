import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';

import { MaintenanceService, MaintenanceView, AttachmentView, UpdateView } from './maintenance.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  MaintenanceQueryDto,
  AddAttachmentDto,
  AddUpdateDto,
  VerifyMaintenanceDto,
  AssignMaintenanceDto,
  ResolveMaintenanceDto,
  CloseMaintenanceDto,
  CancelMaintenanceDto,
} from './dto';

/**
 * Standard success response wrapper
 */
interface SuccessResponse<T> {
  data: T;
}

/**
 * Authenticated request with JWT payload
 */
interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: Role;
    vendorId?: string;
  };
}

/**
 * Controller for managing maintenance tickets
 */
@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // =========================
  // TICKET CRUD
  // =========================

  /**
   * Create a new maintenance ticket
   */
  @Post()
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
    Role.CUSTOMER,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Create a new maintenance ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or tenancy not active' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async create(
    @Body() dto: CreateMaintenanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.createTicket(dto, req.user.sub);
    return { data: ticket };
  }

  /**
   * List maintenance tickets with filters
   */
  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
    Role.CUSTOMER,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'List maintenance tickets with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of maintenance tickets' })
  async list(
    @Query() query: MaintenanceQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<
    SuccessResponse<{
      data: MaintenanceView[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    const result = await this.maintenanceService.listTickets(
      query,
      req.user.sub,
      req.user.role,
    );
    return { data: result };
  }

  /**
   * Get a single maintenance ticket by ID
   */
  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
    Role.CUSTOMER,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get a maintenance ticket by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Maintenance ticket details' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.getTicket(
      id,
      req.user.sub,
      req.user.role,
    );
    return { data: ticket };
  }

  /**
   * Update a maintenance ticket
   */
  @Patch(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @ApiOperation({ summary: 'Update a maintenance ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update closed/cancelled ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.updateTicket(id, dto, req.user.sub);
    return { data: ticket };
  }

  // =========================
  // ATTACHMENTS
  // =========================

  /**
   * Add an attachment to a maintenance ticket
   * Returns a presigned upload URL for S3
   */
  @Post(':id/attachments')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
    Role.CUSTOMER,
    Role.TENANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add an attachment to a maintenance ticket',
    description: 'Returns a presigned upload URL. Client must upload the file to the returned URL.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Attachment record created with presigned upload URL',
  })
  @ApiResponse({ status: 400, description: 'Cannot add attachments to closed/cancelled ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async addAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddAttachmentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<
    SuccessResponse<{
      attachment: AttachmentView;
      uploadUrl: string;
      expiresAt: Date;
    }>
  > {
    const result = await this.maintenanceService.addAttachment(id, dto, req.user.sub);
    return { data: result };
  }

  // =========================
  // COMMENTS / UPDATES
  // =========================

  /**
   * Add a comment/update to a maintenance ticket
   */
  @Post(':id/comments')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
    Role.CUSTOMER,
    Role.TENANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment or update to a maintenance ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 400, description: 'Cannot add comments to closed/cancelled ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddUpdateDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<UpdateView>> {
    const update = await this.maintenanceService.addUpdate(id, dto, req.user.sub);
    return { data: update };
  }

  // =========================
  // WORKFLOW ACTIONS
  // =========================

  /**
   * Verify a maintenance ticket (OPEN → VERIFIED)
   */
  @Post(':id/verify')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a maintenance ticket',
    description: 'Admin/vendor confirms the issue is valid. Transitions OPEN → VERIFIED.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyMaintenanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.verifyTicket(id, dto, req.user.sub);
    return { data: ticket };
  }

  /**
   * Assign a maintenance ticket (VERIFIED → ASSIGNED)
   * Supports vendor staff or external contractor
   */
  @Post(':id/assign')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign a maintenance ticket',
    description: 'Assign to vendor staff or external contractor. Transitions VERIFIED → ASSIGNED.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state transition or missing assignee' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMaintenanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.assignTicket(id, dto, req.user.sub);
    return { data: ticket };
  }

  /**
   * Start work on a maintenance ticket (ASSIGNED → IN_PROGRESS)
   */
  @Post(':id/start')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start work on a maintenance ticket',
    description: 'Mark that work has started. Transitions ASSIGNED → IN_PROGRESS.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Work started on ticket' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async start(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.startWork(id, req.user.sub);
    return { data: ticket };
  }

  /**
   * Resolve a maintenance ticket (IN_PROGRESS → PENDING_APPROVAL)
   * Records resolution details and actual cost
   */
  @Post(':id/resolve')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
    Role.VENDOR_STAFF,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve a maintenance ticket',
    description: 'Mark work as completed with resolution details. Transitions IN_PROGRESS → PENDING_APPROVAL.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket resolved, awaiting approval' })
  @ApiResponse({ status: 400, description: 'Invalid state transition or missing resolution' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveMaintenanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.resolveTicket(id, dto, req.user.sub);
    return { data: ticket };
  }

  /**
   * Close a maintenance ticket (PENDING_APPROVAL | CLAIM_APPROVED → CLOSED)
   */
  @Post(':id/close')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Close a maintenance ticket',
    description: 'Fully close a resolved ticket. Transitions PENDING_APPROVAL | CLAIM_APPROVED → CLOSED.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket closed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseMaintenanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.closeTicket(id, dto, req.user.sub);
    return { data: ticket };
  }

  /**
   * Cancel a maintenance ticket (OPEN | VERIFIED | ASSIGNED → CANCELLED)
   */
  @Post(':id/cancel')
  @Roles(
    Role.SUPER_ADMIN,
    Role.PARTNER_ADMIN,
    Role.VENDOR_ADMIN,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a maintenance ticket',
    description: 'Cancel an unstarted ticket. Transitions OPEN | VERIFIED | ASSIGNED → CANCELLED.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Ticket cancelled' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelMaintenanceDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<MaintenanceView>> {
    const ticket = await this.maintenanceService.cancelTicket(id, dto, req.user.sub);
    return { data: ticket };
  }
}
