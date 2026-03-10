import {
  Body,
  Controller,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';
import { ApiResponse as SuccessResponse } from '@shared/responses';

import {
  CreateTenancyDto,
  UpdateTenancyDto,
  TenancyQueryDto,
  ConfirmBookingDto,
  ConfirmDepositDto,
  RequestTerminationDto,
  TerminateTenancyDto,
  ExtendTenancyDto,
  TransitionTenancyDto,
} from './dto';
import {
  TenancyService,
  TenancyListResult,
} from './tenancy.service';
import { TenancyView, TenancyDetailView, TenancyStatusHistoryView } from './tenancy.repository';
import { TenancyGuard, TenancyAccess, TenancyAccessLevel } from './guards';
import { ReconciliationService, StatementOfAccount } from '@modules/payment';
import { StatementQueryDto } from '@modules/payment';
import { PrismaService } from '@infrastructure/database';

interface AuthenticatedRequest {
  user: {
    sub: string;
    partnerId: string;
    role: Role;
  };
}

@ApiTags('Tenancies')
@ApiBearerAuth()
@Controller('tenancies')
@UseGuards(JwtAuthGuard, RolesGuard, TenancyGuard)
export class TenancyController {
  constructor(
    private readonly tenancyService: TenancyService,
    private readonly reconciliationService: ReconciliationService,
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CRUD OPERATIONS
  // =========================

  @Post()
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.CUSTOMER, Role.TENANT)
  @TenancyAccess(TenancyAccessLevel.FULL)
  @ApiOperation({ summary: 'Create new tenancy (booking application)' })
  @ApiResponse({ status: 201, description: 'Tenancy created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or listing not partner-managed' })
  @ApiResponse({ status: 404, description: 'Listing or tenant not found' })
  @ApiResponse({ status: 409, description: 'Listing already has active tenancy' })
  async create(
    @Body() dto: CreateTenancyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.create(dto, req.user.sub);
    return { data: tenancy };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.TENANT)
  @ApiOperation({ summary: 'List tenancies with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of tenancies' })
  async list(
    @Query() query: TenancyQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyListResult>> {
    // For TENANT role, filter to their own tenancies
    if (req.user.role === Role.TENANT) {
      // Get tenant ID from user
      // Service will handle filtering
    }

    // For VENDOR, filter to their properties
    if (req.user.role === Role.VENDOR_ADMIN || req.user.role === Role.VENDOR_STAFF) {
      const primaryVendor = await this.prisma.userVendor.findFirst({
        where: { userId: req.user.sub, isPrimary: true },
        select: { vendorId: true },
      });
      if (primaryVendor) {
        query.ownerId = primaryVendor.vendorId;
      }
    }

    const result = await this.tenancyService.list(query);
    return { data: result };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.TENANT)
  @TenancyAccess(TenancyAccessLevel.SELF_ONLY)
  @ApiOperation({ summary: 'Get tenancy by ID' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Tenancy details' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.getById(id);
    return { data: tenancy };
  }

  @Patch(':id')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @TenancyAccess(TenancyAccessLevel.SELF_ONLY)
  @ApiOperation({ summary: 'Update tenancy details (non-status fields)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Tenancy updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update after active' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenancyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyView>> {
    const tenancy = await this.tenancyService.update(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Get(':id/history')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.TENANT)
  @TenancyAccess(TenancyAccessLevel.SELF_ONLY)
  @ApiOperation({ summary: 'Get tenancy status history' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Status history' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async getHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<TenancyStatusHistoryView[]>> {
    const history = await this.tenancyService.getStatusHistory(id);
    return { data: history };
  }

  @Get(':id/statement')
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF, Role.TENANT)
  @TenancyAccess(TenancyAccessLevel.SELF_ONLY)
  @ApiOperation({ summary: 'Get statement of account for a tenancy' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Statement period start (ISO 8601)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Statement period end (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Statement of account with billing/payment entries and running balance' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async getStatementOfAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: StatementQueryDto,
  ): Promise<SuccessResponse<StatementOfAccount>> {
    const statement = await this.reconciliationService.getStatementOfAccount(id, query);
    return { data: statement };
  }

  // =========================
  // WORKFLOW TRANSITIONS
  // =========================

  @Post(':id/confirm-booking')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenancyAccess(TenancyAccessLevel.OWNER_PROPERTIES)
  @ApiOperation({ summary: 'Confirm booking (DRAFT → BOOKED)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Booking confirmed' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async confirmBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmBookingDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.confirmBooking(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Post(':id/confirm-deposit')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenancyAccess(TenancyAccessLevel.OWNER_PROPERTIES)
  @ApiOperation({ summary: 'Confirm deposit payment (BOOKED → DEPOSIT_PAID)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Deposit confirmed' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async confirmDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmDepositDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.confirmDeposit(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Post(':id/submit-contract')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenancyAccess(TenancyAccessLevel.OWNER_PROPERTIES)
  @ApiOperation({ summary: 'Submit contract for signing (DEPOSIT_PAID → CONTRACT_PENDING)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Contract submitted' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async submitContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionTenancyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.submitContract(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenancyAccess(TenancyAccessLevel.OWNER_PROPERTIES)
  @ApiOperation({ summary: 'Activate tenancy (CONTRACT_PENDING → ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Tenancy activated' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionTenancyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.activate(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Post(':id/request-termination')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @TenancyAccess(TenancyAccessLevel.SELF_ONLY)
  @ApiOperation({ summary: 'Request termination (ACTIVE → TERMINATION_REQUESTED)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Termination requested' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async requestTermination(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestTerminationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.requestTermination(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenancyAccess(TenancyAccessLevel.OWNER_PROPERTIES)
  @ApiOperation({ summary: 'Complete termination (TERMINATION_REQUESTED → TERMINATED)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Tenancy terminated' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateTenancyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.terminate(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Post(':id/extend')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @TenancyAccess(TenancyAccessLevel.OWNER_PROPERTIES)
  @ApiOperation({ summary: 'Extend tenancy (ACTIVE → EXTENDED)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Tenancy extended' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async extend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendTenancyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.extend(id, dto, req.user.sub);
    return { data: tenancy };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @TenancyAccess(TenancyAccessLevel.SELF_ONLY)
  @ApiOperation({ summary: 'Cancel tenancy (DRAFT/BOOKED → TERMINATED)' })
  @ApiParam({ name: 'id', description: 'Tenancy UUID' })
  @ApiResponse({ status: 200, description: 'Tenancy cancelled' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionTenancyDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SuccessResponse<TenancyDetailView>> {
    const tenancy = await this.tenancyService.cancel(id, dto, req.user.sub);
    return { data: tenancy };
  }
}
