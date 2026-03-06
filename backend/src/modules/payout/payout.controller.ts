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

import {
  PayoutService,
  PayoutView,
  PayoutListResult,
  CalculatePayoutResult,
  ApprovePayoutResult,
  ProcessBatchResult,
} from './payout.service';
import {
  CalculatePayoutDto,
  PayoutQueryDto,
  ApprovePayoutDto,
  ProcessBatchDto,
  BankFileQueryDto,
} from './dto';

/**
 * Controller for managing owner payouts
 */
@ApiTags('Owner Payouts')
@ApiBearerAuth()
@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Static routes (MUST come before :id parameterized routes)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calculate and create a payout for an owner over a period
   */
  @Post('calculate')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Calculate payout for an owner',
    description:
      'Calculates gross rental, deducts platform fees, and creates a payout record ' +
      'with line items for all completed payments in the specified period.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payout calculated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid period or no tenancies' })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  @ApiResponse({ status: 409, description: 'Overlapping payout already exists' })
  async calculatePayout(@Body() dto: CalculatePayoutDto): Promise<CalculatePayoutResult> {
    return this.payoutService.calculatePayout(
      dto.ownerId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      dto.platformFeePercent,
    );
  }

  /**
   * Batch process approved payouts
   */
  @Post('process-batch')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process approved payouts in batch',
    description:
      'Processes all approved payouts (or specific IDs). Marks them PROCESSING → COMPLETED/FAILED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch processing results',
  })
  @ApiResponse({ status: 400, description: 'No approved payouts found' })
  async processBatch(@Body() dto: ProcessBatchDto): Promise<ProcessBatchResult> {
    return this.payoutService.processBatch(dto.payoutIds);
  }

  /**
   * Generate a bank file (CSV) for approved payouts
   */
  @Get('bank-file')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({
    summary: 'Download bank file for approved payouts',
    description:
      'Generates a CSV file for bulk bank transfer of approved payouts. ' +
      'Compatible with Malaysian bank IBG/FPX bulk transfer formats.',
  })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV bank file generated',
  })
  @ApiResponse({ status: 400, description: 'No approved payouts found' })
  async downloadBankFile(
    @Query() query: BankFileQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const { csv, filename, count } = await this.payoutService.generateBankFile(query.payoutIds);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': Buffer.byteLength(csv, 'utf-8'),
      'X-Payout-Count': String(count),
    });

    res.end(csv);
  }

  /**
   * List payouts with optional filtering and pagination
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'List owner payouts',
    description:
      'Returns paginated list of payouts with optional filters by owner, status, and period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payouts retrieved successfully',
  })
  async listPayouts(@Query() query: PayoutQueryDto): Promise<PayoutListResult> {
    return this.payoutService.listPayouts({
      ownerId: query.ownerId,
      status: query.status,
      periodStart: query.periodStart ? new Date(query.periodStart) : undefined,
      periodEnd: query.periodEnd ? new Date(query.periodEnd) : undefined,
      page: query.page,
      limit: query.pageSize,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Parameterized routes
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get a single payout by ID with all line items
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Get payout details',
    description: 'Returns a single payout with all line items.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payout ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout details retrieved',
  })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async getPayout(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PayoutView> {
    return this.payoutService.getPayout(id);
  }

  /**
   * Approve a calculated payout
   */
  @Post(':id/approve')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve payout for processing',
    description:
      'Approves a CALCULATED payout. Snapshots owner bank details at approval time.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payout ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout approved successfully',
  })
  @ApiResponse({ status: 400, description: 'Payout not in CALCULATED status' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async approvePayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePayoutDto,
  ): Promise<ApprovePayoutResult> {
    return this.payoutService.approvePayout(id, dto.approvedBy);
  }

  /**
   * Download payout statement as PDF
   */
  @Get(':id/statement')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.VENDOR_ADMIN)
  @ApiOperation({
    summary: 'Download payout statement PDF',
    description: 'Generates a payout statement PDF with line items and summary.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payout ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF statement generated',
  })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async downloadStatement(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.payoutService.generatePayoutStatementPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
