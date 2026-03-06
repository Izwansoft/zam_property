import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';

import {
  RentPaymentService,
  PaymentView,
  PaymentListResult,
} from './payment.service';
import {
  ReconciliationService,
  BillingReconciliationResult,
  TenancyReconciliationResult,
  OverpaymentResult,
  AdvancePaymentResult,
  MatchResult,
} from './reconciliation';
import {
  CreatePaymentIntentDto,
  RecordManualPaymentDto,
  PaymentQueryDto,
  ReassignPaymentDto,
  AdvancePaymentDto,
} from './dto';

/**
 * Controller for managing rent payments
 */
@ApiTags('Rent Payments')
@ApiBearerAuth()
@Controller('rent-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentPaymentController {
  constructor(
    private readonly paymentService: RentPaymentService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Static routes (MUST come before :id parameterized routes)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a payment intent for online payment (Stripe / FPX)
   */
  @Post('intent')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Create a payment intent for a billing statement' })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created. Use clientSecret for frontend Stripe checkout.',
  })
  @ApiResponse({ status: 400, description: 'Bad request - billing not payable or amount exceeds balance' })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentView> {
    return this.paymentService.createPaymentIntent(dto);
  }

  /**
   * Record a manual/offline payment (bank transfer, cash)
   */
  @Post('manual')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Record a manual payment (bank transfer, cash)' })
  @ApiResponse({
    status: 201,
    description: 'Manual payment recorded and billing updated',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async recordManualPayment(
    @Body() dto: RecordManualPaymentDto,
  ): Promise<PaymentView> {
    return this.paymentService.recordManualPayment(dto);
  }

  /**
   * Get FPX bank list for Malaysia
   */
  @Get('fpx/banks')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Get list of FPX-supported banks for Malaysia' })
  @ApiResponse({
    status: 200,
    description: 'FPX bank list',
  })
  getFpxBanks() {
    return this.paymentService.getFpxBanks();
  }

  /**
   * Advance/batch payment: distribute amount across outstanding billings
   */
  @Post('advance')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Distribute a lump-sum payment across outstanding billings (oldest first)' })
  @ApiResponse({
    status: 201,
    description: 'Advance payment distributed across billings',
  })
  @ApiResponse({ status: 400, description: 'No outstanding billings' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async advancePayment(
    @Body() dto: AdvancePaymentDto,
  ): Promise<AdvancePaymentResult> {
    return this.reconciliationService.handleAdvancePayment(dto);
  }

  /**
   * Reassign a payment from one billing to another
   */
  @Post('reassign')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reassign a completed payment to a different billing' })
  @ApiResponse({
    status: 200,
    description: 'Payment reassigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Payment not completed or same billing' })
  @ApiResponse({ status: 404, description: 'Payment or billing not found' })
  async reassignPayment(
    @Body() dto: ReassignPaymentDto,
  ): Promise<PaymentView> {
    return this.reconciliationService.reassignPayment(dto);
  }

  /**
   * Reconcile a single billing (recalculate from payments)
   */
  @Post('reconcile/billing/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reconcile a billing — recalculate paidAmount from its payments' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Billing reconciled',
  })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async reconcileBilling(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BillingReconciliationResult> {
    return this.reconciliationService.reconcileBilling(id);
  }

  /**
   * Reconcile all billings for a tenancy
   */
  @Post('reconcile/tenancy/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch-reconcile all billings for a tenancy' })
  @ApiParam({ name: 'id', description: 'Tenancy ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenancy billings reconciled',
  })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async reconcileTenancy(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TenancyReconciliationResult> {
    return this.reconciliationService.reconcileTenancy(id);
  }

  /**
   * Handle overpayment on a billing (apply excess to next bill)
   */
  @Post('overpayment/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect and resolve overpayment on a billing' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Overpayment handled (credit applied to next bill if available)',
  })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async handleOverpayment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OverpaymentResult> {
    return this.reconciliationService.handleOverpayment(id);
  }

  /**
   * Auto-match a payment to the best billing
   */
  @Post('match/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-match or manually assign a payment to a billing' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment matched to billing',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async matchPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { billingId?: string },
  ): Promise<MatchResult> {
    return this.reconciliationService.matchPaymentToBill(id, body?.billingId);
  }

  /**
   * List payments with filtering and pagination
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'List rent payments with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of payments',
  })
  async listPayments(
    @Query() query: PaymentQueryDto,
  ): Promise<PaymentListResult> {
    return this.paymentService.listPayments(query);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Parameterized routes
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get a specific payment by ID
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Get a specific payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details',
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentView> {
    return this.paymentService.getPayment(id);
  }

  /**
   * Download payment receipt as PDF
   */
  @Get(':id/receipt')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Download payment receipt as PDF' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Payment receipt PDF',
  })
  @ApiResponse({ status: 400, description: 'Receipt only available for completed payments' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async downloadReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.paymentService.generateReceipt(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
