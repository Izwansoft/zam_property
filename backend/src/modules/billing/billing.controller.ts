import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
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
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';

import { RentBillingService, BillingView, BillingListResult } from './billing.service';
import { ReminderService, ReminderView, SendReminderResult } from './reminder';
import {
  GenerateBillDto,
  AddLineItemDto,
  ApplyLateFeeDto,
  BillingQueryDto,
  UpdateBillingConfigDto,
  SendReminderDto,
  BulkProcessBillsDto,
} from './dto';

/**
 * Controller for managing rent billing (invoices)
 */
@ApiTags('Rent Billing')
@ApiBearerAuth()
@Controller('rent-billings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentBillingController {
  constructor(
    private readonly billingService: RentBillingService,
    private readonly reminderService: ReminderService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Static routes (MUST come before :id parameterized routes)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a new bill for a tenancy period
   */
  @Post('generate')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Generate a billing statement for a tenancy period' })
  @ApiResponse({
    status: 201,
    description: 'Bill generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - tenancy not in billable state' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  @ApiResponse({ status: 409, description: 'Bill already exists for this period' })
  async generateBill(@Body() dto: GenerateBillDto): Promise<BillingView> {
    return this.billingService.generateBill(dto);
  }

  /**
   * Get billing automation status for the partner
   */
  @Get('automation/status')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Get billing automation status and summary' })
  @ApiResponse({
    status: 200,
    description: 'Automation status retrieved',
  })
  async getAutomationStatus() {
    return this.billingService.getAutomationStatus();
  }

  /**
   * Get billing configuration for a tenancy
   */
  @Get('config/:tenancyId')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Get billing configuration for a tenancy' })
  @ApiParam({ name: 'tenancyId', description: 'Tenancy ID' })
  @ApiResponse({
    status: 200,
    description: 'Billing configuration retrieved',
  })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async getBillingConfig(
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
  ) {
    return this.billingService.getBillingConfig(tenancyId);
  }

  /**
   * Update billing configuration for a tenancy
   */
  @Patch('config/:tenancyId')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Update billing configuration (billing day, grace period, late fee %)' })
  @ApiParam({ name: 'tenancyId', description: 'Tenancy ID' })
  @ApiResponse({
    status: 200,
    description: 'Billing configuration updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid configuration values' })
  @ApiResponse({ status: 404, description: 'Tenancy not found' })
  async updateBillingConfig(
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
    @Body() dto: UpdateBillingConfigDto,
  ) {
    return this.billingService.updateBillingConfig(tenancyId, dto);
  }

  /**
   * List bills with filtering and pagination
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'List billing statements with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Bills retrieved successfully',
  })
  async listBills(@Query() query: BillingQueryDto): Promise<BillingListResult> {
    return this.billingService.listBills(query);
  }

  /**
   * Bulk process bills (send or write-off)
   */
  @Post('bulk-process')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk process bills (send or write-off)',
    description: 'Processes multiple billing IDs with one action. Returns per-item results.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk processing results',
  })
  async bulkProcess(@Body() dto: BulkProcessBillsDto) {
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const billingId of dto.billingIds) {
      try {
        if (dto.action === 'send') {
          await this.billingService.markAsSent(billingId);
        } else {
          await this.billingService.writeOff(billingId);
        }
        results.push({ id: billingId, success: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ id: billingId, success: false, error: message });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      data: {
        results,
        summary: { total: dto.billingIds.length, succeeded, failed },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Parameterized :id routes
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Send a payment reminder for a billing (manual trigger)
   */
  @Post(':id/remind')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a payment reminder to the tenant (manual)' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Billing not in remindable status or duplicate sequence' })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async sendReminder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendReminderDto,
  ): Promise<SendReminderResult> {
    return this.reminderService.sendReminder(id, dto.sequence);
  }

  /**
   * Get reminder history for a billing
   */
  @Get(':id/reminders')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Get reminder history for a billing' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder history retrieved',
  })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async listReminders(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReminderView[]> {
    return this.reminderService.listReminders(id);
  }

  /**
   * Escalate billing to legal action
   */
  @Post(':id/escalate')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalate billing to legal action (sends legal notice)' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Legal notice sent and billing flagged for legal action',
  })
  @ApiResponse({ status: 400, description: 'Legal notice already sent for this billing' })
  @ApiResponse({ status: 404, description: 'Billing not found' })
  async escalateToLegal(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SendReminderResult> {
    return this.reminderService.escalateToLegal(id);
  }

  /**
   * Get a specific bill by ID
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Get a billing statement by ID' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Bill retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async getBill(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BillingView> {
    return this.billingService.getBill(id);
  }

  /**
   * Download bill as PDF
   */
  @Get(':id/download')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN, Role.TENANT)
  @ApiOperation({ summary: 'Download billing statement as PDF' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF generated and returned',
  })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async downloadBillPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.billingService.generateBillPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  /**
   * Add a line item to an existing bill
   */
  @Post(':id/line-items')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({ summary: 'Add a line item to an existing bill' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 201,
    description: 'Line item added successfully',
  })
  @ApiResponse({ status: 400, description: 'Bill not in editable status' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async addLineItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddLineItemDto,
  ): Promise<BillingView> {
    return this.billingService.addLineItem(id, dto);
  }

  /**
   * Apply late fee to a bill
   */
  @Post(':id/late-fee')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply late fee to a bill based on rent amount' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Late fee applied successfully',
  })
  @ApiResponse({ status: 400, description: 'Bill not in applicable status or no fee configured' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async applyLateFee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyLateFeeDto,
  ): Promise<BillingView> {
    return this.billingService.applyLateFee(id, dto);
  }

  /**
   * Mark a bill as sent
   */
  @Post(':id/send')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark bill as sent to tenant' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Bill marked as sent',
  })
  @ApiResponse({ status: 400, description: 'Bill not in GENERATED status' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async markAsSent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BillingView> {
    return this.billingService.markAsSent(id);
  }

  /**
   * Mark a bill as overdue
   */
  @Post(':id/overdue')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark bill as overdue' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Bill marked as overdue',
  })
  @ApiResponse({ status: 400, description: 'Bill not in valid status for overdue transition' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async markAsOverdue(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BillingView> {
    return this.billingService.markAsOverdue(id);
  }

  /**
   * Write off a bill
   */
  @Post(':id/write-off')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Write off a bill as uncollectable' })
  @ApiParam({ name: 'id', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Bill written off',
  })
  @ApiResponse({ status: 400, description: 'Bill already paid or written off' })
  @ApiResponse({ status: 404, description: 'Bill not found' })
  async writeOff(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BillingView> {
    return this.billingService.writeOff(id);
  }
}
