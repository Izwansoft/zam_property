/**
 * CommissionController
 * Session 8.3 - Agent Commission
 *
 * REST endpoints for commission management.
 * Endpoints:
 *   POST   /commissions                  - Calculate & create commission
 *   GET    /commissions                  - List commissions (all)
 *   GET    /commissions/:id              - Get commission details
 *   POST   /commissions/:id/approve      - Approve commission
 *   POST   /commissions/:id/pay          - Mark commission as paid
 *   POST   /commissions/:id/cancel       - Cancel commission
 *   GET    /agents/:id/commissions       - List agent's commissions (on AgentController)
 *   GET    /agents/:id/commissions/summary - Agent commission summary
 */

import {
  Controller,
  Get,
  Post,
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
import {
  CommissionService,
  CommissionView,
  CommissionListResult,
  CommissionSummary,
} from './commission.service';
import {
  CalculateCommissionDto,
  CommissionQueryDto,
  ApproveCommissionDto,
  MarkPaidDto,
} from './dto';

interface SuccessResponse<T> {
  data: T;
}

@ApiTags('Commissions')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // ============================================
  // POST /commissions - Calculate & create commission
  // ============================================

  @Post('commissions')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Calculate and create a commission' })
  @ApiResponse({ status: 201, description: 'Commission created' })
  async calculateCommission(
    @Body() dto: CalculateCommissionDto,
  ): Promise<SuccessResponse<CommissionView>> {
    const data = await this.commissionService.calculateCommission(dto);
    return { data };
  }

  // ============================================
  // GET /commissions - List all commissions
  // ============================================

  @Get('commissions')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List all commissions (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of commissions' })
  async listCommissions(
    @Query() query: CommissionQueryDto,
  ): Promise<SuccessResponse<CommissionListResult>> {
    const data = await this.commissionService.listCommissions(query);
    return { data };
  }

  // ============================================
  // GET /commissions/:id - Get commission details
  // ============================================

  @Get('commissions/:id')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: 'Get commission details' })
  @ApiParam({ name: 'id', description: 'Commission ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Commission details' })
  async getCommission(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<CommissionView>> {
    const data = await this.commissionService.getCommission(id);
    return { data };
  }

  // ============================================
  // POST /commissions/:id/approve - Approve commission
  // ============================================

  @Post('commissions/:id/approve')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending commission' })
  @ApiParam({ name: 'id', description: 'Commission ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Commission approved' })
  async approveCommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: ApproveCommissionDto,
  ): Promise<SuccessResponse<CommissionView>> {
    const data = await this.commissionService.approveCommission(id, req.user.sub, dto);
    return { data };
  }

  // ============================================
  // POST /commissions/:id/pay - Mark commission as paid
  // ============================================

  @Post('commissions/:id/pay')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an approved commission as paid' })
  @ApiParam({ name: 'id', description: 'Commission ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Commission marked as paid' })
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPaidDto,
  ): Promise<SuccessResponse<CommissionView>> {
    const data = await this.commissionService.markPaid(id, dto);
    return { data };
  }

  // ============================================
  // POST /commissions/:id/cancel - Cancel commission
  // ============================================

  @Post('commissions/:id/cancel')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a commission (not paid)' })
  @ApiParam({ name: 'id', description: 'Commission ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Commission cancelled' })
  async cancelCommission(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<CommissionView>> {
    const data = await this.commissionService.cancelCommission(id);
    return { data };
  }

  // ============================================
  // GET /agents/:id/commissions - List agent's commissions
  // ============================================

  @Get('agents/:id/commissions')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "List agent's commissions" })
  @ApiParam({ name: 'id', description: 'Agent ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: "Agent's commissions" })
  async listAgentCommissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CommissionQueryDto,
  ): Promise<SuccessResponse<CommissionListResult>> {
    const data = await this.commissionService.listAgentCommissions(id, query);
    return { data };
  }

  // ============================================
  // GET /agents/:id/commissions/summary - Agent commission summary
  // ============================================

  @Get('agents/:id/commissions/summary')
  @Roles(Role.SUPER_ADMIN, Role.PARTNER_ADMIN, Role.COMPANY_ADMIN, Role.AGENT)
  @ApiOperation({ summary: "Get agent's commission summary" })
  @ApiParam({ name: 'id', description: 'Agent ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Commission summary' })
  async getAgentCommissionSummary(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SuccessResponse<CommissionSummary>> {
    const data = await this.commissionService.getAgentCommissionSummary(id);
    return { data };
  }
}
