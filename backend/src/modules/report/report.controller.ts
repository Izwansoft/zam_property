/**
 * Financial Reports Controller
 * Session 6.8 - Phase 6 Testing & Reports
 *
 * Endpoints:
 * - GET /reports/revenue      — Platform revenue (fee income)
 * - GET /reports/collections   — Rent collection summary
 * - GET /reports/outstanding   — Outstanding / overdue bills
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@core/auth';
import { Roles, RolesGuard } from '@core/rbac';

import { ReportService } from './report.service';
import {
  RevenueReportQueryDto,
  CollectionReportQueryDto,
  OutstandingReportQueryDto,
} from './dto';

@ApiTags('Financial Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Revenue Report
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get platform revenue report — aggregated platform fee income from payouts.
   */
  @Get('revenue')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({ summary: 'Get revenue report (platform fee income)' })
  @ApiResponse({ status: 200, description: 'Revenue report data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRevenueReport(@Query() query: RevenueReportQueryDto) {
    const result = await this.reportService.getRevenueReport({
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      period: query.period,
      ownerId: query.ownerId,
    });

    return { data: result };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Collections Report
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get rent collection report — billed vs collected with rates.
   */
  @Get('collections')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({ summary: 'Get rent collection report' })
  @ApiResponse({ status: 200, description: 'Collection report data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCollectionReport(@Query() query: CollectionReportQueryDto) {
    const result = await this.reportService.getCollectionReport({
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      period: query.period,
      tenancyId: query.tenancyId,
    });

    return { data: result };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Outstanding Report
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get outstanding bills report — unpaid/overdue bills with aging buckets.
   */
  @Get('outstanding')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN)
  @ApiOperation({ summary: 'Get outstanding bills report' })
  @ApiResponse({ status: 200, description: 'Outstanding report data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOutstandingReport(@Query() query: OutstandingReportQueryDto) {
    const result = await this.reportService.getOutstandingReport({
      asOfDate: query.asOfDate ? new Date(query.asOfDate) : undefined,
      ownerId: query.ownerId,
      tenancyId: query.tenancyId,
    });

    return { data: result };
  }
}
