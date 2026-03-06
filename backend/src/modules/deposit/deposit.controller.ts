import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
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
  ApiBody,
} from '@nestjs/swagger';
import { DepositStatus } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';
import { Role } from '@prisma/client';

import { DepositService, DepositView } from './deposit.service';
import {
  CreateDepositDto,
  CreateDepositsFromTenancyDto,
  CollectDepositDto,
  ProcessRefundDto,
  AddDeductionDto,
  ForfeitDepositDto,
  FinalizeDepositDto,
  DepositQueryDto,
} from './dto';

/**
 * Controller for managing tenant deposits
 */
@ApiTags('Deposits')
@ApiBearerAuth()
@Controller('deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  /**
   * Create a new deposit
   */
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Create a new deposit' })
  @ApiResponse({
    status: 201,
    description: 'Deposit created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  @ApiResponse({ status: 409, description: 'Deposit already exists for this type' })
  async create(@Body() dto: CreateDepositDto): Promise<DepositView> {
    return this.depositService.create(dto);
  }

  /**
   * Create all deposits for a tenancy from tenancy amounts
   */
  @Post('from-tenancy')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Create all deposits for a tenancy from tenancy amounts' })
  @ApiBody({ type: CreateDepositsFromTenancyDto })
  @ApiResponse({
    status: 201,
    description: 'Deposits created successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async createFromTenancy(
    @Body() dto: CreateDepositsFromTenancyDto,
  ): Promise<DepositView[]> {
    return this.depositService.createFromTenancy(dto);
  }

  /**
   * List deposits with filtering and pagination
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({ summary: 'List deposits with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of deposits',
  })
  async findAll(@Query() query: DepositQueryDto): Promise<{
    items: DepositView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.depositService.findAll(query);
  }

  /**
   * Get deposits for a specific tenancy
   */
  @Get('tenancy/:tenancyId')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({ summary: 'Get all deposits for a specific tenancy' })
  @ApiParam({ name: 'tenancyId', description: 'Tenancy UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of deposits for the tenancy',
  })
  async findByTenancy(
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
  ): Promise<DepositView[]> {
    return this.depositService.findByTenancyId(tenancyId);
  }

  /**
   * Get deposit summary for a tenancy
   */
  @Get('tenancy/:tenancyId/summary')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({ summary: 'Get deposit summary for a tenancy' })
  @ApiParam({ name: 'tenancyId', description: 'Tenancy UUID' })
  @ApiResponse({
    status: 200,
    description: 'Deposit summary for the tenancy',
  })
  async getTenancySummary(
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
  ): Promise<{
    tenancyId: string;
    totalDeposits: number;
    totalCollected: number;
    totalRefunded: number;
    totalDeductions: number;
    totalPending: number;
    deposits: Array<{
      id: string;
      type: string;
      amount: number;
      status: DepositStatus;
      refundableAmount: number | null;
    }>;
  }> {
    return this.depositService.getTenancyDepositSummary(tenancyId);
  }

  /**
   * Calculate deductions from approved claims for a tenancy
   */
  @Get('tenancy/:tenancyId/deductions')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({
    summary: 'Calculate deductions from approved claims for a tenancy',
    description:
      'Returns all approved claims and available deposits, showing how deductions would be applied.',
  })
  @ApiParam({ name: 'tenancyId', description: 'Tenancy UUID' })
  @ApiResponse({
    status: 200,
    description: 'Deduction calculation',
  })
  async calculateDeductions(
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
  ): Promise<{
    tenancyId: string;
    claims: Array<{
      claimId: string;
      claimNumber: string;
      type: string;
      title: string;
      status: string;
      approvedAmount: number;
    }>;
    totalDeductions: number;
    deposits: Array<{
      depositId: string;
      type: string;
      amount: number;
      currentDeductions: number;
      availableForDeduction: number;
    }>;
    shortfall: number;
  }> {
    return this.depositService.calculateDeductions(tenancyId);
  }

  /**
   * Get a deposit by ID
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({ summary: 'Get a deposit by ID' })
  @ApiParam({ name: 'id', description: 'Deposit UUID' })
  @ApiResponse({
    status: 200,
    description: 'Deposit details',
  })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<DepositView> {
    return this.depositService.findById(id);
  }

  /**
   * Mark deposit as collected
   */
  @Post(':id/collect')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Mark deposit as collected' })
  @ApiParam({ name: 'id', description: 'Deposit UUID' })
  @ApiBody({ type: CollectDepositDto })
  @ApiResponse({
    status: 200,
    description: 'Deposit marked as collected',
  })
  @ApiResponse({ status: 400, description: 'Invalid deposit status' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async markCollected(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CollectDepositDto,
  ): Promise<DepositView> {
    return this.depositService.markCollected(id, dto);
  }

  /**
   * Add a deduction to the deposit
   */
  @Post(':id/deduction')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Add a deduction to the deposit' })
  @ApiParam({ name: 'id', description: 'Deposit UUID' })
  @ApiBody({ type: AddDeductionDto })
  @ApiResponse({
    status: 200,
    description: 'Deduction added',
  })
  @ApiResponse({ status: 400, description: 'Invalid deposit status or deduction exceeds amount' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async addDeduction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddDeductionDto,
  ): Promise<DepositView> {
    return this.depositService.addDeduction(id, dto);
  }

  /**
   * Calculate refund for a deposit
   */
  @Get(':id/refund-calculation')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.VENDOR_STAFF)
  @ApiOperation({ summary: 'Calculate refund amount for a deposit' })
  @ApiParam({ name: 'id', description: 'Deposit UUID' })
  @ApiResponse({
    status: 200,
    description: 'Refund calculation',
  })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async calculateRefund(@Param('id', ParseUUIDPipe) id: string): Promise<{
    depositId: string;
    depositType: string;
    originalAmount: number;
    totalDeductions: number;
    refundableAmount: number;
    canRefund: boolean;
    reason?: string;
  }> {
    return this.depositService.calculateRefund(id);
  }

  /**
   * Process refund for a deposit
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({ summary: 'Process refund for a deposit' })
  @ApiParam({ name: 'id', description: 'Deposit UUID' })
  @ApiBody({ type: ProcessRefundDto })
  @ApiResponse({
    status: 200,
    description: 'Refund processed',
  })
  @ApiResponse({ status: 400, description: 'Cannot process refund' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async processRefund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessRefundDto,
  ): Promise<DepositView> {
    return this.depositService.processRefund(id, dto);
  }

  /**
   * Forfeit a deposit
   */
  @Post(':id/forfeit')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({ summary: 'Forfeit a deposit' })
  @ApiParam({ name: 'id', description: 'Deposit UUID' })
  @ApiBody({ type: ForfeitDepositDto })
  @ApiResponse({
    status: 200,
    description: 'Deposit forfeited',
  })
  @ApiResponse({ status: 400, description: 'Invalid deposit status' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async forfeit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ForfeitDepositDto,
  ): Promise<DepositView> {
    return this.depositService.forfeit(id, dto);
  }

  /**
   * Finalize deposit: apply approved claims as deductions and process refund
   */
  @Post(':id/finalize')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Finalize deposit refund',
    description:
      'Apply all approved claims as deductions, mark claims as SETTLED, and process refund of remaining amount. Tenancy must be TERMINATED.',
  })
  @ApiParam({ name: 'id', description: 'Deposit UUID' })
  @ApiBody({ type: FinalizeDepositDto })
  @ApiResponse({
    status: 200,
    description: 'Deposit finalized with claims applied and refund processed',
  })
  @ApiResponse({ status: 400, description: 'Invalid deposit/tenancy status' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async finalize(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinalizeDepositDto,
  ): Promise<{
    deposit: DepositView;
    claimsApplied: Array<{
      claimId: string;
      claimNumber: string;
      amount: number;
    }>;
    totalDeductions: number;
    refundedAmount: number;
  }> {
    // Use a placeholder userId — in production this comes from JWT
    return this.depositService.finalizeRefund(id, dto, 'system');
  }
}
